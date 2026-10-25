## Agent skills

### Issue tracker

GitHub Issues in `aadielpr/bk` are the source of truth for published specs and tickets. Use `.scratch/<feature-slug>/` only for drafts and supporting artifacts. See `docs/agents/issue-tracker.md`.

### Triage labels

Use `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Infrastructure credentials

Connection URLs (Postgres, Redis, SQS, queues, storage) live in the environment and are set by the operator, never by agents. Agents read URLs from env/config; if a connection fails for missing or invalid credentials, stop and report. Don't create roles, users, databases, passwords, or connection strings, and don't commit them.

### Domain docs

Single-context: read root `CONTEXT.md` and relevant ADRs in `docs/adr/`. See `docs/agents/domain.md`.
Spec: read .scratch/broiler-farm-app/spec.md
