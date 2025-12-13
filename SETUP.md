# Setup Instructions

## Environment Variables

1. Create a `.env` file in the root directory:
   ```
   VITE_ANTHROPIC_API_KEY=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
   ```

2. **Important**: The API key above is already configured. Just create the `.env` file and paste it in.

   If you need a new key, get it from: https://console.anthropic.com/
   - Go to API Keys section
   - Create a new key
   - Copy and paste it into your `.env` file

## Claude Agent Configuration

If you built a custom agent in Claude Console, update `src/services/claudeApi.js`:

1. **System Prompt**: If your agent has a system prompt, add it to the API call:
   ```javascript
   system: "Your system prompt from Claude Console"
   ```

2. **Model**: Update the model name if you're using a different one:
   ```javascript
   model: 'claude-3-5-sonnet-20241022' // or your preferred model
   ```

3. **Parameters**: Adjust `max_tokens` or other parameters as needed

## Environment Variables

Add these to your Vercel project settings (Dashboard → Project → Settings → Environment Variables):

```
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX=ndexforimagerecognition-img
PINECONE_DIM=2048
```

## Running Locally

```bash
npm install
npm run dev          # Frontend on http://localhost:5173
npm run server       # Backend on http://localhost:3001 (optional)
```

## Deploying to Vercel

1. **Push to GitHub/GitLab**
2. **Connect to Vercel**: Import your repository
3. **Set Environment Variables**: Add the Pinecone variables above
4. **Deploy**: Vercel will automatically detect the serverless function in `/api/scan.js`

The API will be available at `https://your-app.vercel.app/api/scan`

