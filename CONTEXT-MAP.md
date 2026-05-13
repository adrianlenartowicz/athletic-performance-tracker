# Context map

This repo has more than one CONTEXT.md. They cover different layers:

| Path | Layer | What's in it |
|---|---|---|
| [CONTEXT.md](CONTEXT.md) | **Domain** | Roles, terms (Child, Group, Invite link), the admin panel's responsibilities |
| [app/reset-password/CONTEXT.md](app/reset-password/CONTEXT.md) | **Mechanism** | Password-reset and invite token system — what a token is, the cookie pattern, the full flow |

Architecture decisions live under [docs/adr/](docs/adr/). Open one when a future engineer (or LLM) might reasonably ask "wait, why didn't we do the obvious thing?"
