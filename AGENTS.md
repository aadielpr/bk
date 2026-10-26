## Agent skills

### Issue tracker

GitHub Issues in `aadielpr/bk` are the source of truth for published specs and tickets. Use `.scratch/<feature-slug>/` only for drafts and supporting artifacts. See `docs/agents/issue-tracker.md`.

### Triage labels

Use `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Infrastructure credentials

Connection URLs (Postgres, Redis, SQS, queues, storage) live in the environment and are set by the operator, never by agents. Agents read URLs from env/config; if a connection fails for missing or invalid credentials, stop and report. Don't create roles, users, databases, passwords, or connection strings, and don't commit them.

### Code comments

Comment only what the code cannot say by itself: the why behind a non-obvious or surprising block (a subtle constraint, a deliberate trade-off, an invariant that reading the code alone would mislead you about). The code carries the what; the comment earns its line by explaining the why. A comment that restates the next line, narrates the obvious, or labels a section header the structure already shows is noise — leave it out.

### Git: commit and push

Commit and push only when the operator says to. Don't commit, push, or open PRs unprompted — report the change and wait for the instruction.

Before any `git add`, run `bun run format` so committed code is always in Prettier style. Verify `bun run format:check` passes before pushing.

### Validation & types: Valibot

Valibot is the source of truth for both validation and types. Every API shape's exported type comes from `v.InferOutput<typeof Schema>` — don't hand-write TypeScript interfaces for API shapes, request bodies, or payloads; write a valibot schema and infer the type from it.

- **Location**: all schemas live in `packages/shared/src/types/` (one file per concept: `role`, `user`, `farm`, `coop`, `token`, `api`), re-exported through the barrel from the package root `@bk/shared`, so server and web share one contract.
- **Constants + schema pair**: enum-like constants (e.g. `Role`) are `as const` objects validated by a `picklist` schema built from those same constants; the type is inferred from the schema. When a boundary excludes some values (e.g. `FarmRoleSchema` excludes `super_admin` because provisioning Super Admins is forbidden), define the narrower schema and use it where that boundary applies — don't reach for the wider one.
- **Request bodies**: routes validate with `v.safeParse(schema, req.body)` and reply 400 with `firstIssue(...)` from `apps/server/src/lib/validate.ts`. User-facing validation messages are Indonesian and written in the schema, not the route.
- **Env**: validated once at startup in `apps/server/src/config.ts` with a valibot `EnvSchema`; failures throw one fail-fast error listing every invalid variable. No fallback credentials.

### Domain docs

Single-context: read root `CONTEXT.md` and relevant ADRs in `docs/adr/`. See `docs/agents/domain.md`.
Spec: read .scratch/broiler-farm-app/spec.md
