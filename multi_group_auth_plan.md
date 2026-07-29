# Multi-Group & Google Authentication Implementation Plan

Moving from a single-group "PG" tracker to a full-fledged multi-group system (PG, Trips, Office, Roommates) with proper Authentication is a massive architectural upgrade for this app. It will effectively transform it into a true SaaS product like Splitwise.

## Open Questions for Later
> **User Profiles vs Shadow Members**: Do we require *everyone* to sign up with an email/password to be added to a group? Or can one person create a group and add "shadow" members (just names) so they can start tracking expenses immediately, and invite them to claim their profile later? (I recommend allowing shadow members for a better user experience).

## 1. Database Schema & Architecture Changes

We need to completely restructure the database to support multi-tenancy (groups).

### New Tables
- **`users`**: Synced with Supabase Auth (UUID, email, name, avatar).
- **`groups`**: `id`, `name`, `type` (e.g., Trip, Office), `cover_image`, `created_by`.
- **`group_members`**: Linking table between `groups` and `users`. Supports roles (`admin`, `member`) and "shadow" users (users without an auth account yet).

### Table Modifications
- **`expenses`**: Add `group_id` foreign key.
- **`settlements`**: Add `group_id` foreign key.
- **Row Level Security (RLS)**: We will activate RLS on all tables so users can *only* query and modify expenses for groups they belong to.

## 2. Authentication Flow (Frontend & Backend)

### Backend API
- **Auth Middleware**: Implement JWT verification on the Express backend using `@supabase/supabase-js`. Every request must include `Authorization: Bearer <token>`.
- **Group Scoping**: Update every single service function (`getExpenses`, `createExpense`, `getAnalytics`) to filter by `group_id` and verify the user's membership.

### Frontend UI/UX
- **Landing & Auth Pages**: A beautiful "Swiss Fintech" login screen exclusively using **Google Authentication (OAuth)** via Supabase. No password management needed!
- **Group Selection Screen**: After logging in, you don't go straight to the dashboard. You go to a "My Groups" page displaying beautiful cards for "PG", "Office", "Trip", etc.
- **Group Context**: Once you select a group, you enter the main app layout. The Sidebar will be updated to display the current Active Group, along with a switcher dropdown to quickly jump between groups.

## 3. UI Design Upgrades ("Looking Good")

To make this feel like a premium product:
- **Group Cards**: We will design stunning group cards with gradients or cover photos representing the type of group (e.g., a suitcase icon for trips, a building for office).
- **Smooth Transitions**: `framer-motion` or CSS transitions for switching between groups seamlessly.
- **Invite Links**: Generate unique links to invite friends to a specific group.

## Verification Plan
1. Apply the new SQL schema and migrate existing data into a default "PG" group.
2. Build the Auth UI (Login/Signup).
3. Build the Group Selection UI.
4. Refactor the backend to enforce `group_id` constraints on all endpoints.
5. Manually test creating a "Trip" group and an "Office" group and ensure expenses do not bleed across groups.
