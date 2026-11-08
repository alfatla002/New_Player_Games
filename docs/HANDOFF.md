# Current handoff

Employer demo: https://ali-task-studio.vercel.app

The Vercel deployment is built with the supplied Supabase public configuration. Guest sign-in and the tasks table are operational; all 12 live API verification checks passed. The production URL returns HTTP 200 without authentication. The deployed bundle was checked for the expected Supabase project and public key.

## Completed

React/TypeScript board, four status columns, dnd-kit interactions, task creation/editing/deletion, search, labels, priority filters, due indicators, summary stats, native modal, responsive layout, and loading/error/empty states. Supabase guest-session code and complete tasks SQL migration with RLS are included. Source is committed locally and pushed to the requested GitHub repository. Your GitHub origin remains unchanged.

## Verification

- Production TypeScript/Vite build passed.
- All eight unit tests passed. Additionally, 12 live API checks passed: distinct guest sessions; owner create, update, fetch and delete; denial of cross-user reads, updates, deletes and forged-owner inserts; denial of ownership transfer; denial of unauthenticated access; and preservation of the original task after unauthorized requests. The temporary test task was deleted.
- Full dependency audit reported zero vulnerabilities.
- The built production frontend also passed a real Chromium check against live Supabase: guest authentication, create, calendar, drag, reload persistence, second-guest isolation, edit, clear date, guest explanation and delete. No JavaScript errors were observed and the test task was cleaned up.
- Word draft archive and XML are valid.
- All 13 browser checks passed across the main suite and focused follow-ups: task CRUD, title/description validation, date selection and N/A, dirty-close protection, pointer drag, keyboard filters, draft retention after failed save, guest-session information, desktop/mobile layouts, drag rollback, and reduced motion. Desktop and mobile screenshots were reviewed. The missing Chromium libraries were downloaded and extracted to /tmp for this session.

## Required before submission

1. Supabase setup is complete. The URL and publishable key are configured in ignored .env; anonymous authentication, the tasks table and ownership policies were verified live.
2. Direct API security tests with two independent guest sessions passed. Browser-level visual and drag-and-drop checks now pass.
3. GitHub SSH authentication succeeds as alfatla002 using the local key whose public fingerprint matches the supplied value. Use `git push git@github.com:alfatla002/New_Player_Games.git HEAD:main` for subsequent updates. HTTPS gh authentication remains unconfigured.
4. Vercel deployment is live at https://ali-task-studio.vercel.app. Manually verify task creation, reload, editing, dragging, deletion and mobile layout in the browser.
5. Candidate: Ali Al-Fatlawi. Generate the Word document with `python3 scripts/make_submission.py --first Ali --last Al-Fatlawi --url https://ali-task-studio.vercel.app`, and review the generated document before submission.
6. Upload the finalized document to Drive and share according to the submission form. Drive upload has not been performed.

The assessment source document is not included in tracked files. Draft artifacts are git-ignored.
