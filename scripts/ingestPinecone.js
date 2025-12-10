import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { GoogleAuth } from 'google-auth-library';
import { Pinecone } from '@pinecone-database/pinecone';

const {
  GCP_PROJECT_ID,
  VERTEX_LOCATION = 'us-east-1',
  PINECONE_API_KEY,
  PINECONE_INDEX = 'ndexforimagerecognition-img',
  PINECONE_DIM = '2048',
  // Use public Google image embedding publisher model
  VERTEX_IMAGE_MODEL = 'multimodalembedding',
  BATCH_SIZE = 5,
} = process.env;

if (!GCP_PROJECT_ID || !PINECONE_API_KEY) {
  console.error('Missing GCP_PROJECT_ID or PINECONE_API_KEY');
  process.exit(1);
}

const auth = new GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
});

async function embedImageBase64(base64Data, mimeType = 'image/jpeg') {
  const url = `https://${VERTEX_LOCATION}-aiplatform.googleapis.com/v1/projects/${GCP_PROJECT_ID}/locations/${VERTEX_LOCATION}/publishers/google/models/${VERTEX_IMAGE_MODEL}:predict`;
  const client = await auth.getClient();
  const headers = await client.getRequestHeaders();
  const authHeader = headers['Authorization'];
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body: JSON.stringify({
      instances: [
        {
          mimeType,
          image: { bytesBase64Encoded: base64Data },
        },
      ],
    }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Vertex predict failed: ${resp.status} ${text}`);
  }
  const data = await resp.json();
  const embedding =
    data?.predictions?.[0]?.imageEmbedding?.values ||
    data?.predictions?.[0]?.embeddings?.imageEmbedding?.values ||
    data?.predictions?.[0]?.embeddings?.[0]?.values ||
    [];
  return embedding;
}

function padVector(vec, targetDim) {
  const out = vec.slice(0, targetDim);
  while (out.length < targetDim) out.push(0);
  return out;
}

async function downloadImage(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch ${url}: ${resp.status}`);
  const buf = await resp.buffer();
  return buf.toString('base64');
}

async function main() {
  const dataPath = path.join(process.cwd(), 'fragrances_filtered.json');
  const raw = fs.readFileSync(dataPath, 'utf-8');
  const fragrances = JSON.parse(raw);

  const pinecone = new Pinecone({
    apiKey: PINECONE_API_KEY,
  });
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
      const base64 = await downloadImage(url);
      const embeddingRaw = await embedImageBase64(base64, url.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg');
      if (!embeddingRaw.length) {
        console.warn(`No embedding for ${i}: ${f.Name}`);
        continue;
      }
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


