# Context

## Roles

**UserRole** — the role assigned to every user account. Three values:

- `PARENT` — a parent who can view their children's dashboards and progress
- `TRAINER` — a trainer who runs test sessions and views group results
- `ADMIN` — an operator who manages the app (creates users, groups, etc.). At most 2 admins at any time. Admins log in through the same login page as other users and are redirected to `/admin`.

## Terms

**Temporary password** — a system-generated password assigned to a new user account. The user must change it on first login (`mustChangePassword = true`). Delivered to the user via a welcome email sent automatically at account creation — the admin never sees or handles it manually.

**Child** — a child belonging to a Parent user, assigned to a Group. Children are created by the Admin at the same time as the Parent account. Test results are not entered at creation time — they are added later by Trainers through the test session flow.

**Group** — a training group with a name and optional location. Groups are stable (currently two exist) and are managed directly in the database, not through the admin panel.

## Admin panel

Accessible at `/admin`. Separate layout from the main app. Operations:

- **Create user** — creates a PARENT (with children, no results) or TRAINER (with group assignments). Sends a welcome email with the temporary password automatically.
- **Create physiotherapist report** — adds a report to an existing child.

Post-creation: redirect to `/admin` with a success message.
