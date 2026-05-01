# ScatterBox

A brain-dump app built for people with ADHD. Type anything — tasks, ideas, grocery items, random thoughts — and AI automatically sorts them into the right list. No friction, no decisions.

## Features

- **Instant capture** — one text field, hit send, done
- **AI categorization** — Claude reads each entry and files it into the correct list automatically
- **Smart list suggestions** — detects when multiple entries share a common project name and offers to create a dedicated list
- **Custom lists** — create any list beyond the built-ins; AI learns to categorize into them
- **Multi-select** — long-press items in a list to bulk delete or move
- **Edit / delete / move** — 3-dot menu on every item
- **List management** — rename or delete lists from the list detail header

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Expo 54 / React Native 0.81.5 |
| Routing | expo-router |
| Database + Auth | Supabase |
| AI categorization | Claude (`claude-opus-4-7`) via `@anthropic-ai/sdk` |
| Session storage | `@react-native-async-storage/async-storage` |

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- A [Supabase](https://supabase.com/) project
- An [Anthropic](https://console.anthropic.com/) API key

## Supabase setup

Run these two tables in the Supabase SQL editor:

```sql
create table entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  text text not null,
  category text,
  created_at timestamptz default now()
);

alter table entries enable row level security;
create policy "Users manage own entries" on entries
  for all using (auth.uid() = user_id);

create table lists (
  id text primary key,
  user_id uuid references auth.users not null,
  name text not null,
  color text not null,
  created_at timestamptz default now()
);

alter table lists enable row level security;
create policy "Users manage own lists" on lists
  for all using (auth.uid() = user_id);
```

Enable **Email** auth in Supabase → Authentication → Providers.

## Environment variables

Create `.env.local` in the project root:

```sh
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...
```

> **Never commit `.env.local`** — it contains secret keys.

## Installation

```bash
git clone https://github.com/your-username/scatterbox.git
cd scatterbox
npm install
```

## Running the app

| Platform | Command |
| --- | --- |
| Interactive menu | `npm start` |
| iOS simulator | `npm run ios` |
| Android emulator | `npm run android` |
| Web browser | `npm run web` |

Press `i` for iOS, `a` for Android, or `w` for web after `npm start`.

## Project structure

```text
app/
  (tabs)/
    index.tsx        # Main dump screen
    lists.tsx        # All lists overview
  list/
    [category].tsx   # List detail with items
  auth.tsx           # Sign in / sign up
  modal.tsx          # New list modal
context/
  entries-context.tsx  # Global state + Supabase CRUD
lib/
  supabase.ts        # Supabase client
  categorize.ts      # Claude API call for categorization
constants/
  theme.ts           # Colors
```

## How categorization works

When you submit an entry:

1. It's saved immediately with no category (shows "categorizing…")
2. `categorizeEntry()` sends the text + your list names to Claude
3. Claude returns the best matching list ID (or `new:List Name` if a new list is warranted)
4. The entry is updated with the category — the badge appears

If Claude is unavailable, the entry falls back to **Brain Dump**.
