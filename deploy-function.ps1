# Supabase Function Deployment Script
$projectId = "ckeubdntzjjjzzmmaqpk"
$functionName = "ai-chat"

# Read the function code
$functionCode = Get-Content "supabase/functions/ai-chat/index.ts" -Raw

# Get access token from environment or prompt
$accessToken = $env:SUPABASE_ACCESS_TOKEN
if (-not $accessToken) {
    $accessToken = Read-Host "Enter your Supabase Personal Access Token (from https://supabase.com/dashboard/account/tokens)"
}

# Prepare the payload
$payload = @{
    slug = $functionName
    name = $functionName
    verify_jwt = $false
    import_map = ""
    entrypoint_path = "index.ts"
}

$headers = @{
    "Authorization" = "Bearer $accessToken"
    "Content-Type" = "application/json"
}

Write-Host "Deploying function: $functionName to project: $projectId"
Write-Host "Please deploy manually via Supabase Dashboard:"
Write-Host "1. Go to https://supabase.com/dashboard/project/$projectId/functions"
Write-Host "2. Click on 'ai-chat' function"
Write-Host "3. Replace the code with the updated version from supabase/functions/ai-chat/index.ts"
Write-Host "4. Click Deploy"
