# Employer demo deployment

Use your own free Vercel account and import https://github.com/alfatla002/New_Player_Games at https://vercel.com/new.

Suggested project name: `ali-task-studio` (availability determines the final domain).

The committed vercel.json selects Vite, `npm run build`, and `dist`.

Before deploying, add both build environment variables from your local ignored .env:

- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY (the supplied public publishable key)

Do not upload .env or use a service-role key. Without both values this app intentionally uses local demo storage.

After deployment, use the production `.vercel.app` domain. Open it in a signed-out/incognito browser and verify it does not require Vercel login. Create a task, reload, and verify it remains. Use another isolated browser session to verify the other guest cannot see the first task. Check drag-and-drop and mobile layout.

Send the verified production URL back so the final document can be regenerated with the employer-facing link. Remove all draft/status wording that is no longer applicable only after browser checks are completed. Upload the final Word document to Drive and follow the employer form sharing instructions.
