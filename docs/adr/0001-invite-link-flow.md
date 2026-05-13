# 0001 — Invite link instead of temporary password for new users

- Date: 2026-05-13
- Status: Accepted

## Context

When an admin creates a new user, that user needs a way to get their first password. Two viable approaches:

1. **Temporary password.** Server generates a random password, bcrypt-hashes it, stores it on the User. The plaintext is emailed to the user. `mustChangePassword=true` forces a change on first login.
2. **Invite link.** Server creates the user with a hash nobody knows, plus a one-time token (reusing the password-reset infrastructure). The user activates by clicking a link in the email and setting their first password through the existing password-reset flow.

## Decision

Use the invite link. New users are created with:

- A `passwordHash` that is bcrypt of 32 random bytes the server immediately discards — a "lock with no key." The account is unreachable by login until activation overwrites this hash.
- A `PasswordResetToken` row with a 7-day TTL.
- `mustChangePassword = false` (there's no temp password to swap out).

The welcome email contains a link to `/reset-password/<rawToken>`. Activation flows through the same machinery as a password reset.

## Why

The security gain is **marginal**, not headline. Both flows are equally lost if an attacker controls the user's email inbox at the moment of delivery. The concrete wins are:

- **Bounded exposure window.** A welcome email sitting in an inbox archive 6 months later contains a working temp password under (1); a 7-day-dead link under (2).
- **No plaintext password in server logs.** The old flow logged the temp password to stdout if `RESEND_API_KEY` was unset. The new flow only logs the URL (which itself expires).
- **Unactivated accounts can't sit indefinitely hijackable.** Old temp passwords never expired.

The **UX** gain is real and not marginal: one less mandatory step. No "change your password on first login" interstitial — the user picks a password during activation and uses it from then on.

## Trade-offs

- **More machinery to learn.** Two distinct emails (invite + reset) share the same token system. Documented in [app/reset-password/CONTEXT.md](../../app/reset-password/CONTEXT.md) so future-us doesn't have to re-derive it.
- **Placeholder password hash is non-obvious.** Anyone reading the User row sees a normal-looking bcrypt hash for a user who has never actually picked a password. Documented in the same context file.
- **Failure mode of email delivery is unchanged.** If sending the email fails, the user record exists but the user can't activate. Admin must delete + recreate or manually trigger a password reset for them. Same failure mode as the temp-password flow had.

## Considered alternatives

- **Nullable `passwordHash` column.** More honest representation of "no password yet," but requires a Prisma migration, null-guards on every `bcrypt.compare`, and care in the login flow to avoid distinguishing "no password set" from "wrong password" (an account-enumeration leak). Rejected: schema complexity for marginal gain.
- **Keep `mustChangePassword = true` on new invite users.** Functionally identical — the reset-password action clears the flag anyway, and a user with the placeholder hash has no way to log in without going through the reset flow first. Rejected for accuracy: `false` reflects actual state.

## Reversibility

One commit (`5e354b1`). No DB schema change. `git revert` returns the temp-password flow without a migration. Existing users created under either flow are unaffected.

## Follow-up that this ADR did NOT decide

- Whether to add a per-account login rate limit (currently only `(email, ip)` is limited). Open question; not blocked by this decision.
- Whether to enforce password complexity beyond the current 10-character minimum. Open question.
- Whether to expose an "admin re-sends invite" button. Currently the admin can trigger a password reset for the user, which uses the same machinery with a 10-minute TTL. Worth a dedicated button if this becomes a frequent operation.
