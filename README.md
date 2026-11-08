# Nextplay — Task Studio

Live app: https://ali-task-studio.vercel.app

A focused Kanban workspace built with React, TypeScript, Vite, dnd-kit, and Supabase.

## Run locally

Requires Node.js 22 or newer.

```sh
npm ci
cp .env.example .env
npm run dev
```

Without environment values, the app explicitly runs as a local browser demo with sample tasks. This mode does not use Supabase or prove guest isolation. A configured Supabase project starts with an empty board and never silently falls back to demo storage on errors.

## Supabase setup

1. Create a free Supabase project.
2. Run `supabase/migrations/202611080001_tasks.sql` in its SQL editor.
3. Enable anonymous sign-ins in Authentication settings.
4. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env` and in your host's build environment. Use a public anon/publishable key only; never a service-role or secret key.
5. Restart the development server or rebuild the deployment.

A saved Supabase session is reused on return visits. Each authenticated guest owns their rows through `user_id`; SELECT, INSERT, UPDATE, and DELETE policies enforce ownership. Clearing browser data loses access to the anonymous account. See [Supabase anonymous sign-in documentation](https://supabase.com/docs/guides/auth/auth-anonymous).

## Features

- Four columns with pointer, touch-handle and keyboard drag support; status select also provides an accessible and mobile-friendly way to move tasks.
- Create, edit and delete tasks in a native modal with title, description, priority, date and custom comma-separated labels.
- Combined title search, label and priority filters; total, completed, overdue and progress summaries.
- Local-calendar due and overdue indicators; completed tasks are excluded from urgency counts.
- Loading, empty, saving and error states. Server writes complete before local state changes; failed saves preserve the editor.
- Responsive board with horizontal scrolling on small screens, reduced-motion support and visible keyboard focus.

## Verify

```sh
npm run build
npm test
npx playwright install chromium
npx playwright test
```

Browser tests exercise local demo CRUD, filtering, persistence, pointer drag and mobile layout. They do not replace live Supabase tests. Before submission, open two isolated browser profiles against a configured deployment; create a task in each and confirm neither sees the other's rows. Also verify cross-user direct SELECT, UPDATE and DELETE requests cannot access the other user's task, and INSERT/UPDATE cannot substitute another user_id.

## Hosting

Vercel: import the repository, choose Vite, set both environment values, use `npm run build` and output `dist`.

Netlify or Cloudflare Pages: use the same build command, output directory and environment values. No server or paid services are required. The `.openai/hosting.json` file also supports the private Sites preview.

## Structure and tradeoffs

`src/main.tsx` contains the board and editor; `src/data.ts` handles authentication and persistence; `src/model.ts` contains filtering and due-date logic. The complete SQL schema and policies are in `supabase/migrations`.

The board refreshes after a successful drop, with no realtime subscription. Tasks remain ordered by creation time; manual ordering inside a column is not persisted. Team members, comments, activity history and account recovery are intentionally deferred. Next improvements would be live two-user security automation, task versioning for simultaneous tabs, account linking, and component extraction as the UI grows.

## Delivery status

Supabase public configuration is installed in the ignored local environment file. Live verification passed all 12 guest authentication, task persistence, ownership, and RLS checks after anonymous sign-ins were enabled and the migration was applied. The evaluator-facing Vercel deployment is live at https://ali-task-studio.vercel.app. GitHub SSH authentication works for alfatla002. The submission draft uses Ali Al-Fatlawi. Use the production Vercel URL for employer access. No assessment source text or PDF is included in this repository.

Generate the local draft document with `python3 scripts/make_submission.py`. The candidate name is Ali Al-Fatlawi and the production URL is configured in the document generator; review the document and manually check the live board before submitting. Generated documents and screenshots live in the git-ignored `artifacts/` directory.
