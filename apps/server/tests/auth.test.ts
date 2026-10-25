// Auth endpoints: login, session identity, and password change.

import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import {
  adminFetch,
  startServer,
  closeServer,
  resetDb,
  createFarm,
  login,
  provisionUser,
  SA_PASS,
  SA_USER,
  superAdminToken,
} from "./helpers.js";

beforeAll(startServer);
afterAll(closeServer);
beforeEach(resetDb);

describe("POST /api/auth/login", () => {
  test("logs in the Super Admin and returns token + user", async () => {
    const { res, body } = await login(SA_USER, SA_PASS);
    expect(res.status).toBe(200);
    expect(body.token).toBeString();
    expect(body.user.role).toBe("super_admin");
  });

  test("rejects a wrong password", async () => {
    const { res } = await login(SA_USER, "wrongpass");
    expect(res.status).toBe(401);
  });

  test("rejects an unknown username", async () => {
    const { res } = await login("nobody", SA_PASS);
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

describe("POST /api/auth/change-password", () => {
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

  test("rejects a wrong current password and short passwords", async () => {
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
