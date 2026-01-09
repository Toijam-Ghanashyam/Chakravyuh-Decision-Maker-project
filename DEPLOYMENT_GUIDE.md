# Supabase Edge Function Deployment Guide

## Step 1: Install Supabase CLI

### Option 1: Using Scoop (Recommended for Windows)
```powershell
# Install Scoop if you don't have it
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression

# Install Supabase CLI
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Option 2: Using Chocolatey
```powershell
choco install supabase
```

### Option 3: Download Binary (Manual)
1. Visit: https://github.com/supabase/cli/releases/latest
2. Download `supabase_windows_amd64.zip` (or the appropriate version for your system)
3. Extract the zip file
4. Add the extracted folder to your system PATH, or place `supabase.exe` in a folder that's already in your PATH

### Option 4: Using Winget
```powershell
winget install Supabase.CLI
```

**Note:** npm install is NOT supported for Supabase CLI. Use one of the methods above.

## Step 2: Login to Supabase

```powershell
supabase login
```

This will open your browser to authenticate with Supabase.

## Step 3: Link Your Project

From your project root directory (where `supabase/config.toml` is located):

```powershell
supabase link --project-ref ckeubdntzjjjzzmmaqpk
```

**Note:** Replace `ckeubdntzjjjzzmmaqpk` with your actual project reference ID if different.

## Step 4: Set the Gemini API Key Secret

Before deploying, you need to set the `GEMINI_API_KEY` environment variable:

```powershell
supabase secrets set GEMINI_API_KEY=your_gemini_api_key_here
```

Replace `your_gemini_api_key_here` with your actual Gemini API key.

**To get your Gemini API key:**
1. Go to https://aistudio.google.com/apikey
2. Create a new API key or use an existing one
3. Copy the key and use it in the command above

## Step 5: Deploy the Edge Function

```powershell
supabase functions deploy ai-chat
```

This will deploy the `ai-chat` function to your Supabase project.

## Step 6: Verify Deployment

After deployment, you should see a success message with the function URL. You can also verify in your Supabase Dashboard:
- Go to: https://supabase.com/dashboard/project/ckeubdntzjjjzzmmaqpk/functions
- You should see the `ai-chat` function listed

## Troubleshooting

### If you get "project not linked" error:
```powershell
supabase link --project-ref ckeubdntzjjjzzmmaqpk
```

### If you need to check your secrets:
```powershell
supabase secrets list
```

### If deployment fails, check logs:
```powershell
supabase functions logs ai-chat
```

## Quick Deploy Script

You can also create a PowerShell script to automate this:

```powershell
# deploy.ps1
supabase functions deploy ai-chat
```

Then run: `.\deploy.ps1`

