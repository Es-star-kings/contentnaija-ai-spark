# Grant Admin Access to Your Account

## Current state (verified)
- `/admin` route exists at `src/routes/_authenticated/admin.tsx` and checks the `admin` role via the `user_roles` table (server-side `has_role`).
- The `user_roles` table is **empty** — no account currently has admin access, so `/admin` shows "Admin access required" for everyone, including you.
- Your account: kingsleyadesina1@gmail.com (user_id `9891dc51-2bf1-47fa-a9b3-762f6b4ac18f`) — also the account with the unlimited Agency plan.

## Change
One SQL statement in the Lovable Cloud database:

```sql
insert into public.user_roles (user_id, role)
values ('9891dc51-2bf1-47fa-a9b3-762f6b4ac18f', 'admin')
on conflict (user_id, role) do nothing;
```

No code changes needed — the admin page, role check, and navigation already work.

## After this
1. Sign in with **kingsleyadesina1@gmail.com** (any method you normally use).
2. The **Admin** item appears in the sidebar; you can also go directly to `/admin`.
3. From there you can make other users admin or revoke them — that's the only way to grant admin to other accounts going forward.
