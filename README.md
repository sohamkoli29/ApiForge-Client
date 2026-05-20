# ApiForge — Frontend Client

A full-stack API Testing Tool and Task Manager, built with React + Vite. Connects to the [ApiForge Backend](https://github.com/sohamkoli29/ApiForge-Server) *(update link)*.

---

## Features

### ApiForge (API Testing)
- Send HTTP requests — GET, POST, PUT, DELETE, PATCH
- Configure query params, headers, request body, and auth
- View response status, headers, body (interactive JSON viewer)
- Save request history (Supabase + localStorage fallback)
- Organize requests in collections with **Run All** batch execution

### AuraTask (Task Manager UI)
- Register & log in via JWT authentication
- Protected dashboard — requires valid token
- Create, edit, delete tasks with status and priority
- Filter by status / priority
- Admin panel to view all registered users

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite 7 |
| Styling | Tailwind CSS v4 + inline CSS variables |
| Auth | Supabase Auth (ApiForge) + JWT (AuraTask) |
| Database | Supabase (PostgreSQL) |
| HTTP | Native fetch API |
| UI Extras | lucide-react, react-hot-toast, react18-json-view |

---

## Prerequisites

- Node.js v18+
- A Supabase project ([supabase.com](https://supabase.com))
- Backend server running (see [Backend README](../server/README.md))

---

## Environment Variables

Create a `.env` file inside the `client/` folder:

```env
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## Database Setup (Supabase)

Run in your Supabase SQL editor:

```sql
-- Users profile table (mirrors Supabase Auth)
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  created_at timestamptz default now()
);

-- Request history
create table if not exists history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  url text not null,
  method text not null,
  headers jsonb,
  params jsonb,
  body text,
  response_status int,
  duration int,
  created_at timestamptz default now()
);

-- Collections
create table if not exists collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  description text,
  color text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Collection items
create table if not exists collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid references collections(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  url text not null,
  method text not null,
  headers jsonb,
  params jsonb,
  body text,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

---

## Installation & Running

```bash
# From the project root
npm run install:all

# Run frontend only
npm run dev:client

# Run both frontend + backend together
npm run dev
```

Client starts at `http://localhost:5173`

---

## Project Structure

```
client/
├── public/
├── src/
│   ├── api/
│   │   └── taskApi.js          # JWT-authenticated fetch helpers
│   ├── components/
│   │   ├── AuthProvider.jsx    # Supabase auth context
│   │   ├── AuthTab.jsx         # Basic/Bearer/Custom auth config
│   │   ├── CollectionsManager.jsx
│   │   ├── Footer.jsx
│   │   ├── LoadingSpinner.jsx
│   │   ├── Login.jsx           # Supabase sign-in / sign-up
│   │   ├── RequestForm.jsx     # URL bar + params/headers/body/auth tabs
│   │   ├── ResponseViewer.jsx  # JSON viewer + headers display
│   │   ├── Sidebar.jsx         # History + Collections tabs
│   │   ├── UserProfile.jsx
│   │   └── task/
│   │       ├── AdminPanel.jsx  # Admin-only user list
│   │       ├── TaskDashboard.jsx
│   │       ├── TaskLogin.jsx   # JWT login/register
│   │       └── TaskModal.jsx   # Create/edit task form
│   ├── config.js
│   ├── supabase.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── vite.config.js
└── package.json
```

---

## How JWT Auth Works (AuraTask)

1. User registers/logs in via `POST /api/v1/auth/register` or `/login`
2. Server returns a JWT token
3. Token stored in `localStorage` as `jwt_token`
4. All task API calls send `Authorization: Bearer <token>` header
5. Admin users see the Admin Panel tab (role checked server-side)

---

## Deployment

**Vercel (recommended for frontend):**

```bash
# Set environment variables in Vercel dashboard, then:
vercel --prod
```

Set these in Vercel → Settings → Environment Variables:
- `VITE_API_URL` → your Railway/Render backend URL
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## Related

- 🔧 [Backend Repository](https://github.com/sohamkoli29/ApiForge-Server)
- 📖 [Swagger API Docs](https://apiforge-server-8axm.onrender.com/api/docs)