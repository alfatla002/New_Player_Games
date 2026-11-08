# Current handoff

Private owner preview: https://nextplay-task-studio.trustworthystar1.chatgpt.site

The preview is built with the supplied Supabase public configuration. Guest sign-in currently fails because anonymous sign-ins are disabled; the tasks table also needs to be created. It is not a final reviewer-accessible Supabase deployment.

## Completed

React/TypeScript board, four status columns, dnd-kit interactions, task creation/editing/deletion, search, labels, priority filters, due indicators, summary stats, native modal, responsive layout, and loading/error/empty states. Supabase guest-session code and complete tasks SQL migration with RLS are included. Source is committed locally and synchronized to the private Sites source repository. Your GitHub origin remains unchanged.

## Verification

- Production TypeScript/Vite build passed.
- Unit tests passed; guest lifecycle tests use a mocked Supabase client and do not verify a live database.
- Production dependency audit reported zero vulnerabilities.
- Word draft archive and XML are valid.
- Browser tests are present but could not execute: Chromium requires libnspr4 and other Linux libraries. `npx playwright install-deps chromium` requires an interactive sudo password here. No visual or drag behavior is claimed as browser-verified.

## Required before submission

1. Supabase URL and publishable key are configured in ignored .env. Run the migration and enable anonymous sign-ins. The live checks returned "Anonymous sign-ins are disabled" and PGRST205 for missing public.tasks.
2. Test two separate browser profiles against the real backend, including direct cross-user requests against every RLS operation.
3. GitHub SSH authentication succeeds as alfatla002 using the local key whose public fingerprint matches the supplied value. Use `git push git@github.com:alfatla002/New_Player_Games.git HEAD:main` for subsequent updates. HTTPS gh authentication remains unconfigured.
4. Deploy to Vercel, Netlify or Cloudflare Pages using `npm run build` and output `dist`; ensure assessors can open the URL.
5. Candidate: Ali Al-Fatlawi. Generate the Word document with `python3 scripts/make_submission.py --first Ali --last Al-Fatlawi --url LIVE_URL`, and update its verification and deployment status after live setup.
6. Upload the finalized document to Drive and share according to the submission form. Drive upload has not been performed.

The assessment source document is not included in tracked files. Draft artifacts are git-ignored.
