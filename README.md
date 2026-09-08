# Qalam — Poetry & Shayari Platform

A literary social web app for sharing poetry, shayari, ghazals, and short-form creative writing. Built with Next.js 16, TypeScript, Tailwind CSS v4, and Supabase.

---

## Getting Started

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Note your **Project URL** and **anon key** from Settings → API.

### 2. Set Up the Database

In your Supabase dashboard, go to **SQL Editor** and run the contents of:

```
supabase/schema.sql
```

This creates all tables, indexes, RLS policies, and trigger functions (auto-profile on signup, notifications on likes/comments).

### 3. Configure Supabase Storage

Create two **public** storage buckets in Supabase → Storage:
- `avatars` — for profile photos
- `covers` — for cover images and post covers

Set both to **public** access policy.

### 4. Configure Google OAuth (optional)

1. In [Google Cloud Console](https://console.cloud.google.com), create an OAuth 2.0 Client ID.
2. Set the Authorized Redirect URI to: `https://your-project-id.supabase.co/auth/v1/callback`
3. In Supabase → Authentication → Providers, enable Google and enter your Client ID and Secret.

### 5. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 6. Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Add the four environment variables in Vercel → Settings → Environment Variables.
4. Update `NEXT_PUBLIC_SITE_URL` to your production URL (e.g. `https://qalam.vercel.app`).
5. In Supabase → Authentication → URL Configuration, add your Vercel URL to **Site URL** and **Redirect URLs**.

---

## Features

| Feature | Status |
|---------|--------|
| Email/password auth | ✅ Phase 1 |
| Google OAuth | ✅ Phase 1 |
| Public profile pages | ✅ Phase 1 |
| Post create/edit/delete | ✅ Phase 1 |
| Exact line break preservation | ✅ Phase 1 |
| Draft/published states | ✅ Phase 1 |
| Home feed (Latest/Trending) | ✅ Phase 2 |
| Explore/search | ✅ Phase 2 |
| Likes (optimistic UI) | ✅ Phase 2 |
| Comments (real-time) | ✅ Phase 2 |
| Share (Web Share API) | ✅ Phase 2 |
| OG/Twitter card metadata | ✅ Phase 2 |
| Competitions | ✅ Phase 3 |
| Admin competition creation | ✅ Phase 3 |
| Competition voting/leaderboard | ✅ Phase 3 |
| Direct messages (real-time) | ✅ Phase 4 |
| Notifications | ✅ Phase 5 |
| Dark mode | ✅ Phase 5 |
| RTL support (Urdu, Arabic) | ✅ Phase 1 |
| Mobile-first responsive | ✅ All phases |

## Making a User Admin

In Supabase SQL Editor:

```sql
UPDATE profiles SET is_admin = true WHERE username = 'your-username';
```

---

## Project Structure

```
qalam/
├── app/                     # Next.js App Router pages
│   ├── page.tsx             # Home feed
│   ├── explore/             # Search & discover
│   ├── post/[id]/           # Post detail
│   ├── write/               # Create/edit post
│   ├── u/[username]/        # Public profile
│   ├── settings/            # Edit profile
│   ├── competitions/        # Competitions list + detail
│   ├── messages/            # DM list + thread
│   ├── notifications/       # Notifications
│   └── (auth)/login,signup  # Auth pages
├── components/
│   ├── nav/                 # Navbar
│   ├── posts/               # PostCard, LikeButton, CommentList, ShareButton, PostEditor
│   ├── competitions/        # CompetitionEnterButton
│   ├── messages/            # MessagesClient, MessageThread
│   ├── notifications/       # MarkNotificationsRead
│   └── providers/           # ThemeProvider
├── lib/
│   ├── supabase/            # client.ts, server.ts, types.ts
│   └── utils.ts             # Helpers
├── supabase/
│   └── schema.sql           # Full database schema + RLS + triggers
└── middleware.ts            # Route protection
```

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Backend:** Supabase (Postgres, Auth, Realtime, Storage)
- **Deployment:** Vercel
- **Fonts:** Lora (poem bodies) + Inter (UI)
