# Admin User CLI

This directory contains local administration scripts. The main entry points are:

```bash
npm run user:create:staging
npm run user:create:production
```

Use this command to create application users and, when needed, attach children
and test results to parent accounts.

## What The Wizard Does

The CLI walks through a guarded flow:

1. Choose the target environment: production or staging / non-production.
2. Load the database connection for that environment.
3. Create a user with an email, role, password, and password-change setting.
4. For parent users, optionally add children and test results.
5. Show a summary before writing anything.
6. Create all requested records in one database transaction.

If a database write fails, the transaction rolls back so a partially-created
user is not left behind.

## Vercel Env Handling

The admin CLI is designed to run through Vercel without writing secrets to local
env files.

Use:

```bash
npm run user:create:staging
npm run user:create:production
```

These commands use `vercel env run`, which fetches environment variables from
Vercel and injects them into the command process. No `.env.production.local`,
`.env.staging.local`, or other env file is created.

The Vercel CLI is installed as a project dev dependency, so you do not need a
global `vercel` install for these npm commands.

If the project is not linked to Vercel yet, run:

```bash
npm run vercel:link
```

This creates local Vercel project metadata in `.vercel/`, which is ignored by
git.

Under the hood:

```bash
vercel env run -e preview -- tsx scripts/create-user.ts --environment=staging
vercel env run -e production -- tsx scripts/create-user.ts --environment=production
```

The CLI requires `DATABASE_URL` to exist in `process.env`. If it is missing, the
script stops before asking for user data.

Before continuing, the CLI prints a safe database description, such as the host
and database path. It does not print credentials.

Avoid running the TypeScript file directly unless you are deliberately testing
the script internals. The committed npm commands always go through Vercel env
injection.

## Production Flow

Production mode is intentionally strict.

The CLI requires:

- typing `PRODUCTION` before collecting data
- entering important values twice
- reviewing a final summary
- typing `CREATE PRODUCTION USER` before anything is written

Production user fields that must be repeated:

- email
- role
- temporary password
- force password change setting

For production parent accounts, the CLI can also add children and test results.
Child names, birth years, group choices, test types, values, and dates are also
double-checked before creation.

This is slower by design. Production data should be boring to enter and hard to
mistype.

## Staging / Non-Production Flow

Staging mode is faster and more flexible.

The CLI asks for:

- email
- role
- temporary password, or it can generate one
- whether the user must change the password on first login

For parent users, staging mode can automatically add mocked children and test
results. The mock records are useful for checking dashboards, charts, and parent
views without entering data by hand.

Mock data is only offered in staging / non-production mode.

## Roles

Supported roles:

```text
PARENT
TRAINER
```

Children and test results are only created for `PARENT` users.

## Password Handling

Passwords are hashed with `bcryptjs` before they are stored. The plain temporary
password is printed once at the end so it can be shared with the user.

Share the email and temporary password through separate channels whenever
possible.

## Safety Notes

- Always read the printed database source before confirming.
- Prefer `npm run user:create:staging` and `npm run user:create:production`.
- Avoid a shell-level `DATABASE_URL` unless you have just checked its value.
- Do not commit env files.
- Do not run production mode unless the printed database host/path is the one
  you intend to modify.
- The CLI refuses to create a user when another user already has the same email.

## Current Commands

```bash
npm run user:create:staging
npm run user:create:production
```

There is no cleanup command at the moment. Cleanup scripts should be added only
with explicit previews and confirmations.
