import express from 'express';
import fetch from 'node-fetch';
import { Pinecone } from '@pinecone-database/pinecone';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { pipeline } from '@xenova/transformers';
import sharp from 'sharp';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Environment expectations (do NOT hardcode secrets):
// GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service_account.json
// GCP_PROJECT_ID=heroic-calculus-480802-e3
// VERTEX_LOCATION=us-central1 (or your chosen region)
// PINECONE_API_KEY=...
// PINECONE_INDEX=indexforimagerecognition
// PINECONE_ENVIRONMENT=us-east-1-aws

const {
  GCP_PROJECT_ID,
  VERTEX_LOCATION = 'us-east-1',
  PINECONE_API_KEY,
  // default to the newly created image index; override via env if needed
  PINECONE_INDEX = 'scentir-clip-embeddings',
  // Pinecone index dimension (for padding/truncation)
  PINECONE_DIM = '1024',
  PORT = process.env.PORT || 3001,
} = process.env;

if (!PINECONE_API_KEY) {
  console.error('Missing PINECONE_API_KEY env var');
  process.exit(1);
}

const app = express();

// CORS middleware for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json({ limit: '12mb' })); // allow base64 images

// ---------- Local CLIP embedding helper ----------
let clipExtractor = null;
async function getClipExtractor() {
  if (clipExtractor) return clipExtractor;
  // Use larger CLIP model for 1024-dimensional embeddings (768 + padding)
  clipExtractor = await pipeline('image-feature-extraction', 'Xenova/clip-vit-large-patch14');
  return clipExtractor;
}

async function embedImageBase64(base64Data, mimeType = 'image/png') {
  const extractor = await getClipExtractor();
  const buffer = Buffer.from(base64Data, 'base64');

  // Convert to JPEG format
  const jpegBuffer = await sharp(buffer).jpeg().toBuffer();

  // Save as temporary file (transformers works better with file paths)
  const tempPath = path.join(os.tmpdir(), `temp_image_${Date.now()}.jpg`);
  fs.writeFileSync(tempPath, jpegBuffer);

  try {
    // Pass the file path to the extractor
    const output = await extractor(tempPath, { pooling: 'mean', normalize: true });

    // output.data is Float32Array
    return Array.from(output.data);
  } finally {
    // Clean up temporary file
    try {
      fs.unlinkSync(tempPath);
    } catch (cleanupError) {
      console.warn('Failed to cleanup temp file:', cleanupError);
    }
  }
}

function padVector(vec, targetDim) {
  const out = vec.slice(0, targetDim);
  while (out.length < targetDim) out.push(0);
  return out;
}

// ---------- Pinecone client ----------
const pinecone = new Pinecone({
  apiKey: PINECONE_API_KEY,
});
const pineconeIndex = pinecone.index(PINECONE_INDEX);

// ---------- Load fragrance metadata once ----------
const FRAGRANCE_PATH = path.join(process.cwd(), 'fragrances_filtered.json');
let fragranceCache = [];
try {
  const raw = fs.readFileSync(FRAGRANCE_PATH, 'utf-8');
  fragranceCache = JSON.parse(raw);
} catch (err) {
  console.error('Failed to load fragrances_filtered.json', err);
}

// ---------- API: scan ----------
app.post('/api/scan', async (req, res) => {
  try {
    const { image } = req.body; // expects data URL or raw base64
    if (!image) {
      return res.status(400).json({ error: 'Missing image' });
    }
    const base64 = image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

    // 1) Embed
    const embeddingRaw = await embedImageBase64(base64);
    if (!embeddingRaw.length) {
      return res.status(500).json({ error: 'No embedding returned' });
    }
    const targetDim = parseInt(PINECONE_DIM, 10) || 1024;
    const embedding = padVector(embeddingRaw, targetDim);

    // 2) Query Pinecone
    const query = await pineconeIndex.query({
      topK: 5,
      vector: embedding,
      includeMetadata: true,
    });

    // 3) Build response with local metadata fallback
    const matches = (query.matches || []).map((m) => {
      const idx = m.metadata?.jsonIndex;
      const fragrance =
        typeof idx === 'number' && fragranceCache[idx]
          ? fragranceCache[idx]
          : null;
      return {
        score: m.score,
        id: m.id,
        metadata: m.metadata,
        fragrance,
      };
    });

    res.json({ matches });
  } catch (err) {
    console.error('Scan error:', err);
    res.status(500).json({ error: 'Scan failed', details: err.message });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Serve static files from Vite build
app.use(express.static(path.join(__dirname, 'dist')));

// Handle client-side routing - send all other requests to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


