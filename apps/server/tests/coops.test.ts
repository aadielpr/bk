// Coop endpoints: role-scoped listing, owner-only management, and operator
// assignment boundaries.

import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { setupSuite } from "./helpers.js";

const t = setupSuite(4003);
const BASE = "http://localhost:4003";

beforeAll(t.beforeAll);
afterAll(t.afterAll);
beforeEach(t.beforeEach);

// Standard fixture: two farms, owners on both, one operator on farm A
// assigned to its first coop.
async function seededScenario() {
  const adminToken = await t.superAdminToken();
  const farmA = await t.createFarm(adminToken, "Farm A");
  const farmB = await t.createFarm(adminToken, "Farm B");
  const ownerA = await t.provisionUser(adminToken, "owner", farmA.id);
  const operatorA = await t.provisionUser(adminToken, "operator", farmA.id);
  const ownerB = await t.provisionUser(adminToken, "owner", farmB.id);

  const ownerAToken = (await t.login(ownerA.username, "password123")).body.token;
  const ownerBToken = (await t.login(ownerB.username, "password123")).body.token;

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

  await t.adminFetch(ownerAToken, `/api/coops/${coop1.id}/operators`, {
    method: "PUT",
    body: JSON.stringify({ operatorIds: [operatorA.id] }),
  });

  return { farmA, farmB, ownerA, operatorA, ownerB, coop1, coop2 };
}

describe("GET /api/coops (role scoping)", () => {
  test("unauthenticated request is rejected", async () => {
    const res = await fetch(`${BASE}/api/coops`);
    expect(res.status).toBe(401);
  });

  test("Owner sees all coops of their farm, not other farms", async () => {
    const { ownerA } = await seededScenario();
    const ownerAToken = (await t.login(ownerA.username, "password123")).body.token;
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
    const operatorAToken = (await t.login(operatorA.username, "password123")).body.token;
    const res = await fetch(`${BASE}/api/coops`, {
      headers: { Authorization: `Bearer ${operatorAToken}` },
    });
    const coops = await res.json();
    expect(coops.map((c: { id: number }) => c.id)).toEqual([coop1.id]);
  });

  test("Super Admin sees all coops across farms", async () => {
    await seededScenario();
    const token = await t.superAdminToken();
    const res = await fetch(`${BASE}/api/coops`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const coops = await res.json();
    expect(coops).toHaveLength(3);
  });
});

describe("Owner coop management", () => {
  test("Owner cannot manage coops of another farm", async () => {
    const { ownerB, coop1 } = await seededScenario();
    const ownerBToken = (await t.login(ownerB.username, "password123")).body.token;

    const rename = await fetch(`${BASE}/api/coops/${coop1.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${ownerBToken}` },
      body: JSON.stringify({ name: "Dikuasai" }),
    });
    expect(rename.status).toBe(404);

    const assign = await t.adminFetch(ownerBToken, `/api/coops/${coop1.id}/operators`, {
      method: "PUT",
      body: JSON.stringify({ operatorIds: [] }),
    });
    expect(assign.status).toBe(404);
  });

  test("Operator cannot create or manage coops", async () => {
    const { operatorA } = await seededScenario();
    const operatorAToken = (await t.login(operatorA.username, "password123")).body.token;

    const create = await fetch(`${BASE}/api/coops`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${operatorAToken}` },
      body: JSON.stringify({ name: "Kandang Baru" }),
    });
    expect(create.status).toBe(403);

    const assign = await t.adminFetch(operatorAToken, "/api/coops/1/operators", {
      method: "PUT",
      body: JSON.stringify({ operatorIds: [] }),
    });
    expect(assign.status).toBe(403);
  });

  test("Owner cannot assign an operator from another farm to their coop", async () => {
    const adminToken = await t.superAdminToken();
    const { ownerA, coop1, farmB } = await seededScenario();
    const operatorB = await t.provisionUser(adminToken, "operator", farmB.id);

    const ownerAToken = (await t.login(ownerA.username, "password123")).body.token;
    const res = await t.adminFetch(ownerAToken, `/api/coops/${coop1.id}/operators`, {
      method: "PUT",
      body: JSON.stringify({ operatorIds: [operatorB.id] }),
    });
    expect(res.status).toBe(400);
  });

  test("Super Admin has no farm, so cannot create a coop", async () => {
    const token = await t.superAdminToken();
    const res = await fetch(`${BASE}/api/coops`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: "Kandang SA" }),
    });
    expect(res.status).toBe(403);
  });
});
