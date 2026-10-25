// Shared test harness for endpoint tests.
// Each suite gets its own app instance, port, and DB connection, with a
// truncated database and a fresh Super Admin before every test.

import type { Server } from "node:http";
import postgres from "postgres";
import { createApp } from "../src/app.js";
import { config } from "../src/config.js";

export interface TestUser {
  id: number;
  username: string;
  role: string;
  farmId: number | null;
}

export interface FarmRow {
  id: number;
  name: string;
}

export function setupSuite(port: number) {
  const BASE = `http://localhost:${port}`;
  const sql = postgres(config.databaseUrl, { max: 1 });
  let server: Server | undefined;
  let seq = 0;

  async function beforeAll() {
    server = createApp().listen(port);
  }

  async function afterAll() {
    server?.close();
    await sql.end();
  }

  // Truncate everything, then insert a known Super Admin (superpass123).
  async function beforeEach() {
    await sql`TRUNCATE coop_assignments, coops, users, farms RESTART IDENTITY CASCADE`;
    await sql`INSERT INTO users (username, password_hash, role)
              VALUES ('superadmin', ${await Bun.password.hash("superpass123")}, 'super_admin')`;
    seq = 0;
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
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...init.headers,
      },
    });
  }

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
    if (res.status !== 201) throw new Error(`provisionUser failed: ${res.status}`);
    return res.json();
  }

  async function createFarm(token: string, name: string): Promise<FarmRow> {
    const res = await adminFetch(token, "/api/admin/farms", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    if (res.status !== 201) throw new Error(`createFarm failed: ${res.status}`);
    return res.json();
  }

  return {
    beforeAll,
    afterAll,
    beforeEach,
    login,
    superAdminToken,
    adminFetch,
    provisionUser,
    createFarm,
  };
}
