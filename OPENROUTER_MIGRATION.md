# OpenRouter API Migration

## Changes Made

Successfully migrated the AI Task Planner from Google's Gemini API to OpenRouter API.

## What Changed

### 1. **TaskModals.tsx**
- Removed `@google/generative-ai` SDK dependency
- Switched to direct fetch API calls to OpenRouter
- Using model: `google/gemini-2.0-flash-exp:free` (free Gemini via OpenRouter)
- Updated error messages to reflect OpenRouter

### 2. **vite.config.ts**
- Changed environment variable from `GEMINI_API_KEY` to `OPENROUTER_API_KEY`

### 3. **Created .env.example**
- Template file showing how to configure the API key

## Setup Instructions

1. **Get an OpenRouter API Key**
   - Visit: https://openrouter.ai/keys
   - Create a free account
   - Generate an API key

2. **Configure the API Key**
   
   **Option A: Using Environment Variables (Recommended)**
   - Create a `.env` file in the project root
   - Add: `OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here`
   
   **Option B: Hardcode in TaskModals.tsx (Not recommended for production)**
   - Open `components/tasks/TaskModals.tsx`
   - Replace line 6: `const API_KEY: string = "sk-or-v1-YOUR_OPENROUTER_API_KEY_HERE";`
   - With your actual key: `const API_KEY: string = "sk-or-v1-abc123...";`

3. **Restart the Development Server**
   ```bash
   npm run dev
   ```

## Available Models via OpenRouter

You can change the model in `TaskModals.tsx` on line with `model:` property. Some options:

**Free Models:**
- `google/gemini-2.0-flash-exp:free` (Currently used)
- `meta-llama/llama-3.2-3b-instruct:free`
- `microsoft/phi-3-mini-128k-instruct:free`

**Paid Models (better quality):**
- `anthropic/claude-3.5-sonnet`
- `openai/gpt-4-turbo`
- `google/gemini-pro-1.5`

See all models: https://openrouter.ai/models

## Benefits of OpenRouter

- ✅ Single API for multiple AI providers
- ✅ Free tier available
- ✅ No need for multiple API keys
- ✅ Easy model switching
- ✅ Usage tracking and analytics

## Optional: Remove Gemini Dependency

If you want to completely remove the Google Generative AI package:

```bash
npm uninstall @google/generative-ai
```

This will reduce your bundle size slightly.
