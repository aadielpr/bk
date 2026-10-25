// Auth endpoints: login, session identity, and password change.

import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { config } from "../src/config.js";
import { setupSuite } from "./helpers.js";

const t = setupSuite();
const SA_USER = config.superAdminUsername;
const SA_PASS = config.superAdminPassword;

beforeAll(t.beforeAll);
afterAll(t.afterAll);
beforeEach(t.beforeEach);

describe("POST /api/auth/login", () => {
  test("logs in the Super Admin and returns token + user", async () => {
    const { res, body } = await t.login(SA_USER, SA_PASS);
    expect(res.status).toBe(200);
    expect(body.token).toBeString();
    expect(body.user.role).toBe("super_admin");
  });

  test("rejects a wrong password", async () => {
    const { res } = await t.login(SA_USER, "wrongpass");
    expect(res.status).toBe(401);
  });

  test("rejects an unknown username", async () => {
    const { res } = await t.login("nobody", SA_PASS);
    expect(res.status).toBe(401);
  });

  test("rejects a deactivated account", async () => {
    const token = await t.superAdminToken();
    const farm = await t.createFarm(token, "Farm X");
    const user = await t.provisionUser(token, "owner", farm.id);
    await t.adminFetch(token, `/api/admin/users/${user.id}/active`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: false }),
    });

    const { res } = await t.login(user.username, "password123");
    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/change-password", () => {
  test("user changes own password; old password stops working", async () => {
    const token = await t.superAdminToken();
    const farm = await t.createFarm(token, "Farm A");
    const owner = await t.provisionUser(token, "owner", farm.id);
    const ownerToken = (await t.login(owner.username, "password123")).body.token;

    const res = await t.adminFetch(ownerToken, "/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword: "password123", newPassword: "brandnewpass1" }),
    });
    expect(res.status).toBe(200);

    const oldLogin = await t.login(owner.username, "password123");
    expect(oldLogin.res.status).toBe(401);

    const newLogin = await t.login(owner.username, "brandnewpass1");
    expect(newLogin.res.status).toBe(200);
  });

  test("rejects a wrong current password and short passwords", async () => {
    const token = await t.superAdminToken();
    const farm = await t.createFarm(token, "Farm A");
    const owner = await t.provisionUser(token, "owner", farm.id);
    const ownerToken = (await t.login(owner.username, "password123")).body.token;

    const wrongCurrent = await t.adminFetch(ownerToken, "/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword: "wrongpass", newPassword: "brandnewpass1" }),
    });
    expect(wrongCurrent.status).toBe(400);

    const tooShort = await t.adminFetch(ownerToken, "/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword: "password123", newPassword: "short" }),
    });
    expect(tooShort.status).toBe(400);
  });
});
