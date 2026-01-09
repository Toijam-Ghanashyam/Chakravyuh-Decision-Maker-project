# Chakravyuh - Setup Guide for Team

## Getting Started

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd chakravyuh1.0
```

### 2. Configure API Keys
The project requires a Gemini API key to function. Here's how to set it up:

#### Option A: Using config.js (Recommended)
1. Copy `config.example.js` to `config.js`:
   ```bash
   cp config.example.js config.js
   ```
2. Open `config.js` and replace `YOUR_GEMINI_API_KEY_HERE` with your actual Gemini API key
3. This file is automatically ignored by git and will not be committed

#### Option B: Using .env file
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Fill in your API keys in the `.env` file
3. This file is also ignored by git

### 3. Get Your Gemini API Key
1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. Create a new API key
3. Copy it to `config.js` or `.env`

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
