# Context

## Roles

**UserRole** — the role assigned to every user account. Three values:

- `PARENT` — a parent who can view their children's dashboards and progress
- `TRAINER` — a trainer who runs test sessions and views group results
- `ADMIN` — an operator who manages the app (creates users, groups, etc.). At most 2 admins at any time. Admins log in through the same login page as other users and are redirected to `/admin`.

## Terms

**Invite link** — a one-time activation link sent to a new user's email when their account is created via the admin panel. The link carries a token that expires after 7 days and lets the user set their own password (via the password-reset flow). The account is created with an unknown random password hash that no one ever sees or transmits — the user's first real password is the one they set through the invite. Stored in the `PasswordResetToken` table; the only difference from a password-reset token is the longer TTL.

Admin-bootstrap CLI scripts (`scripts/create-user.ts`) still use a temporary-password flow because they're run by an operator who shares credentials manually outside the app — they don't send email.

**Child** — a child belonging to a Parent user, assigned to a Group. Children are created by the Admin at the same time as the Parent account. Test results are not entered at creation time — they are added later by Trainers through the test session flow.

**Group** — a training group with a name and optional location. Groups are stable (currently two exist) and are managed directly in the database, not through the admin panel.

## Admin panel

Accessible at `/admin`. Separate layout from the main app. Operations:

- **Create user** — creates a PARENT (with children, no results) or TRAINER (with group assignments). Sends a welcome email with a one-time invite link; the user sets their own password through the link.
- **Create physiotherapist report** — adds a report to an existing child.

Post-creation: redirect to `/admin` with a success message.
