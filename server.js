import express from 'express';
import fetch from 'node-fetch';
import { Pinecone } from '@pinecone-database/pinecone';
import fs from 'fs';
import path from 'path';
import { pipeline } from '@xenova/transformers';
import sharp from 'sharp';

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
  PINECONE_INDEX = 'ndexforimagerecognition-img',
  // Pinecone index dimension (for padding/truncation)
  PINECONE_DIM = '2048',
  PORT = 3001,
} = process.env;

if (!GCP_PROJECT_ID) {
  console.error('Missing GCP_PROJECT_ID env var');
}
if (!PINECONE_API_KEY) {
  console.error('Missing PINECONE_API_KEY env var');
}

const app = express();
app.use(express.json({ limit: '12mb' })); // allow base64 images

// ---------- Local CLIP embedding helper ----------
let clipExtractor = null;
async function getClipExtractor() {
  if (clipExtractor) return clipExtractor;
  // Use image-feature-extraction task for CLIP
  clipExtractor = await pipeline('image-feature-extraction', 'Xenova/clip-vit-base-patch32');
  return clipExtractor;
}

async function embedImageBase64(base64Data, mimeType = 'image/png') {
  const extractor = await getClipExtractor();
  const buffer = Buffer.from(base64Data, 'base64');
  // Decode image to raw pixels to avoid unsupported input types
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const input = {
    data: new Uint8Array(data),
    width: info.width,
    height: info.height,
    channels: info.channels, // likely 4 with alpha
  };
  const output = await extractor(input, { pooling: 'mean', normalize: true });
  // output.data is Float32Array
  return Array.from(output.data);
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
    const targetDim = parseInt(PINECONE_DIM, 10) || 2048;
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

app.listen(PORT, () => {
  console.log(`Scan API listening on :${PORT}`);
});


