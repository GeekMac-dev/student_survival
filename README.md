# Sulit

Sulit is an Expo app for student budgeting, schedules, task capture, food finds, commute estimates, reviewer links, and study tools.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env` from `.env.example` and add your Supabase project values:

   ```bash
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
   ```

3. Start development:

   ```bash
   npm run start
   ```

## Production Checks

Run these before shipping:

```bash
npm run typecheck
npm run lint
npm run build
```

The AI assistant calls a Supabase Edge Function named `ai-chat`. If that function is not deployed, the screen uses local fallback responses instead of failing.

## Supabase Tables

The app expects these tables with row-level security scoped by `user_id` where applicable:

- `profiles`
- `schedule_items`
- `tasks`
- `expense_groups`
- `expense_members`
- `food_items`
- `reviewer_items`
