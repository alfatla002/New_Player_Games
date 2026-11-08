# Current handoff

Private owner preview: https://nextplay-task-studio.trustworthystar1.chatgpt.site

The preview runs in clearly labeled local demo mode. It is not a final reviewer-accessible Supabase deployment.

## Completed

React/TypeScript board, four status columns, dnd-kit interactions, task creation/editing/deletion, search, labels, priority filters, due indicators, summary stats, native modal, responsive layout, and loading/error/empty states. Supabase guest-session code and complete tasks SQL migration with RLS are included. Source is committed locally and synchronized to the private Sites source repository. Your GitHub origin remains unchanged.

## Verification

- Production TypeScript/Vite build passed.
- Unit tests passed; guest lifecycle tests use a mocked Supabase client and do not verify a live database.
- Production dependency audit reported zero vulnerabilities.
- Word draft archive and XML are valid.
- Browser tests are present but could not execute: Chromium requires libnspr4 and other Linux libraries. `npx playwright install-deps chromium` requires an interactive sudo password here. No visual or drag behavior is claimed as browser-verified.

## Required before submission

1. Supply Supabase project URL and public anon/publishable key. Run the migration and enable anonymous sign-ins. Deploy with those build-time variables.
2. Test two separate browser profiles against the real backend, including direct cross-user requests against every RLS operation.
3. Authenticate GitHub with `gh auth login`, then run `git push origin main`. Push previously failed because no HTTPS credentials were available.
4. Deploy to Vercel, Netlify or Cloudflare Pages using `npm run build` and output `dist`; ensure assessors can open the URL.
5. Supply your first and last name. Generate the Word document with `python3 scripts/make_submission.py --first FIRST --last LAST --url LIVE_URL`, and update its verification and deployment status to reflect the actual completed work.
6. Upload the finalized document to Drive and share according to the submission form. Drive upload has not been performed.

The assessment source document is not included in tracked files. Draft artifacts are git-ignored.
