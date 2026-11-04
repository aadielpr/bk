import { afterAll, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import {
    adminFetch,
    BASE,
    startServer,
    closeServer,
    resetDb,
    createFarm,
    login,
    provisionUser,
    superAdminToken,
} from "./helpers.js";

beforeAll(startServer);
afterAll(closeServer);
beforeEach(resetDb);

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
        const res = await adminFetch(token, "/api/v1/admin/users", {
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
        const res = await adminFetch(token, "/api/v1/admin/users", {
            method: "POST",
            body: JSON.stringify({
                username: owner.username,
                password: "password123",
                role: "operator",
                farmId: farm.id,
            }),
        });
        expect(res.status).toBe(409);
        const body = await res.json();
        expect(body.ok).toBe(false);
        expect(body.statusCode).toBe(409);
        expect(body.message).toBe("Username is already taken");
    });

    test("rejects a username already used on another farm", async () => {
        const token = await superAdminToken();
        const farmA = await createFarm(token, "Farm A");
        const farmB = await createFarm(token, "Farm B");
        const ownerA = await provisionUser(token, "owner", farmA.id);

        const res = await adminFetch(token, "/api/v1/admin/users", {
            method: "POST",
            body: JSON.stringify({
                username: ownerA.username,
                password: "password123",
                role: "owner",
                farmId: farmB.id,
            }),
        });
        expect(res.status).toBe(409);
    });

    test("rejects provisioning without a farmId", async () => {
        const token = await superAdminToken();
        const res = await adminFetch(token, "/api/v1/admin/users", {
            method: "POST",
            body: JSON.stringify({
                username: "nofarm",
                password: "password123",
                role: "owner",
            }),
        });
        expect(res.status).toBe(400);
    });

    test("deactivated user's token is rejected immediately", async () => {
        const token = await superAdminToken();
        const farm = await createFarm(token, "Farm A");
        const owner = await provisionUser(token, "owner", farm.id);
        const ownerToken = (await login(owner.username, "password123")).body.token.access;

        await adminFetch(token, `/api/v1/admin/users/${owner.id}/active`, {
            method: "PATCH",
            body: JSON.stringify({ isActive: false }),
        });

        const res = await fetch(`${BASE}/api/v1/auth/me`, {
            headers: { Authorization: `Bearer ${ownerToken}` },
        });
        expect(res.status).toBe(401);
    });

    test("cannot deactivate the Super Admin", async () => {
        const token = await superAdminToken();
        const res = await adminFetch(token, "/api/v1/admin/users/1/active", {
            method: "PATCH",
            body: JSON.stringify({ isActive: false }),
        });
        expect(res.status).toBe(404);
    });

    test("Super Admin can reset a user's password; user logs in with it", async () => {
        const token = await superAdminToken();
        const farm = await createFarm(token, "Farm A");
        const owner = await provisionUser(token, "owner", farm.id);

        const res = await adminFetch(token, `/api/v1/admin/users/${owner.id}/password`, {
            method: "PATCH",
            body: JSON.stringify({ password: "newpassword99" }),
        });
        expect(res.status).toBe(200);

        const { res: loginRes } = await login(owner.username, "newpassword99");
        expect(loginRes.status).toBe(200);
    });

    test("rejects provisioning on an unknown farm", async () => {
        const token = await superAdminToken();
        const res = await adminFetch(token, "/api/v1/admin/users", {
            method: "POST",
            body: JSON.stringify({
                username: "ghost",
                password: "password123",
                role: "owner",
                farmId: 9999,
            }),
        });
        expect(res.status).toBe(400);
    });

    test("reactivated account can log in again", async () => {
        const token = await superAdminToken();
        const farm = await createFarm(token, "Farm A");
        const owner = await provisionUser(token, "owner", farm.id);

        await adminFetch(token, `/api/v1/admin/users/${owner.id}/active`, {
            method: "PATCH",
            body: JSON.stringify({ isActive: false }),
        });
        const reactivate = await adminFetch(token, `/api/v1/admin/users/${owner.id}/active`, {
            method: "PATCH",
            body: JSON.stringify({ isActive: true }),
        });
        expect(reactivate.status).toBe(200);

        const { res } = await login(owner.username, "password123");
        expect(res.status).toBe(200);
    });

    test("a deactivated account frees its username", async () => {
        const token = await superAdminToken();
        const farm = await createFarm(token, "Farm A");
        const owner = await provisionUser(token, "owner", farm.id);

        await adminFetch(token, `/api/v1/admin/users/${owner.id}/active`, {
            method: "PATCH",
            body: JSON.stringify({ isActive: false }),
        });

        const reuse = await adminFetch(token, "/api/v1/admin/users", {
            method: "POST",
            body: JSON.stringify({
                username: owner.username,
                password: "password123",
                role: "operator",
                farmId: farm.id,
            }),
        });
        expect(reuse.status).toBe(201);

        const reactivate = await adminFetch(token, `/api/v1/admin/users/${owner.id}/active`, {
            method: "PATCH",
            body: JSON.stringify({ isActive: true }),
        });
        expect(reactivate.status).toBe(409);
    });
});

describe("Admin access boundary", () => {
    test("Owner and Operator cannot use admin endpoints", async () => {
        const token = await superAdminToken();
        const farm = await createFarm(token, "Farm A");
        const owner = await provisionUser(token, "owner", farm.id);
        const operator = await provisionUser(token, "operator", farm.id);
        const ownerToken = (await login(owner.username, "password123")).body.token.access;
        const operatorToken = (await login(operator.username, "password123")).body.token.access;

        const ownerUsers = await adminFetch(ownerToken, "/api/v1/admin/users");
        const ownerFarms = await adminFetch(ownerToken, "/api/v1/admin/farms", {
            method: "POST",
            body: JSON.stringify({ name: "Farm X" }),
        });
        const operatorUsers = await adminFetch(operatorToken, "/api/v1/admin/users");

        expect(ownerUsers.status).toBe(403);
        expect(ownerFarms.status).toBe(403);
        expect(operatorUsers.status).toBe(403);
    });
});

describe("GET /api/v1/admin/operators", () => {
    test("lists only live operators of the requested farm", async () => {
        const token = await superAdminToken();
        const farmA = await createFarm(token, "Farm A");
        const farmB = await createFarm(token, "Farm B");
        await provisionUser(token, "owner", farmA.id);
        const operatorA = await provisionUser(token, "operator", farmA.id);
        const operatorB = await provisionUser(token, "operator", farmB.id);

        const res = await adminFetch(token, `/api/v1/admin/operators?farmId=${farmA.id}`);
        const operators = (await res.json()).data;

        expect(res.status).toBe(200);
        expect(operators).toHaveLength(1);
        expect(operators[0].id).toBe(operatorA.id);
        expect(operators[0].id).not.toBe(operatorB.id);
    });

    test("rejects a request without farmId", async () => {
        const token = await superAdminToken();
        const res = await adminFetch(token, "/api/v1/admin/operators");
        expect(res.status).toBe(400);
    });
});
