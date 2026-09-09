# Qalam क़लम — Modern Literary Sanctuary for Poetry & Shayari

<div align="center">

![Qalam Logo & Banner](public/next.svg)

**A modern, typography-first social web platform crafted for poets, shayars, and writers.**  
*Share verses, nazms, ghazals, and stories across Hindi, Urdu, English, and regional languages with typographic beauty.*

[![Next.js 16](https://img.shields.io/badge/Next.js-16.3.4-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.2.8-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres_%26_Auth-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black?style=flat&logo=vercel)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[Live Demo](https://qalam.vercel.app) · [Report Bug](https://github.com/Aniket4477/Qalam/issues) · [Request Feature](https://github.com/Aniket4477/Qalam/issues)

</div>

---

## 🌟 Overview

**Qalam** (क़लम — *pen*) is a literary social platform engineered specifically for poetic expression and written art. Unlike conventional social media platforms where line breaks and stanza meters collapse, Qalam preserves the cadence, indentation, and structure of every written piece.

Whether it is a two-line Sher, an intricate Urdu Ghazal, a Devanagari Kavita, or modern free verse, Qalam offers an immersive, distraction-free environment paired with real-time community engagement.

---

## ✨ Key Features

### 🖋️ Distraction-Free Literary Editor
- **Line & Stanza Preservation**: Keeps exact spacing, indentation, and typographic rhythm.
- **Multilingual Support**: Tailored typography for Hindi, Urdu (RTL-ready), English, and regional dialects.
- **Drafts & Publishing**: Save works-in-progress privately or publish them to the global reader community.
- **Custom Cover Themes**: Personalize post covers with aesthetic gradients and palette selections.

### 📰 Dynamic Feeds & Discovery
- **Dual-Feed Engine**: Switch effortlessly between **Latest** chronological submissions and algorithmic **Trending 🔥** compositions.
- **Filter & Search**: Explore works by language, literary form (Ghazal, Nazm, Haiku, Shayari, Poem, Free Verse), or keywords.
- **Rich Post Previews**: Full social metadata with dynamic Open Graph (OG) cards for WhatsApp, Twitter/X, and LinkedIn.

### 👥 Social Graph & Author Profiles
- **Follow / Following System**: Real-time counters and follower relationship tracking.
- **Interactive Modals**: Browse any author's followers and following list with direct navigation.
- **Customizable Profiles**: Profile photos, author bios, social handles, and personal anthologies.

### 💬 Real-Time Direct Messaging
- **Instant Conversations**: Real-time messaging powered by Supabase WebSockets.
- **Read & Unread Tracking**: Distinct visual cues for unread conversations, timestamps, and active badge counters on the navigation bar.
- **Inbox Filtering**: Quick toggle between all chats and unread conversations.

### 🏆 Literary Competitions & Prompts
- **Curated Challenges**: Weekly and monthly writing competitions with specific themes, deadlines, and word limits.
- **Community Voting**: Readers and peers vote for favorite submissions with live leaderboards.
- **Admin Management**: Dedicated administrative workflows for creating and adjudicating contests.

### 🔔 Live Notifications & Attribution
- **Instant Activity Feed**: Live notifications when someone likes, comments, follows, or submits an entry.
- **Personalized Attribution**: Displays the actor's profile photo, name, username, and a direct link to the referenced work.

### 🎨 Design & Accessibility
- **Adaptive Dark / Light Themes**: Seamless switching with zero flicker via `next-themes`.
- **Curated Typography**: Handpicked fonts including *Rozha One*, *Yatra One*, *Lora*, and *Inter*.
- **Mobile-First Responsive Design**: Optimized ergonomics across smartphones, tablets, and desktops.

---

## 🛠️ Technology Stack & Architecture

```
                                  ┌────────────────────────┐
                                  │   Vercel Edge CDN      │
                                  │  (Hosting & Analytics) │
                                  └───────────┬────────────┘
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      ▼                                               ▼
         ┌─────────────────────────┐                     ┌─────────────────────────┐
         │     Next.js 16 App      │                     │  Supabase Cloud (BaaS)  │
         │  (Turbopack + React 19) │                     │   PostgreSQL + Realtime │
         ├─────────────────────────┤                     ├─────────────────────────┤
         │ • Server Components     │◄─── HTTPS / SSR ───►│ • Row Level Security    │
         │ • Server Actions        │                     │ • Postgres Triggers     │
         │ • Client State & Hooks  │◄── WebSockets ─────►│ • Realtime Subscriptions│
         │ • Tailwind CSS v4       │                     │ • Auth & Session Cookies│
         │ • Radix UI Primitives   │                     │ • Media Storage Buckets │
         └─────────────────────────┘                     └─────────────────────────┘
```

### 💻 Frontend
- **Framework:** [Next.js 16.3](https://nextjs.org/) (App Router architecture with Turbopack bundler)
- **Library:** [React 19](https://react.dev/) (Server Components, Client Hooks, Suspense)
- **Language:** [TypeScript 5](https://www.typescriptlang.org/) (Strict type-safety across models and queries)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) with CSS variables and custom utility tokens
- **Component Primitives:** [Radix UI](https://www.radix-ui.com/) (Accessible Dialogs, Dropdowns, Tabs, Avatars, Toasts)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Analytics:** [@vercel/analytics](https://vercel.com/analytics) (Privacy-friendly, real-time visitor traffic monitoring)

### 🗄️ Backend & Database
- **Platform:** [Supabase](https://supabase.com/)
- **Database:** PostgreSQL with custom relational tables, indexes, cascading foreign keys, and triggers
- **Security:** Strict **Row Level Security (RLS)** policies applied on every table
- **Authentication:** Supabase Auth with secure HTTP-only cookies managed via `@supabase/ssr` (Email/Password & Google OAuth)
- **Realtime:** PostgreSQL CDC (Change Data Capture) via WebSockets for messages and notification counters
- **Storage:** Supabase Storage buckets for author avatars and custom poem banner covers

### 🚀 Hosting & Infrastructure
- **Deployment:** [Vercel](https://vercel.com/) (Global Edge Network with zero-config continuous deployment)
- **Proxy Middleware:** Custom `proxy.ts` request pipeline adhering to Next.js 16 standards

---

## 🔒 Security & Public Repository Safety

This repository is **100% safe to make public**:
- 🛡️ **Zero Hardcoded Secrets**: All sensitive keys, connection strings, and tokens are read strictly from environment variables at runtime (`process.env.*`).
- 📁 **Protected Git History**: `.env*` files are strictly excluded via `.gitignore` and have never been committed to Git history.
- 🔐 **Row Level Security (RLS)**: Even if the public anonymous key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) is visible in the browser bundle, all unauthorized reads, updates, and deletes are rejected at the database level by PostgreSQL RLS policies.
- 🍪 **Session Safety**: Authentication tokens are handled through server-validated session cookies with CSRF and SSR protections.

---

## 📂 Project Structure

```
qalam/
├── app/                               # Next.js App Router routes
│   ├── layout.tsx                     # Root layout (Theme, Navbar, Analytics, Toaster)
│   ├── page.tsx                       # Home feed (Latest & Trending tabs)
│   ├── globals.css                    # Tailwind v4 theme tokens & custom fonts
│   ├── proxy.ts                       # Next.js 16 proxy / route guard
│   ├── explore/                       # Discovery, filters, and search
│   ├── post/[id]/                     # Individual poem view, likes & comments
│   ├── write/                         # Distraction-free poem editor & publisher
│   ├── u/[username]/                  # Author profile, stats, and published works
│   ├── settings/                      # Profile settings (bio, avatar, username)
│   ├── competitions/                  # Literary contests, entries, and voting
│   ├── messages/                      # Real-time direct messaging threads
│   ├── notifications/                 # Activity center (likes, comments, follows)
│   └── (auth)/                        # Authentication routes (login, signup, callback)
├── components/                        # Reusable React components
│   ├── auth/                          # Authentication forms & OAuth buttons
│   ├── competitions/                  # Contest entry and voting components
│   ├── feed/                          # Home feed tab bar and list views
│   ├── messages/                      # Message thread, inbox list, and client sync
│   ├── nav/                           # Navigation bar with dynamic notification badges
│   ├── notifications/                 # Notification list & mark-as-read triggers
│   ├── posts/                         # PostCard, PostEditor, LikeButton, CommentList, Share
│   ├── profile/                       # FollowButton, FollowsModal, ProfileFollowStats
│   ├── providers/                     # ThemeProvider (Dark / Light)
│   └── ui/                            # Radix-based UI primitives
├── lib/                               # Application utilities & Supabase clients
│   ├── supabase/
│   │   ├── client.ts                  # Browser-side Supabase client
│   │   ├── server.ts                  # Server-side Supabase client (cookie-aware)
│   │   ├── types.ts                   # Strongly-typed database entities
│   │   └── queries.ts                 # Reusable data access methods
│   └── utils.ts                       # Class merging (clsx + tailwind-merge)
├── public/                            # Static assets and brand imagery
├── supabase/
│   └── schema.sql                     # Complete database schema, RLS, triggers & functions
├── .env.local.example                 # Clean environment variable template
├── package.json                       # Project dependencies and build scripts
└── tsconfig.json                      # Strict TypeScript compiler options
```

---

## 🚀 Quickstart & Local Development

Follow the instructions below to run Qalam locally on your machine.

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v20.x or later recommended)
- [npm](https://www.npmjs.com/) (v10.x or later)
- A free [Supabase](https://supabase.com/) account

### 2. Clone the Repository
```bash
git clone https://github.com/Aniket4477/Qalam.git
cd Qalam
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Set Up Supabase Database & Storage
1. Create a new project in your [Supabase Dashboard](https://database.new).
2. Go to the **SQL Editor** in Supabase and run the entire SQL script from:
   ```
   supabase/schema.sql
   ```
   *This automatically provisions all tables, foreign keys, automated notification triggers, and Row Level Security policies.*
3. Go to **Storage** in Supabase and create two **public** storage buckets:
   - `avatars`
   - `covers`

### 5. Configure Environment Variables
Create a local `.env.local` file by copying the template:

```bash
cp .env.local.example .env.local
```

Populate the values from your Supabase project dashboard (**Project Settings** → **API**):

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key

# Application URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 6. Run the Development Server
```bash
npm run dev
```

Open your browser and navigate to **[http://localhost:3000](http://localhost:3000)**.

---

## 🌐 Deploying to Vercel

1. Push your repository to [GitHub](https://github.com).
2. Go to [Vercel](https://vercel.com/new) and click **Import Project**.
3. In **Settings** → **Environment Variables**, add the four variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` (e.g., `https://your-domain.vercel.app`)
4. In your **Supabase Dashboard** under **Authentication** → **URL Configuration**:
   - Set **Site URL** to your production Vercel domain.
   - Add `https://your-domain.vercel.app/**` to **Redirect URLs**.
5. Hit **Deploy**. Vercel will build and launch your site with Turbopack in seconds!

---

## 👑 Granting Admin Privileges

To designate a user as an admin (e.g., to create official competitions), execute the following in your Supabase SQL Editor:

```sql
UPDATE public.profiles 
SET is_admin = true 
WHERE username = 'your-username';
```

---

## 🤝 Contributing

Contributions, feature suggestions, and bug reports are warmly welcome!
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m "Add some AmazingFeature"`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for details.

---

<div align="center">

Crafted with ❤️ for writers, poets, and dreamers around the world.  
*लफ़्ज़ों को दीजिए एक मुक़ाम — Qalam क़लम*

</div>
