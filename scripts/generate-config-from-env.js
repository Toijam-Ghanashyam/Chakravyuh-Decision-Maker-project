#!/usr/bin/env node
// Simple script to generate `config.js` from a local `.env` file
// Usage: node scripts/generate-config-from-env.js
const fs = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')
const envPaths = [path.join(projectRoot, '.env'), path.join(projectRoot, '.env.local')]
let envFile = null
for (const p of envPaths) {
  if (fs.existsSync(p)) { envFile = p; break }
}

if (!envFile) {
  console.error('No .env file found. Please copy .env.example to .env and fill in your values.')
  process.exit(1)
}

const raw = fs.readFileSync(envFile, 'utf8')
const lines = raw.split(/\r?\n/)
const env = {}
for (let line of lines) {
  line = line.trim()
  if (!line || line.startsWith('#')) continue
  const idx = line.indexOf('=')
  if (idx === -1) continue
  const key = line.slice(0, idx).trim()
  let val = line.slice(idx + 1).trim()
  // Strip surrounding quotes
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1)
  }
  env[key] = val
}

if (!env.GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY not found in .env. Please set GEMINI_API_KEY in your .env file.')
  process.exit(1)
}

const configJs = `// Generated from .env (DO NOT COMMIT)
const CONFIG = {
  GEMINI_API_KEY: ${JSON.stringify(env.GEMINI_API_KEY)},
};
`;

fs.writeFileSync(path.join(projectRoot, 'config.js'), configJs, 'utf8')
console.log('Generated config.js from', envFile)
console.log('Note: config.js is ignored by git. Do NOT commit secrets to the repo.')
