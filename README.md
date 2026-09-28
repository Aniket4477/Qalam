# Qalam · क़लम — Modern Literary Sanctuary

<div align="center">

<img src="public/qalam-banner.svg" alt="Qalam Banner" width="100%" />

<br/><br/>

[![Next.js 16](https://img.shields.io/badge/Next.js-16.3.4-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Turbopack](https://img.shields.io/badge/Turbopack-Enabled-000000?style=for-the-badge&logo=turbopack&logoColor=white)](https://turbo.build/)
[![React 19](https://img.shields.io/badge/React-19.2.8-23272f?style=for-the-badge&logo=react&logoColor=61dafb)](https://react.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_%26_RLS-3ecf8e?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-amber?style=for-the-badge)](LICENSE)

<br/>

**A typography-first, distraction-free digital sanctuary engineered for poets, shayars, and writers.**  
*Preserving poetic meter, stanza cadence, and multilingual elegance across Hindi, Urdu, English, and regional literature.*

<br/>

[Overview](#-overview) • [Design System](#-design-system--visual-craftsmanship) • [Themes Engine](#-the-5-atmospheric-reading-themes) • [Features](#-feature-spotlight) • [Architecture](#-system-architecture) • [Getting Started](#-getting-started) • [Security](#-security--open-source-protection)

</div>

---

## 🌟 Overview

Mainstream social networks collapse line breaks, flatten indents, and strip the musicality out of poetry. **Qalam** (क़लम — *pen*) is engineered from the ground up to solve this: a specialized platform that treats typography, meter, and author intent as first-class citizens.

From a two-line Urdu Sher to an intricate Devanagari Kavita, a classical Ghazal, a Japanese Haiku, or modern Free Verse, Qalam preserves the exact visual rhythm of every written piece while providing modern social connectivity, real-time messaging, and themed literary competitions.

---

## 🎨 Design System & Visual Craftsmanship

Qalam was designed with an uncompromising focus on **editorial luxury**, **typographic precision**, and **delightful micro-interactions**.

```
                ┌───────────────────────────────────────────────┐
                │          QALAM TYPOGRAPHIC ENGINE             │
                └───────────────────────┬───────────────────────┘
                                        │
         ┌──────────────────────────────┼──────────────────────────────┐
         ▼                              ▼                              ▼
  Editorial Serif                 Devanagari Soul                Modern UI Sans
   "Lora / Georgia"            "Yatra One / Rozha One"              "Inter"
  Poetic body & titles         Brand emblem & Hindi verse       Navigation & UI tokens
```

### 1. Typographic Architecture & Meter Preservation
- **Preserved Lineation:** Strict white-space preservation guarantees that caesuras, couplet indents, and multi-stanza pauses never collapse.
- **Curated Multi-Font Stack:**
  - **Lora & Georgia:** High-legibility serif with classical editorial warmth for verse bodies.
  - **Yatra One & Rozha One:** Expressive Devanagari scripts evoking handcrafted Indian printmaking.
  - **Inter:** Crisp, balanced sans-serif for responsive navigation and metadata labels.
- **Native RTL Script Handling:** Automatic bidirectional directionality (`dir="rtl"`) with calibrated line-heights for Urdu, Persian, and Arabic verses.

### 2. Micro-Interactions & Motion Design
- **Particle Sparkle Like Animations:** Liking a post triggers an energetic heart pop with dynamic particle bursts and an expanding golden/red shockwave.
- **Parallel Read Receipts:** Chat messages feature authentic double-check ticks with instantaneous transition to turquoise-blue upon reading.
- **Floating Stream Anchor:** When browsing conversation history, an intuitive floating scroll button appears with a live counter badge showing incoming unread messages.
- **Glassmorphic Portals:** Modals (Likes, Voters, Media Lightbox, Crop Tool, Theme Pickers) are rendered directly to `document.body` via React portals with backdrop blur and spring transitions.

---

## 🎭 The 5 Atmospheric Reading Themes

Every piece of literature carries its own mood. Writers on Qalam can clothe their compositions in one of **5 bespoke thematic cards**, instantly adjusting typography colors, background textures, and borders across feeds, profiles, and reading views:

| Theme | Mood & Palette | Visual Character |
|---|---|---|
| **📜 Classic Parchment** | Warm Sepia `#fbf8f1` & Terracotta | Evokes vintage library manuscripts, aged handcrafted paper, and nostalgic ink. |
| **🌌 Midnight Ink** | Deep Charcoal `#0f131a` & Luminous Amber | Minimalist night-reading elegance with high contrast and subtle amber borders. |
| **🔮 Amethyst Mystique** | Twilight Velvet `#140d1e` & Soft Violet | Dreamy, mystical aesthetic tailored for romantic, melancholic, and contemplative verse. |
| **🌿 Emerald Grove** | Forest Spruce `#0a1612` & Sage Accent | Earth-toned botanical calm designed for nature poetry, mindfulness, and philosophical works. |
| **🌅 Sunset Ember** | Warm Ochre `#1c120c` & Crimson Gold | Radiant terracotta tones radiating passion, celebration, and spiritual depth. |

---

## ✨ Feature Spotlight

### 🖋️ Distraction-Free Literary Studio
- **Versatile Post Formats:** Dedicated support for **Poems**, **Shayaris**, **Ghazals**, **Haikus**, **Free Verse**, and **Quotes**.
- **Live Preview & Theme Selector:** Test-drive different card themes, custom cover images, and tags in real time before publishing.
- **Draft or Publish:** Keep private works-in-progress or release them to the global anthology.

### 📰 Dual-Feed Discovery Engine
- **Chronological & Algorithmic Tabs:** Seamlessly toggle between **Latest** community submissions and **Trending 🔥** compositions.
- **Multilingual Exploration:** Filter by language (Hindi, Urdu, English, Punjabi, Bengali, Marathi, and more) or literary genre.
- **Dynamic OpenGraph Previews:** Native social sharing cards automatically generated for WhatsApp, Twitter/X, and LinkedIn.

### 💬 Real-Time Literary Circles & Direct Messaging
- **Instant Messaging:** Low-latency WebSockets powered by Supabase PostgreSQL Realtime.
- **Group Circles:** Create writing circles, assign admins, update group photos, and mention members with `@username` push triggers.
- **Rich Media & Stickers:** Inline sticker drawer, photo/video sharing with preview modal, and full-screen lightbox viewing.
- **Chat Themes:** Personalize chat threads with custom background themes.

### 🏆 Community Writing Competitions
- **Live Challenge Countdowns:** Transparent deadline timers (e.g., *"Submissions closing in 2 days"*, *"Voting closing tomorrow"*).
- **Democratic Entry Voting:** Community members vote for their favorite submissions with live counters and instant feedback.
- **Voters Transparency Modal:** Clickable voter badges displaying who voted, with avatars, usernames, and profile links.
- **Podium Rankings:** Real-time 🥇 1st, 🥈 2nd, and 🥉 3rd place ribbon badges dynamically sorted by vote count.

### 👤 Author Profiles & Social Graph
- **Author Anthologies:** Dedicated profile hubs showcasing published works, follower/following counts, and custom bios.
- **Photo Crop Tool:** Client-side avatar and cover photo cropper with aspect-ratio locking.
- **Interactive Relationship Modals:** View followers and following lists with one-click follow/unfollow buttons.

---

## 🛠️ System Architecture

```
                             ┌────────────────────────┐
                             │    Vercel Edge CDN     │
                             │ (Hosting & Analytics)  │
                             └───────────┬────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
    ┌─────────────────────────┐                     ┌─────────────────────────┐
    │     Next.js 16 App      │                     │  Supabase Cloud (BaaS)  │
    │  (Turbopack + React 19) │                     │   PostgreSQL + Realtime │
    ├─────────────────────────┤                     ├─────────────────────────┤
    │ • React Server Comps    │◄─── HTTPS / SSR ───►│ • Row Level Security    │
    │ • Client State & Hooks  │                     │ • Realtime Change Data  │
    │ • Tailwind CSS v4       │◄── WebSockets ─────►│ • Auth Session Cookies  │
    │ • Radix UI Primitives   │                     │ • Storage Buckets       │
    └─────────────────────────┘                     └─────────────────────────┘
```

### Technology Matrix

| Layer | Technology | Key Capabilities |
|---|---|---|
| **Framework** | [Next.js 16.3](https://nextjs.org/) | App Router, Server Components, Turbopack engine |
| **UI Runtime** | [React 19.2](https://react.dev/) | React Server Components, Suspense boundaries |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) | Strict end-to-end type safety |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Modern CSS variable design tokens & utilities |
| **Primitives** | [Radix UI](https://www.radix-ui.com/) | Unstyled, fully accessible dialogs, tabs, dropdowns |
| **Icons** | [Lucide React](https://lucide.dev/) | Consistent, scalable vector icons |
| **Database** | [PostgreSQL (Supabase)](https://supabase.com/) | Relational models, triggers, and WebSocket Realtime |
| **Authentication** | [Supabase Auth](https://supabase.com/auth) | Secure HTTP-only cookie sessions with `@supabase/ssr` |
| **Hosting** | [Vercel](https://vercel.com/) | Edge runtime, global CDN caching, zero-config CI/CD |

---

## 🔒 Security & Open Source Protection

This repository is structured for **safe public open-source distribution**:

1. **Zero Hardcoded Secrets:** All credentials, database keys, and configuration URLs are resolved dynamically via runtime environment variables (`process.env.*`).
2. **Database Row Level Security (RLS):** Every single PostgreSQL table has explicit Row Level Security policies. Public anonymous keys cannot bypass access rules.
3. **Session Cookie Isolation:** Authentication tokens are stored in encrypted HTTP-only cookies using `@supabase/ssr` to prevent client-side XSS leakage.
4. **Git Hygiene:** Local configuration files (`.env*.local`, build artifacts) are ignored by Git.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js:** v20.x or later
- **npm:** v10.x or later
- **Supabase Account:** Free tier at [supabase.com](https://supabase.com)

### 2. Clone the Repository
```bash
git clone https://github.com/Aniket4477/Qalam.git
cd Qalam
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Setup
1. Create a new project in your [Supabase Dashboard](https://database.new).
2. Open the **SQL Editor** in Supabase.
3. Execute the contents of `supabase/schema.sql`. This provisions all required tables, triggers, and Row Level Security policies.
4. Run any supplementary migrations from the `supabase/migrations/` directory as needed.
5. In **Storage**, create two public buckets:
   - `avatars`
   - `covers`

### 5. Environment Configuration
Copy the sample environment file:
```bash
cp .env.local.example .env.local
```

Fill in your project credentials from **Supabase Dashboard** → **Project Settings** → **API**:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key

# Application URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 6. Start Development Server
```bash
npm run dev
```

Visit **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🌐 Deployment to Vercel

1. Push your code to your GitHub repository.
2. In [Vercel](https://vercel.com/), click **Add New** → **Project** and import your repository.
3. Configure your Environment Variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL` (your production URL, e.g. `https://your-qalam-app.vercel.app`)
4. In your **Supabase Dashboard** → **Authentication** → **URL Configuration**:
   - Set **Site URL** to your production domain.
   - Add `https://your-qalam-app.vercel.app/**` to **Redirect URLs**.
5. Deploy! Vercel will build and serve the application globally.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/poetic-enhancement`.
3. Commit your changes: `git commit -m "feat: Add poetic meter detection"`.
4. Push to your branch: `git push origin feature/poetic-enhancement`.
5. Open a Pull Request.

---

## 📜 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for details.

<br/>

<div align="center">

*लफ़्ज़ों को दीजिए एक मुक़ाम — Qalam क़लम*  
**Crafted with ❤️ for writers, poets, and dreamers everywhere.**

</div>
