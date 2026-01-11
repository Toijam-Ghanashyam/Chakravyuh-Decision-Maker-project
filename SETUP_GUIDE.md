# Chakravyuh - Setup Guide for Team

## Getting Started

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd chakravyuh1.0
```

### 2. Configure API Keys
The project requires a Gemini API key to function. Here's how to set it up:

#### Option A: Using `.env` (Recommended) ✅
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and replace `GEMINI_API_KEY` with your actual Gemini API key.
3. Generate the runtime `config.js` (used by the static client) from your `.env`:
   ```bash
   npm run gen-config
   ```
   - This writes a `config.js` file at project root which contains your `GEMINI_API_KEY` for local development.
   - `config.js` is ignored by git; do NOT commit it.

#### Option B: Using `config.js` (Manual, legacy)
1. Copy `config.example.js` to `config.js`:
   ```bash
   cp config.example.js config.js
   ```
2. Open `config.js` and replace `YOUR_GEMINI_API_KEY_HERE` with your actual Gemini API key
3. This file is automatically ignored by git and will not be committed

#### Notes
- For production, prefer keeping secrets server-side (e.g., use the Supabase Edge Function) rather than exposing keys in client-side code. The client now calls the `ai-chat` Edge Function by default — make sure you deploy it and set the `GEMINI_API_KEY` secret in your Supabase project.
- Both `.env` and `config.js` are ignored by git.

### 3. Get Your Gemini API Key
1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. Create a new API key
3. Copy it to `.env` (recommended) or `config.js` (manual)

### 4. Development
Simply open `index.html` in your browser or serve it with a local web server:
```bash
# Using Python
python -m http.server 8000

# Using Node.js (if installed)
npx http-server
```

Then navigate to `http://localhost:8000`

## Important Security Notes

⚠️ **Never commit API keys or secrets to git!**
- `config.js` and `.env` are ignored by `.gitignore`
- Always use `config.example.js` and `.env.example` as templates
- Share these templates with your team, not the actual keys

## Project Structure

- `index.html` - Main UI
- `script.js` - Core application logic
- `styles.css` - Styling
- `package.json` - Project metadata
- `config.example.js` - API key template (commit this)
- `config.js` - Your actual API keys (do NOT commit)
- `supabase/` - Supabase configuration and edge functions
- `DEPLOYMENT_GUIDE.md` - Production deployment instructions

## Features

- 🔐 Secure authentication with Supabase
- 💬 AI-powered chat assistant with Gemini
- 📊 Decision intelligence dashboard
- 👥 Team collaboration features
- 🎯 Memory archive for historical decisions
- 🌙 Dark/Light theme support

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes and test locally
3. Commit and push: `git push origin feature/your-feature`
4. Create a Pull Request

---

For questions or issues, please open a GitHub issue or contact the team.
