Document Extractor & RLS Setup

1) Edge Function: `supabase/functions/extract-doc`
- Deploy this Edge Function in your Supabase project (Supabase CLI or dashboard).
- Environment variables to configure (in Supabase dashboard > Functions > Settings):
  - OCR_SPACE_API_KEY (optional): API key for OCR.space. If set, the function will use OCR.space to extract text from PDFs/images by passing the public file URL. If not set, PDF/image extraction will return a 202 with a message.
  - SUPABASE_URL (recommended): your Supabase project URL.
  - SUPABASE_SERVICE_ROLE_KEY (optional, but required if you want the function to automatically update `decision_documents.extracted_text` in the DB). Keep this secret—do NOT push to client-side code.

Usage (example POST body):
- { "publicUrl": "https://.../myfile.pdf", "documentId": 123 }
- or { "publicUrl": "https://.../myfile.pdf" }

Response:
- { "extracted_text": "...", "db_updated": true }

Notes:
- This function prefers public or signed URLs. If your storage bucket is private, generate a signed URL when calling this function.
- For high-volume extraction or better OCR accuracy, consider a paid OCR provider or a dedicated OCR service.

2) SQL migrations and policies
- Run `SUPABASE_MIGRATIONS.sql` to add columns and the `decision_documents` table.
- Run `SUPABASE_POLICIES.sql` to enable RLS and add policies so users can only access their own data.

3) Client-side flow (recommended):
- After uploading a file to the `decision_files` storage bucket and recording a row in `decision_documents`, call the Edge Function and pass `publicUrl` and `documentId`.
- If the Edge Function returns `extracted_text`, the function will attempt to update the DB (if `SUPABASE_SERVICE_ROLE_KEY` is set) or return the extracted text to the caller, which may then update the document row using a secure server call.

4) Deployment options
- Quick manual deploy: Use the Supabase Dashboard -> Functions -> Create/Update function and paste the code from `supabase/functions/extract-doc/index.ts`, then deploy.
- CLI deploy (local):
  1. Install Supabase CLI: `npm i -g supabase`.
  2. Login: `supabase login --access-token <PERSONAL_ACCESS_TOKEN>` (or set `SUPABASE_ACCESS_TOKEN` env var).
  3. Deploy the function: `supabase functions deploy extract-doc --project-ref <PROJECT_REF>`.
- CI deploy (recommended): A GitHub Actions workflow is included at `.github/workflows/deploy-supabase-functions.yml`. Set these repository secrets before running the workflow:
  - `SUPABASE_ACCESS_TOKEN` (Personal Access Token)
  - `SUPABASE_REF` (Project ref / project id)

5) Environment variables & secrets
- Set these in Supabase dashboard (Functions -> Settings -> Environment variables) or with `supabase` CLI secret commands:
  - `OCR_SPACE_API_KEY` (optional) — required to extract text from PDFs/images via OCR.space.
  - `SUPABASE_SERVICE_ROLE_KEY` (optional but required if you want the Edge Function to write `extracted_text` back to the DB). Keep this secret and never put it in client-side code.
  - `SUPABASE_URL` (optional) — helpful for the function to construct URLs.

6) Security & best practices
- Keep the service role key secret. Use the Edge Function to perform sensitive updates.
- If you expose public URLs for files and they contain sensitive information, consider using time-limited signed URLs instead of public access.
- Add monitoring/alerts for OCR failures and long-running jobs.
- Test the function with sample documents and review the DB updates in `decision_documents` to confirm extracted text is populated.
