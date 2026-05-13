# ADR 0001 — Admin as a UserRole enum value

## Status
Accepted

## Context
The app needed an admin panel for creating users. Someone needs to authenticate as an admin. Three options were considered: a new `ADMIN` value in the existing `UserRole` enum, a hardcoded list of admin emails in env vars, or an `isAdmin` boolean column on `User`.

## Decision
Add `ADMIN` to the `UserRole` enum.

## Reasons
- Consistent with the existing pattern — `UserRole` already drives routing decisions (`TRAINER` → `/trainer`, `PARENT` → `/children`). `ADMIN` → `/admin` fits naturally.
- At most 2 admins will ever exist, so the flexibility of a boolean flag is not needed.
- Hardcoded emails in env vars are brittle and invisible in the data model.

## Consequences
- Requires a schema migration to add `ADMIN` to the enum.
- The first admin must be bootstrapped via a direct DB update (`UPDATE users SET role = 'ADMIN' WHERE email = '...'`) after migration.
- `requireAdmin()` in `lib/auth.ts` checks `session.user.role === 'ADMIN'`.
