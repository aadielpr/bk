# Agent skills

## Setup

### Domain docs

Single-context: read root `CONTEXT.md` and relevant ADRs in `docs/adr/`. See `docs/agents/domain.md`.
Spec: read .scratch/broiler-farm-app/spec.md

### Runtime & Package Manager

- Language: TypeScript
- Runtime: Bun
- Package Manager: Use `bun` or `bunx` for all dependency management.
- Validation: Valibot
- ORM: Drizzle
- Database: Postgres
- Auth: JWT
- Server Library: Hono

---

## Code Style

### Language

- English only. No Indonesian in this codebase: identifiers, comments, log messages, error messages, validation messages, test names, commit messages, and docs.
- This applies to anything the API returns too — clients translate for display, the server never ships Indonesian strings.

### File Naming Convention

- Use **dot notation**: `module.type.ts`
- Examples: `user.controller.ts`, `auth.service.ts`, `user.schema.ts`

### Code Formatting

- Use **Prettier** to format all code
- Run Prettier before finishing your task. Check package.json or similar for existing script.

### Logging

- Use the `Slog` class for logging.

### Conditional Statements

- Prioritize guard clauses and early returns to handle edge cases immediately.

### Controller

add the route when creating a route handler in controller

```js
    // POST /api/v1/auth/login
    async login(c: Context) {}
```

Validate the raw input with a DTO, never inside the controller logic. Read the body, hand it to `<Dto>.create(...)`, and use the parsed result. `Success.*` takes the context and returns the response, so the controller returns it inline:

```ts
    // POST /api/v1/auth/login
    async login(c: Context<AuthEnv>) {
        const body = await c.req.json();
        const data = LoginBody.create(body);
        const result = await this.auth.login(data);
        return Success.Ok(c, result.user, { access: result.token });
    }
```

```ts
const { farmId } = FarmIdQuery.create(c.req.query());
const { id } = IdParam.create(c.req.param());
```

`.create()` throws a Valibot `ValiError`; `errorHandler` turns it into a 400 with every issue in `validation`. Do not catch or reshape it in the controller.

---

## Architecture

### Dependency Injection Pattern

- Use classes for all components: services, repositories, controllers, server, infrastructure, etc.
- Use constructor injection. Dependencies are passed through class constructors.
- Only the composition root (`src/index.ts`) constructs infrastructure (`DatabaseClient`, `RedisClient`, JWT, mail, storage, etc.) and wires the graph.
- Wire in dependency order: infrastructure first, then repositories, services, controllers, routers, server.
- Modules must not `new` their own infrastructure. `config` and `Slog` may be imported directly.
- No DI container. No `constructor(deps: THugeDeps)` bag to hide arity.
- Avoid inheritance as much as possible.
- I prefer to use object constans (as const) and derived the union type rather than enum and boolean.
- Routers and one-off helpers may be functions. Classes are for objects that hold collaborators and expose several operations.

### Layers

- Default path: controller → service → repository.
- Skip a layer when it would only forward calls. Do not add a service or repository with no behavior.
- A controller may depend on a lib service or a repository when the module has no extra rules to house.

### Module Structure

Each module contains (not necessarily all of these):

- `router` - Route definitions
- `controller` - Request handling (class)
- `service` - Business logic (class)
- `repository` - Database access (class)
- `keys.ts` - Redis key definitions (optional, if module uses Redis)
- `dto` - Data Transfer Objects (DTOs)
- or anything related to the module

Keep the repository in the module that owns it (`src/modules/user/user.repository.ts`). Do not collect repositories into a global `repositories/` folder. Tables and migrations stay in `src/lib/drizzle/`.

### Cross-module dependencies

- Need rows or data → depend on that module's repository.
- Need invariants or behavior → depend on that module's service.
- Do not import another module's controller or router internals.
- No cyclic service dependencies. If two services need the same behavior, extract that behavior.
- Shared instances are created once in the composition root and passed in.

### Ports

- Do not add TypeScript interfaces for repositories or services by default.
- Add a port only when a second adapter exists (two providers, or production + a real stand-in). Mail and storage factories are the model.

### When the composition root or a constructor grows

- If `src/index.ts` becomes hard to read, extract per-module factories that return a router. Shared instances stay in the root. Still no container.
- If a constructor grows past ~5 collaborators, the class is doing two jobs. Split by job, not by endpoint. Do not wrap the same args in a deps object.

## Type and Data Shape Safety

When creating a reusable application data shape or boundary object, create the Valibot schema first and derive the TypeScript type from it.

```ts
export const vExample = v.object({
    id: v.string(),
});

export type TExample = v.InferOutput<typeof vExample>;
```

This applies to request bodies, query parameters, route parameters, API responses, DTOs, queue messages, configuration objects, complex database result shapes, and reusable function input or output objects.

Simple database table shapes may use Drizzle inferred types:

```ts
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

Use Drizzle inferred types when the shape directly represents a table select or insert/update type. Use a Valibot schema when a database result is transformed, joined, aggregated, selected into a custom shape, or exposed as an application or API DTO.

Choose one source of truth for each shape. Do not manually define a TypeScript type that duplicates an equivalent Valibot or Drizzle type. Local temporary objects used only inside one function do not need a named schema or type.

### Schema and Type File Location

- Every boundary shape — request bodies, query and param shapes, response/entity shapes — lives in `packages/shared/src/types/<concept>.ts`, with its DTO class and inferred type in the same file.
- `apps/server` holds no schemas. Configuration schemas stay in `src/config.ts`; infrastructure or provider-specific shapes go next to their implementation in `src/lib/`.
- Drizzle table schemas and their direct Drizzle-inferred types go in `src/lib/drizzle/schema.ts`.
- Export the schema as `<Name>Schema`, the DTO class as `<Name>`, and the inferred type as `T<Name>` (entity types keep the plain name: `AuthUser`, `Coop`, `Farm`).

### DTOs

Every boundary shape gets a DTO: a schema, a class with `.create()`, and the inferred type — all three in `packages/shared/src/types/<concept>.ts`, next to the schema they wrap. Never in `apps/server`.

```ts
// packages/shared/src/types/auth.ts
import * as v from "valibot";
import { ValibotSchema } from "../valibot.schema.js";
import { PasswordSchema } from "./user.js";

export const ChangePasswordBodySchema = v.object({
    currentPassword: v.string(),
    newPassword: PasswordSchema,
});

export class ChangePasswordBody extends ValibotSchema(ChangePasswordBodySchema) {}

export type TChangePasswordBody = v.InferOutput<typeof ChangePasswordBodySchema>;
```

- `ValibotSchema` (also in `packages/shared`, exported from `@bk/shared`) is a class factory: `ValibotSchema(schema)` returns a class whose static `.create(input)` runs `v.parse` and returns `v.InferOutput<T>`. Do not add another wrapper or a hand-written parser.
- Controllers import the class from `@bk/shared` and call `LoginBody.create(await c.req.json())`, `FarmIdQuery.create(c.req.query())`, `IdParam.create(c.req.param())`. Services and repositories take the inferred type (`TLoginBody`), never the class.
- Naming inside `packages/shared`: `<Name>Schema` for the schema, `<Name>` for the DTO class, `T<Name>` for the inferred type — matching the existing shared files (`AuthUserSchema` / `AuthUser`).
- One file per concept, not per shape: request bodies, query shapes, params, and the entity DTO of the same concept live in that concept's file (`user.ts` holds `AuthUserSchema`, `UserDto`, the provision/set-active/reset-password bodies).

Use dot notation for filenames. Schemas and DTOs are named by concept, not by role — `types/user.ts`, `types/auth.ts`, `types/farm.ts`:

- `<concept>.ts` inside `packages/shared/src/types/` for schemas, DTO classes, and inferred types.
- `<table>.ts` inside `src/lib/drizzle/schema/` for Drizzle table definitions.
- `<name>.enum.ts` - enums (const + valibot union)
- `<name>.rabbit.ts` - RabbitMQ message payload
- `<name>.sqs.ts` - SQS message payload

---

## Database Conventions

### Timestamp columns

Every table carries the same three timestamps. Build them with the `timestamps()` helper in `src/lib/drizzle/schema.ts`; never declare them per table.

```ts
export const farms = pgTable("farms", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    ...timestamps(),
});
```

- `c_at` — creation time. Filled on every insert (`defaultNow()`).
- `u_at` — update time. Set on every update, in the repository that writes the row.
- `d_at` — deletion time. Set when the row is deleted.

### Soft delete

- Deleting means setting `d_at`; repositories never run a real `DELETE`.
- Reads of live data filter `d_at IS NULL`. Soft-deleted rows are read only where they must be restored or audited: the admin user list, and an authorization check on the row being acted on.
- Replacing a collection (e.g. a coop's operator assignments) soft-deletes the live rows and inserts the new ones.

### No boolean columns

A column that would be a boolean is a nullable timestamp instead: `NULL` means "not applied", a value means "applied at". Deactivation uses `d_at`, so a deactivated account is `d_at IS NOT NULL`.

- API booleans are derived at the service boundary, not stored: `isActive: user.dAt === null`.
- Request bodies may still carry booleans (`{ isActive: false }`); they are actions, not columns.

### Unique keys

Every unique key includes the soft-delete column so a deleted row stops reserving its value but stays unique among live rows. Use a partial unique index:

```ts
uniqueIndex("users_username_live_idx")
    .on(t.username)
    .where(sql`${t.dAt} IS NULL`);
```

Because live and deleted rows can share the value, lookups of live rows filter `d_at IS NULL` (see `findByUsername`).

A plain `UNIQUE (username, d_at)` does not work in Postgres — `NULL` values never conflict, so live duplicates would pass.

### Migrations

- Migrations live in `src/db/migrations/<timestamp>_<name>/migration.sql` (drizzle-kit folder format v9).
- Generate with `bunx drizzle-kit generate` after changing `src/lib/drizzle/schema.ts`.
- Agents never run migrations. Report the command instead: `bun run db:migrate`, `bun run db:migrate:test`.

---

## Development

### Testing

- Use Bun's built-in test runner (`bun test`)
- Test files should be colocated with source files or in a `__tests__` directory
- Naming: `module.test.ts` (e.g., `auth.service.test.ts`)

---
