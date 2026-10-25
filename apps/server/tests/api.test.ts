// Endpoint tests for issue #2 — access, provisioning, and role scoping.
// Runs against a real Postgres using the app's own DATABASE_URL.
// The test database is truncated between cases; no unit/function tests by design.

import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import type { Server } from "node:http";
import postgres from "postgres";
import { createApp } from "../src/app.js";
import { config } from "../src/config.js";

const app = createApp();
const PORT = 3999;
const BASE = `http://localhost:${PORT}`;

const sql = postgres(config.databaseUrl, { max: 1 });

let server: Server | undefined;

beforeAll(() => {
  server = app.listen(PORT);
});

afterAll(() => {
  server?.close();
  sql.end();
});

beforeEach(async () => {
  await sql`TRUNCATE coop_assignments, coops, users, farms RESTART IDENTITY CASCADE`;
  // Fresh Super Admin for every case, password known to the tests.
  await sql`INSERT INTO users (username, password_hash, role)
            VALUES ('superadmin', ${await Bun.password.hash("superpass123")}, 'super_admin')`;
});

interface TestUser {
  id: number;
  username: string;
  role: string;
  farmId: number | null;
}

async function login(username: string, password: string) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const body = await res.json();
  return { res, body };
}

async function superAdminToken(): Promise<string> {
  const { body } = await login("superadmin", "superpass123");
  return body.token;
}

async function adminFetch(
  token: string,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  return fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...init.headers },
  });
}

let seq = 0;
async function provisionUser(
  token: string,
  role: "owner" | "operator",
  farmId: number,
): Promise<TestUser> {
  seq += 1;
  const res = await adminFetch(token, "/api/admin/users", {
    method: "POST",
    body: JSON.stringify({
      username: `user${seq}`,
      password: "password123",
      role,
      farmId,
    }),
  });
  expect(res.status).toBe(201);
  return res.json();
}

async function createFarm(token: string, name: string) {
  const res = await adminFetch(token, "/api/admin/farms", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  expect(res.status).toBe(201);
  return res.json();
}

// --- Login ---------------------------------------------------------------

describe("POST /api/auth/login", () => {
  test("logs in the Super Admin and returns token + user", async () => {
    const { res, body } = await login("superadmin", "superpass123");
    expect(res.status).toBe(200);
    expect(body.token).toBeString();
    expect(body.user.role).toBe("super_admin");
  });

  test("rejects a wrong password", async () => {
    const { res } = await login("superadmin", "wrongpass");
    expect(res.status).toBe(401);
  });

  test("rejects an unknown username", async () => {
    const { res } = await login("nobody", "superpass123");
    expect(res.status).toBe(401);
  });

  test("rejects a deactivated account", async () => {
    const token = await superAdminToken();
    const farm = await createFarm(token, "Farm X");
    const user = await provisionUser(token, "owner", farm.id);
    await adminFetch(token, `/api/admin/users/${user.id}/active`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: false }),
    });

    const { res } = await login(user.username, "password123");
    expect(res.status).toBe(401);
  });
});

// --- Provisioning (Super Admin) -----------------------------------------

describe("Super Admin provisioning", () => {
  test("provisions an Owner and an Operator on one farm", async () => {
    const token = await superAdminToken();
    const farm = await createFarm(token, "Farm A");
    const owner = await provisionUser(token, "owner", farm.id);
    const operator = await provisionUser(token, "operator", farm.id);

    expect(owner.role).toBe("owner");
    expect(owner.farmId).toBe(farm.id);
    expect(operator.role).toBe("operator");
    expect(operator.farmId).toBe(farm.id);
  });

  test("rejects provisioning with the super_admin role", async () => {
    const token = await superAdminToken();
    const res = await adminFetch(token, "/api/admin/users", {
      method: "POST",
      body: JSON.stringify({
        username: "hacker",
        password: "password123",
        role: "super_admin",
        farmId: 1,
      }),
    });
    expect(res.status).toBe(400);
  });

  test("rejects a duplicate username", async () => {
    const token = await superAdminToken();
    const farm = await createFarm(token, "Farm A");
    const owner = await provisionUser(token, "owner", farm.id);
    const res = await adminFetch(token, "/api/admin/users", {
      method: "POST",
      body: JSON.stringify({
        username: owner.username,
        password: "password123",
        role: "operator",
        farmId: farm.id,
      }),
    });
    expect(res.status).toBe(409);
  });

  test("deactivated user's token is rejected immediately", async () => {
    const token = await superAdminToken();
    const farm = await createFarm(token, "Farm A");
    const owner = await provisionUser(token, "owner", farm.id);
    const ownerToken = (await login(owner.username, "password123")).body.token;

    await adminFetch(token, `/api/admin/users/${owner.id}/active`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: false }),
    });

    const res = await fetch(`${BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    expect(res.status).toBe(401);
  });

  test("cannot deactivate the Super Admin", async () => {
    const token = await superAdminToken();
    const res = await adminFetch(token, "/api/admin/users/1/active", {
      method: "PATCH",
      body: JSON.stringify({ isActive: false }),
    });
    expect(res.status).toBe(404);
  });
});

// --- Coop scoping --------------------------------------------------------

describe("Coop access scoping", () => {
  async function seededScenario() {
    const adminToken = await superAdminToken();
    const farmA = await createFarm(adminToken, "Farm A");
    const farmB = await createFarm(adminToken, "Farm B");
    const ownerA = await provisionUser(adminToken, "owner", farmA.id);
    const operatorA = await provisionUser(adminToken, "operator", farmA.id);
    const ownerB = await provisionUser(adminToken, "owner", farmB.id);

    const ownerAToken = (await login(ownerA.username, "password123")).body.token;
    const ownerBToken = (await login(ownerB.username, "password123")).body.token;

    // Owner A creates two coops; Owner B creates one.
    const coop1 = await (
      await fetch(`${BASE}/api/coops`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${ownerAToken}` },
        body: JSON.stringify({ name: "Kandang 1" }),
      })
    ).json();
    const coop2 = await (
      await fetch(`${BASE}/api/coops`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${ownerAToken}` },
        body: JSON.stringify({ name: "Kandang 2" }),
      })
    ).json();
    await fetch(`${BASE}/api/coops`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${ownerBToken}` },
      body: JSON.stringify({ name: "Kandang B1" }),
    });

    // Assign operatorA to coop1 only.
    await adminFetch(ownerAToken, `/api/coops/${coop1.id}/operators`, {
      method: "PUT",
      body: JSON.stringify({ operatorIds: [operatorA.id] }),
    });

    return { farmA, farmB, ownerA, operatorA, ownerB, coop1, coop2 };
  }

  test("unauthenticated request is rejected", async () => {
    const res = await fetch(`${BASE}/api/coops`);
    expect(res.status).toBe(401);
  });

  test("Owner sees all coops of their farm, not other farms", async () => {
    const { ownerA } = await seededScenario();
    const ownerAToken = (await login(ownerA.username, "password123")).body.token;
    const res = await fetch(`${BASE}/api/coops`, {
      headers: { Authorization: `Bearer ${ownerAToken}` },
    });
    const coops = await res.json();
    expect(coops.map((c: { name: string }) => c.name).sort()).toEqual([
      "Kandang 1",
      "Kandang 2",
    ]);
  });

  test("Operator sees only coops assigned to them", async () => {
    const { operatorA, coop1 } = await seededScenario();
    const operatorAToken = (await login(operatorA.username, "password123")).body.token;
    const res = await fetch(`${BASE}/api/coops`, {
      headers: { Authorization: `Bearer ${operatorAToken}` },
    });
    const coops = await res.json();
    expect(coops.map((c: { id: number }) => c.id)).toEqual([coop1.id]);
  });

  test("Super Admin sees all coops across farms", async () => {
    await seededScenario();
    const token = await superAdminToken();
    const res = await fetch(`${BASE}/api/coops`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const coops = await res.json();
    expect(coops).toHaveLength(3);
  });

  test("Owner cannot manage coops of another farm", async () => {
    const { ownerB, coop1 } = await seededScenario();
    const ownerBToken = (await login(ownerB.username, "password123")).body.token;

    const rename = await fetch(`${BASE}/api/coops/${coop1.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${ownerBToken}` },
      body: JSON.stringify({ name: "Dikuasai" }),
    });
    expect(rename.status).toBe(404);

    const assign = await adminFetch(ownerBToken, `/api/coops/${coop1.id}/operators`, {
      method: "PUT",
      body: JSON.stringify({ operatorIds: [] }),
    });
    expect(assign.status).toBe(404);
  });

  test("Operator cannot create or manage coops", async () => {
    const { operatorA } = await seededScenario();
    const operatorAToken = (await login(operatorA.username, "password123")).body.token;

    const create = await fetch(`${BASE}/api/coops`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${operatorAToken}` },
      body: JSON.stringify({ name: "Kandang Baru" }),
    });
    expect(create.status).toBe(403);

    const assign = await adminFetch(operatorAToken, "/api/coops/1/operators", {
      method: "PUT",
      body: JSON.stringify({ operatorIds: [] }),
    });
    expect(assign.status).toBe(403);
  });

  test("Owner cannot assign an operator from another farm to their coop", async () => {
    const adminToken = await superAdminToken();
    const { ownerA, coop1, farmB } = await seededScenario();
    const operatorB = await provisionUser(adminToken, "operator", farmB.id);

    const ownerAToken = (await login(ownerA.username, "password123")).body.token;
    const res = await adminFetch(ownerAToken, `/api/coops/${coop1.id}/operators`, {
      method: "PUT",
      body: JSON.stringify({ operatorIds: [operatorB.id] }),
    });
    expect(res.status).toBe(400);
  });

  test("Super Admin cannot provision users or farms through non-admin routes", async () => {
    const token = await superAdminToken();
    const res = await fetch(`${BASE}/api/coops`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: "Kandang SA" }),
    });
    // Super Admin has no farm, so creating a coop must fail.
    expect(res.status).toBe(403);
  });
});

// --- Password flows ------------------------------------------------------

describe("Password flows", () => {
  test("Super Admin can reset a user's password; user logs in with it", async () => {
    const token = await superAdminToken();
    const farm = await createFarm(token, "Farm A");
    const owner = await provisionUser(token, "owner", farm.id);

    const res = await adminFetch(token, `/api/admin/users/${owner.id}/password`, {
      method: "PATCH",
      body: JSON.stringify({ password: "newpassword99" }),
    });
    expect(res.status).toBe(200);

    const { res: loginRes } = await login(owner.username, "newpassword99");
    expect(loginRes.status).toBe(200);
  });

  test("user changes own password; old password stops working", async () => {
    const token = await superAdminToken();
    const farm = await createFarm(token, "Farm A");
    const owner = await provisionUser(token, "owner", farm.id);
    const ownerToken = (await login(owner.username, "password123")).body.token;

    const res = await adminFetch(ownerToken, "/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword: "password123", newPassword: "brandnewpass1" }),
    });
    expect(res.status).toBe(200);

    const oldLogin = await login(owner.username, "password123");
    expect(oldLogin.res.status).toBe(401);

    const newLogin = await login(owner.username, "brandnewpass1");
    expect(newLogin.res.status).toBe(200);
  });

  test("change-password rejects a wrong current password and short passwords", async () => {
    const token = await superAdminToken();
    const farm = await createFarm(token, "Farm A");
    const owner = await provisionUser(token, "owner", farm.id);
    const ownerToken = (await login(owner.username, "password123")).body.token;

    const wrongCurrent = await adminFetch(ownerToken, "/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword: "wrongpass", newPassword: "brandnewpass1" }),
    });
    expect(wrongCurrent.status).toBe(400);

    const tooShort = await adminFetch(ownerToken, "/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword: "password123", newPassword: "short" }),
    });
    expect(tooShort.status).toBe(400);
  });
});
