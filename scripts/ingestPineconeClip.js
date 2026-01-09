import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { Pinecone } from '@pinecone-database/pinecone';
import { pipeline } from '@xenova/transformers';
import sharp from 'sharp';

const {
  PINECONE_API_KEY,
  PINECONE_INDEX = 'dinov2-embeddings-with-permanent-ids',
  PINECONE_DIM = '2048',
  BATCH_SIZE = 5,
} = process.env;

if (!PINECONE_API_KEY) {
  console.error('Missing PINECONE_API_KEY');
  process.exit(1);
}

let clipExtractor = null;
async function getClipExtractor() {
  if (clipExtractor) return clipExtractor;
  // Use image-feature-extraction task for CLIP
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
  // Decode image to raw pixels to avoid unsupported input types
  const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const input = {
    data: new Uint8Array(data),
    width: info.width,
    height: info.height,
    channels: info.channels, // likely 4 with alpha
  };
  const output = await extractor(input, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

async function main() {
  const dataPath = path.join(process.cwd(), 'fragrances_filtered.json');
  const raw = fs.readFileSync(dataPath, 'utf-8');
  const fragrances = JSON.parse(raw);

  const pinecone = new Pinecone({ apiKey: PINECONE_API_KEY });
  const index = pinecone.index(PINECONE_INDEX);

  const points = [];
  const targetDim = parseInt(PINECONE_DIM, 10) || 2048;

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
      const embedding = padVector(embeddingRaw, targetDim);
      points.push({
        id: f.id || `fragrance-${i}`,
        values: embedding,
        metadata: {
          fragranceId: f.id,
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


