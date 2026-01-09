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
// PINECONE_INDEX=dinov2-embeddings
// PINECONE_ENVIRONMENT=us-east-1-aws

const {
  GCP_PROJECT_ID,
  VERTEX_LOCATION = 'us-east-1',
  PINECONE_API_KEY,
  // default to the DINOv2 embeddings index with permanent IDs
  PINECONE_INDEX = 'dinov2-embeddings-with-permanent-ids',
  PORT = process.env.PORT || 3001,
} = process.env;

// DINOv2 configuration constants
const EMBEDDING_DIMENSION = 768;

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

// ---------- Local DINOv2 embedding helper ----------
let dinov2Extractor = null;

async function getDinov2Extractor() {
  if (dinov2Extractor) return dinov2Extractor;

  console.log('Loading DINOv2 model...');
  const startTime = Date.now();

  // Load DINOv2 using pipeline for image feature extraction
  dinov2Extractor = await pipeline('image-feature-extraction', 'Xenova/dinov2-base');

  const loadTime = Date.now() - startTime;
  console.log(`DINOv2 model loaded in ${loadTime}ms`);

  return dinov2Extractor;
}

async function embedImageBase64(base64Data, mimeType = 'image/png') {
  const extractor = await getDinov2Extractor();
  const buffer = Buffer.from(base64Data, 'base64');

  // Load image with sharp to get dimensions and preprocess
  const image = sharp(buffer);
  const metadata = await image.metadata();
  console.log(`Input image dimensions: ${metadata.width}x${metadata.height}`);

  // Resize all images to 224x224, preserving aspect ratio using padding (contain)
  const processedBuffer = await image
    .resize(224, 224, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 1 }
    })
    .jpeg()
    .toBuffer();

  const processedMetadata = await sharp(processedBuffer).metadata();
  console.log(`Preprocessed image dimensions: ${processedMetadata.width}x${processedMetadata.height}`);

  // Save as temporary file
  const tempPath = path.join(os.tmpdir(), `temp_image_${Date.now()}.jpg`);
  fs.writeFileSync(tempPath, processedBuffer);

  try {
    // Pass the file path to the extractor
    const output = await extractor(tempPath);

    // Verify output shape and extract the CLS token (first EMBEDDING_DIMENSION values)
    // DINOv2 outputs [1, 1, 768] for feature extraction; CLS is the first token
    const clsEmbedding = Array.from(output.data).slice(0, EMBEDDING_DIMENSION);

    // Normalize the embedding vector safely (guard against zero-norm)
    const squaredSum = clsEmbedding.reduce((sum, val) => sum + val * val, 0);
    const magnitude = Math.sqrt(squaredSum);
    
    if (magnitude === 0) {
      console.warn('Warning: Zero-norm embedding encountered');
      return new Array(EMBEDDING_DIMENSION).fill(0);
    }
    
    console.log(`Embedding norm: ${magnitude.toFixed(4)}`);
    const normalizedEmbedding = clsEmbedding.map(val => val / magnitude);

    return normalizedEmbedding;
  } finally {
    // Clean up temporary file
    try {
      fs.unlinkSync(tempPath);
    } catch (cleanupError) {
      console.warn('Failed to cleanup temp file:', cleanupError);
    }
  }
}

// DINOv2 produces exactly 768-dimensional embeddings, no padding needed

// ---------- Pinecone client ----------
const pinecone = new Pinecone({
  apiKey: PINECONE_API_KEY,
});
const pineconeIndex = pinecone.index(PINECONE_INDEX);

// ---------- Load fragrance metadata once ----------
const FRAGRANCE_PATH = path.join(process.cwd(), 'fragrances_filtered.json');
let fragranceMap = {};
try {
  const raw = fs.readFileSync(FRAGRANCE_PATH, 'utf-8');
  const array = JSON.parse(raw);
  array.forEach(f => {
    if (f.id) {
      fragranceMap[f.id] = f;
    }
  });
  console.log(`Loaded ${Object.keys(fragranceMap).length} fragrances into lookup map`);
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

    // 1) Embed with timing
    const embedStart = Date.now();
    const embedding = await embedImageBase64(base64);
    const embedTime = Date.now() - embedStart;

    if (!embedding.length) {
      return res.status(500).json({ error: 'No embedding returned' });
    }

    // 2) Query Pinecone with timing
    const queryStart = Date.now();
    const query = await pineconeIndex.query({
      topK: 10, // Increased topK to 10
      vector: embedding,
      includeMetadata: true,
    });
    const queryTime = Date.now() - queryStart;

    // Log top 5 query scores
    const topScores = query.matches.slice(0, 5).map(m => m.score.toFixed(4));
    console.log(`Top 5 query scores: [${topScores.join(', ')}]`);

    // 3) Build response with local metadata fallback
    // Removed hard similarity filtering to let client decide
    const matches = (query.matches || [])
      .map((m) => {
        // Try stable ID first, then fallback to jsonIndex for legacy vectors
        const fragranceId = m.metadata?.fragranceId;
        const jsonIdx = m.metadata?.jsonIndex;
        
        const fragrance = fragranceId && fragranceMap[fragranceId] 
          ? fragranceMap[fragranceId]
          : (typeof jsonIdx === 'number' ? Object.values(fragranceMap)[jsonIdx] : null);

        return {
          score: m.score,
          id: m.id,
          metadata: m.metadata,
          fragrance,
        };
      });

    res.json({
      matches,
      timing: {
        embeddingTime: embedTime,
        queryTime: queryTime,
        totalTime: embedTime + queryTime
      }
    });
  } catch (err) {
    console.error('Scan error:', err);
    res.status(500).json({ error: 'Scan failed', details: err.message });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    model: "DINOv2-base",
    embeddingDimension: EMBEDDING_DIMENSION,
    pineconeIndex: PINECONE_INDEX
  });
});

// Serve static files from Vite build
app.use(express.static(path.join(__dirname, 'dist')));

// Handle client-side routing - send all other requests to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Preload DINOv2 model on startup for faster first requests (skip on Railway to avoid startup issues)
const isRailway = process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID;

if (!isRailway) {
  (async () => {
    try {
      console.log('Preloading DINOv2 model...');
      await getDinov2Extractor();
      console.log('DINOv2 model preloaded successfully');
    } catch (error) {
      console.error('Failed to preload DINOv2 model:', error);
      // Continue starting server even if model preload fails
    }
  })();
} else {
  console.log('Skipping DINOv2 model preload on Railway deployment');
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on 0.0.0.0:${PORT}`);
});


