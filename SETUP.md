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

## Running the App

```bash
npm install
npm run dev
```

Visit http://localhost:5173

