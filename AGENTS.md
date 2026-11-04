## Agent skills

### Issue tracker

GitHub Issues in `aadielpr/bk` are the source of truth for published specs and tickets. Use `.scratch/<feature-slug>/` only for drafts and supporting artifacts. See `docs/agents/issue-tracker.md`.

### Triage labels

Use `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Infrastructure credentials

Connection URLs (Postgres, Redis, SQS, queues, storage) live in the environment and are set by the operator, never by agents. Agents read URLs from env/config; if a connection fails for missing or invalid credentials, stop and report. Don't create roles, users, databases, passwords, or connection strings, and don't commit them.

### Code comments

Do not comment anything except its required.

### Return values

Never return a call expression. Assign it to a named value first, then return the value. Applies to the whole codebase: server, shared, web.

```ts
// Bad
return await this.users.findById(id);
return localStorage.getItem(TOKEN_KEY);
return this.db.select().from(farms);

// Good
const user = await this.users.findById(id);
return user;
```

The name says what is being returned (useful when logging or debugging) and keeps each call on its own statement. Applies to plain calls, `await`ed calls, and promise chains.

Not affected: object and array literals, ternaries, and plain identifiers (`return { ok: true }`, `return coop`, `return raw ? parse(raw) : null`).

Exception: response writing. `return c.json(...)`, `return c.text(...)`, `return c.body(...)`, and the `Success.*` helpers (`return Success.Ok(c, data)`) stay inline — writing the response is the statement's whole job.

```ts
// Good
return c.json(response, 404);
return Success.Ok(c, data);
```

### Git: commit and push

Commit and push only when the operator says to. Don't commit, push, or open PRs unprompted — report the change and wait for the instruction.

Before any `git add`, run `bun run format` so committed code is always in Prettier style. Verify `bun run format:check` passes before pushing.

### Validation & types: Valibot

Valibot is the source of truth for both validation and types. Every API shape's exported type comes from `v.InferOutput<typeof Schema>` — don't hand-write TypeScript interfaces for API shapes, request bodies, or payloads; write a valibot schema and infer the type from it.

- **Location**: all schemas and their DTO classes live in `packages/shared/src/types/` (one file per concept eg: `role`, `user`, `auth`, `farm`, `coop`, `token`, `api`), re-exported through the barrel from the package root `@bk/shared`, so server and web share one contract. Nothing shape-related stays in `apps/server`.
- **Constants + schema pair**: enum-like constants (e.g. `Role`) are `as const` objects validated by a `picklist` schema built from those same constants; the type is inferred from the schema. When a boundary excludes some values (e.g. `FarmRoleSchema` excludes `super_admin` because provisioning Super Admins is forbidden), define the narrower schema and use it where that boundary applies — don't reach for the wider one.
- **Request bodies**: every request shape is a DTO next to its schema — `XxxBodySchema`, `class XxxBody extends ValibotSchema(XxxBodySchema)`, `type TXxxBody`. Controllers call `XxxBody.create(await c.req.json())`, `XxxQuery.create(c.req.query())`, `XxxParam.create(c.req.param())`; `.create()` throws a `ValiError` and the error handler replies 400 with all issues. Never `v.safeParse` inline in a route or controller.
- **Responses**: `Success.Ok(c, data)`, `Success.Created(c, data)`, `Success.Paginated(c, ...)`, `Success.NoContent(c)` take the Hono context and return the `Response` (envelope + status). Controllers return them inline: `return Success.Ok(c, data);`.

### Domain docs

Single-context: read root `CONTEXT.md` and relevant ADRs in `docs/adr/`. See `docs/agents/domain.md`.
Spec: read .scratch/broiler-farm-app/spec.md
