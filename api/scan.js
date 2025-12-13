import { pipeline } from '@xenova/transformers';
import { Pinecone } from '@pinecone-database/pinecone';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Environment variables (set in Vercel dashboard)
const {
  PINECONE_API_KEY,
  PINECONE_INDEX = 'ndexforimagerecognition-img',
  PINECONE_DIM = '2048',
} = process.env;

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
// Note: In serverless, this will be loaded per function invocation
let fragranceCache = [];
try {
  // In Vercel, files need to be in the project root or use proper paths
  const data = fs.readFileSync(path.join(process.cwd(), 'fragrances_filtered.json'), 'utf-8');
  fragranceCache = JSON.parse(data);
} catch (err) {
  console.error('Failed to load fragrances_filtered.json', err);
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Missing image' });
    }

    // Extract base64 data
    const base64 = image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

    // 1) Embed image
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

    res.status(200).json({ matches });
  } catch (err) {
    console.error('Scan error:', err);
    res.status(500).json({ error: 'Scan failed', details: err.message });
  }
}
