import fs from 'fs';
import path from 'path';
import os from 'os';
import fetch from 'node-fetch';
import { Pinecone } from '@pinecone-database/pinecone';
import { pipeline } from '@xenova/transformers';
import sharp from 'sharp';

const PINECONE_API_KEY = 'pcsk_3hH679_Mj82WvAP5xEu5bDw1JaDmz1ZZheUnKZxcAZEwQ9cKLGxFyQ85XNowVjpFjke969';
const PINECONE_INDEX = 'dinov2-embeddings-with-permanent-ids';
const PINECONE_DIM = '768';
const BATCH_SIZE = 5;

let clipExtractor = null;
async function getClipExtractor() {
  if (clipExtractor) return clipExtractor;
  // Use CLIP model for 512-dimensional embeddings
  clipExtractor = await pipeline('image-feature-extraction', 'Xenova/clip-vit-base-patch32');
  return clipExtractor;
}

function padVector(vec, targetDim) {
  const out = vec.slice(0, targetDim);
  while (out.length < targetDim) out.push(0);
  return out;
}

async function downloadImage(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch ${url}: ${resp.status}`);
  const buf = await resp.arrayBuffer();
  return { buffer: Buffer.from(buf), mimeType: resp.headers.get('content-type') || 'image/jpeg' };
}

async function embedImage(buffer, mimeType) {
  const extractor = await getClipExtractor();

  // Convert to JPEG format and save as temporary file (transformers works better with file paths)
  const jpegBuffer = await sharp(buffer).jpeg().toBuffer();
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

async function main() {
  const dataPath = path.join(process.cwd(), 'fragrances_filtered.json');
  const raw = fs.readFileSync(dataPath, 'utf-8');
  const fragrances = JSON.parse(raw);

  const pinecone = new Pinecone({ apiKey: PINECONE_API_KEY });
  const index = pinecone.index(PINECONE_INDEX);

  const points = [];
  const targetDim = parseInt(PINECONE_DIM, 10) || 512;

  for (let i = 0; i < fragrances.length; i++) {
    const f = fragrances[i];
    const url = f['Image URL'];
    if (!url) {
      console.log(`Skipping ${i}: no image URL`);
      continue;
    }
    try {
      const { buffer, mimeType } = await downloadImage(url);
      const embeddingRaw = await embedImage(buffer, mimeType);
      if (!embeddingRaw.length) {
        console.warn(`No embedding for ${i}: ${f.Name}`);
        continue;
      }
      console.log(`Embedding ${i}: ${f.Name} - got ${embeddingRaw.length} dimensions`);
      const embedding = padVector(embeddingRaw, targetDim);
      points.push({
        id: `fragrance-${i}`,
        values: embedding,
        metadata: {
          name: f.Name || '',
          brand: f.Brand || '',
          jsonIndex: i,
          imageUrl: url,
        },
      });
      if (points.length >= BATCH_SIZE) {
        await index.upsert(points);
        console.log(`Upserted ${points.length} vectors (last idx ${i})`);
        points.length = 0;
      }

    } catch (err) {
      console.error(`Failed on ${i}: ${f.Name} - ${err.message}`);
    }
  }

  if (points.length) {
    await index.upsert(points);
    console.log(`Upserted final ${points.length} vectors`);
  }

  console.log('Ingestion complete');
}

main().catch((err) => {
  console.error('Ingestion failed:', err);
  process.exit(1);
});
