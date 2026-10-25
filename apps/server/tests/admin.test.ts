// Super Admin endpoints: farm + user provisioning, deactivation, password reset.

import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { setupSuite } from "./helpers.js";

const t = setupSuite();

beforeAll(t.beforeAll);
afterAll(t.afterAll);
beforeEach(t.beforeEach);

describe("Super Admin provisioning", () => {
  test("provisions an Owner and an Operator on one farm", async () => {
    const token = await t.superAdminToken();
    const farm = await t.createFarm(token, "Farm A");
    const owner = await t.provisionUser(token, "owner", farm.id);
    const operator = await t.provisionUser(token, "operator", farm.id);

    expect(owner.role).toBe("owner");
    expect(owner.farmId).toBe(farm.id);
    expect(operator.role).toBe("operator");
    expect(operator.farmId).toBe(farm.id);
  });

  test("rejects provisioning with the super_admin role", async () => {
    const token = await t.superAdminToken();
    const res = await t.adminFetch(token, "/api/admin/users", {
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
    const token = await t.superAdminToken();
    const farm = await t.createFarm(token, "Farm A");
    const owner = await t.provisionUser(token, "owner", farm.id);
    const res = await t.adminFetch(token, "/api/admin/users", {
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
    const token = await t.superAdminToken();
    const farm = await t.createFarm(token, "Farm A");
    const owner = await t.provisionUser(token, "owner", farm.id);
    const ownerToken = (await t.login(owner.username, "password123")).body.token;

    await t.adminFetch(token, `/api/admin/users/${owner.id}/active`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: false }),
    });

    const res = await fetch(`${t.BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    expect(res.status).toBe(401);
  });

  test("cannot deactivate the Super Admin", async () => {
    const token = await t.superAdminToken();
    const res = await t.adminFetch(token, "/api/admin/users/1/active", {
      method: "PATCH",
      body: JSON.stringify({ isActive: false }),
    });
    expect(res.status).toBe(404);
  });

  test("Super Admin can reset a user's password; user logs in with it", async () => {
    const token = await t.superAdminToken();
    const farm = await t.createFarm(token, "Farm A");
    const owner = await t.provisionUser(token, "owner", farm.id);

    const res = await t.adminFetch(token, `/api/admin/users/${owner.id}/password`, {
      method: "PATCH",
      body: JSON.stringify({ password: "newpassword99" }),
    });
    expect(res.status).toBe(200);

    const { res: loginRes } = await t.login(owner.username, "newpassword99");
    expect(loginRes.status).toBe(200);
  });
});
