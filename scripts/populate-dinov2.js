import fs from 'fs';
import path from 'path';
import os from 'os';
import fetch from 'node-fetch';
import { Pinecone } from '@pinecone-database/pinecone';
import { pipeline } from '@xenova/transformers';
import sharp from 'sharp';
import dotenv from 'dotenv';

// Load environment variables from .env file (if available)
dotenv.config();

const {
  PINECONE_API_KEY,
  PINECONE_INDEX = 'dinov2-embeddings',
  BATCH_SIZE = 5,
  START_INDEX = 0, // Set this to resume from a specific index
} = process.env;

// DINOv2 configuration constants
const EMBEDDING_DIMENSION = 768;

if (!PINECONE_API_KEY) {
  console.error('Missing PINECONE_API_KEY');
  console.error('Please ensure PINECONE_API_KEY is set in your .env file or environment');
  process.exit(1);
}

// Initialize Pinecone and validate index
const pinecone = new Pinecone({ apiKey: PINECONE_API_KEY });
const pineconeIndex = pinecone.index(PINECONE_INDEX);

// Validate Pinecone index dimension
async function validateIndex() {
  try {
    const stats = await pineconeIndex.describeIndexStats();
    console.log('Index stats:', stats);

    if (stats.dimension !== EMBEDDING_DIMENSION) {
      console.error(`ERROR: Pinecone index dimension is ${stats.dimension}, but DINOv2 requires exactly ${EMBEDDING_DIMENSION}`);
      console.error('Please create a new index with dimension 768 or update the existing index dimension');
      process.exit(1);
    }

    console.log(`✓ Index dimension validated: ${EMBEDDING_DIMENSION}`);
  } catch (error) {
    console.error('Failed to validate index:', error.message);
    console.error('Make sure the index exists and you have the correct permissions');
    process.exit(1);
  }
}

// ---------- DINOv2 Model Initialization ----------
let dinov2Extractor = null;

async function getDinov2Extractor() {
  if (dinov2Extractor) return dinov2Extractor;

  console.log('Loading DINOv2 model...');
  const startTime = Date.now();

  // Load DINOv2 using pipeline for image feature extraction
  dinov2Extractor = await pipeline('image-feature-extraction', 'Xenova/dinov2-base');

  const loadTime = Date.now() - startTime;
  console.log(`✓ DINOv2 model loaded in ${loadTime}ms`);

  return dinov2Extractor;
}

// ---------- Image Processing Functions ----------
async function downloadImage(url) {
  console.log(`📥 Downloading: ${url}`);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FragranceBot/1.0)'
      }
    });

    clearTimeout(timeoutId);

    if (!resp.ok) {
      throw new Error(`Failed to fetch ${url}: ${resp.status} ${resp.statusText}`);
    }

    const buf = await resp.arrayBuffer();
    const mimeType = resp.headers.get('content-type') || 'image/jpeg';
    console.log(`✅ Downloaded: ${buf.byteLength} bytes, type: ${mimeType}`);

    return { buffer: Buffer.from(buf), mimeType };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Timeout fetching ${url} after 10 seconds`);
    }
    throw error;
  }
}

async function embedImageFromUrl(imageUrl) {
  const extractor = await getDinov2Extractor();

  try {
    // Fetch image from URL
    const { buffer } = await downloadImage(imageUrl);

    // Convert to JPEG format and save as temporary file (transformers works better with file paths)
    const jpegBuffer = await sharp(buffer).jpeg().toBuffer();
    const tempPath = path.join(os.tmpdir(), `temp_image_${Date.now()}.jpg`);
    fs.writeFileSync(tempPath, jpegBuffer);

    try {
      // Pass the file path to the extractor
      const output = await extractor(tempPath);

      // Extract the CLS token (first 768 values from the 197376 output)
      const clsEmbedding = Array.from(output.data).slice(0, EMBEDDING_DIMENSION);

      // Normalize the embedding vector
      const magnitude = Math.sqrt(clsEmbedding.reduce((sum, val) => sum + val * val, 0));
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
  } catch (error) {
    console.error(`Error embedding image ${imageUrl}:`, error.message);
    throw error;
  }
}

// ---------- Main Processing Function ----------
async function main() {
  console.log('Starting DINOv2 embedding population...');
  console.log(`Pinecone Index: ${PINECONE_INDEX}`);
  console.log(`Batch Size: ${BATCH_SIZE}`);
  console.log(`Embedding Dimension: ${EMBEDDING_DIMENSION}`);

  // Validate index before starting
  await validateIndex();

  // Load fragrance data
  const dataPath = path.join(process.cwd(), 'fragrances_filtered.json');
  const raw = fs.readFileSync(dataPath, 'utf-8');
  const fragrances = JSON.parse(raw);
  console.log(`Loaded ${fragrances.length} fragrances from database`);

  const points = [];
  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;

  for (let i = parseInt(START_INDEX, 10) || 0; i < fragrances.length; i++) {
    const f = fragrances[i];
    const url = f['Image URL'];

    if (!url) {
      console.log(`⏭️  Skipping ${i}: no image URL`);
      skipCount++;
      continue;
    }

    try {
      console.log(`🔄 Processing ${i}/${fragrances.length}: ${f.Name || 'Unknown'}`);
      console.log(`🔗 URL: ${url}`);

      // Generate embedding
      const embedStart = Date.now();
      console.log(`🧠 Starting embedding generation...`);
      const embedding = await embedImageFromUrl(url);
      const embedTime = Date.now() - embedStart;

      if (!embedding.length) {
        console.warn(`⚠️  No embedding for ${i}: ${f.Name}`);
        failCount++;
        continue;
      }

      console.log(`✅ Embedded ${i}: ${f.Name} - ${embedding.length} dims in ${embedTime}ms`);

      // Prepare metadata
      const metadata = {
        jsonIndex: i,
        name: f.Name || '',
        brand: f.Brand || '',
        imageUrl: url,
        gender: f.Gender || '',
        mainAccords: f['Main Accords'] || '',
        model: "dinov2-base",
        dimensions: EMBEDDING_DIMENSION
      };

      points.push({
        id: `fragrance-${i}`,
        values: embedding,
        metadata: metadata,
      });

      successCount++;

      // Process batch
      if (points.length >= BATCH_SIZE) {
        const uploadStart = Date.now();
        await pineconeIndex.upsert(points);
        const uploadTime = Date.now() - uploadStart;

        console.log(`📤 Upserted ${points.length} vectors (last idx ${i}) in ${uploadTime}ms`);
        points.length = 0;

        // Delay between batches
        console.log('⏳ Waiting 3000ms before next batch...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      } else {
        // Delay between individual images
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

    } catch (err) {
      console.error(`❌ Failed on ${i}: ${f.Name} - ${err.message}`);
      if (err.message.includes('Timeout') || err.message.includes('Failed to fetch')) {
        console.log(`⏭️  Skipping ${i} due to network issue, continuing...`);
      } else {
        console.error(`Stack trace: ${err.stack}`);
      }
      failCount++;
    }
  }

  // Upload final batch
  if (points.length) {
    const uploadStart = Date.now();
    await pineconeIndex.upsert(points);
    const uploadTime = Date.now() - uploadStart;
    console.log(`📤 Upserted final ${points.length} vectors in ${uploadTime}ms`);
  }

  // Final statistics
  console.log('\n🎉 Ingestion complete!');
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`⏭️  Skipped: ${skipCount}`);
  console.log(`📊 Total processed: ${successCount + failCount + skipCount}`);
}

main().catch((err) => {
  console.error('💥 Ingestion failed:', err);
  process.exit(1);
});
