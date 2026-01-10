param(
  [string]$projectRef = $env:SUPABASE_REF,
  [string]$accessToken = $env:SUPABASE_ACCESS_TOKEN,
  [string]$functionName = "extract-doc"
)

if (-not $accessToken) {
  $accessToken = Read-Host "Enter your Supabase Personal Access Token (from https://supabase.com/dashboard/account/tokens)"
}

if (-not $projectRef) {
  $projectRef = Read-Host "Enter your Supabase project ref (project id)"
}

Write-Host "Logging in to Supabase CLI..."
supabase login --access-token $accessToken

Write-Host "Deploying function: $functionName to project: $projectRef"
supabase functions deploy $functionName --project-ref $projectRef

Write-Host "Deployment finished. Verify function in Supabase Dashboard and set environment variables (OCR_SPACE_API_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL) if needed."