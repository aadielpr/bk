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

async function seededScenario() {
    const adminToken = await superAdminToken();
    const farmA = await createFarm(adminToken, "Farm A");
    const farmB = await createFarm(adminToken, "Farm B");
    const ownerA = await provisionUser(adminToken, "owner", farmA.id);
    const operatorA = await provisionUser(adminToken, "operator", farmA.id);
    const ownerB = await provisionUser(adminToken, "owner", farmB.id);

    const ownerAToken = (await login(ownerA.username, "password123")).body.token.access;
    const ownerBToken = (await login(ownerB.username, "password123")).body.token.access;

    const coop1 = await (
        await fetch(`${BASE}/api/v1/coops`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${ownerAToken}` },
            body: JSON.stringify({ name: "Kandang 1" }),
        })
    )
        .json()
        .then((response) => response.data);
    const coop2 = await (
        await fetch(`${BASE}/api/v1/coops`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${ownerAToken}` },
            body: JSON.stringify({ name: "Kandang 2" }),
        })
    )
        .json()
        .then((response) => response.data);
    await fetch(`${BASE}/api/v1/coops`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${ownerBToken}` },
        body: JSON.stringify({ name: "Kandang B1" }),
    });

    await adminFetch(ownerAToken, `/api/v1/coops/${coop1.id}/operators`, {
        method: "PUT",
        body: JSON.stringify({ operatorIds: [operatorA.id] }),
    });

    return { farmA, farmB, ownerA, operatorA, ownerB, coop1, coop2 };
}

describe("GET /api/v1/coops (role scoping)", () => {
    test("unauthenticated request is rejected", async () => {
        const res = await fetch(`${BASE}/api/v1/coops`);
        expect(res.status).toBe(401);
    });

    test("Owner sees all coops of their farm, not other farms", async () => {
        const { ownerA } = await seededScenario();
        const ownerAToken = (await login(ownerA.username, "password123")).body.token.access;
        const res = await fetch(`${BASE}/api/v1/coops`, {
            headers: { Authorization: `Bearer ${ownerAToken}` },
        });
        const coops = (await res.json()).data;
        expect(coops.map((c: { name: string }) => c.name).sort()).toEqual([
            "Kandang 1",
            "Kandang 2",
        ]);
    });

    test("Operator sees only coops assigned to them", async () => {
        const { operatorA, coop1 } = await seededScenario();
        const operatorAToken = (await login(operatorA.username, "password123")).body.token.access;
        const res = await fetch(`${BASE}/api/v1/coops`, {
            headers: { Authorization: `Bearer ${operatorAToken}` },
        });
        const coops = (await res.json()).data;
        expect(coops.map((c: { id: number }) => c.id)).toEqual([coop1.id]);
    });

    test("Super Admin sees all coops across farms", async () => {
        await seededScenario();
        const token = await superAdminToken();
        const res = await fetch(`${BASE}/api/v1/coops`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const coops = (await res.json()).data;
        expect(coops).toHaveLength(3);
    });
});

describe("Owner coop management", () => {
    test("Owner cannot manage coops of another farm", async () => {
        const { ownerB, coop1 } = await seededScenario();
        const ownerBToken = (await login(ownerB.username, "password123")).body.token.access;

        const rename = await fetch(`${BASE}/api/v1/coops/${coop1.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${ownerBToken}` },
            body: JSON.stringify({ name: "Dikuasai" }),
        });
        expect(rename.status).toBe(404);

        const assign = await adminFetch(ownerBToken, `/api/v1/coops/${coop1.id}/operators`, {
            method: "PUT",
            body: JSON.stringify({ operatorIds: [] }),
        });
        expect(assign.status).toBe(404);
    });

    test("Operator cannot create or manage coops", async () => {
        const { operatorA } = await seededScenario();
        const operatorAToken = (await login(operatorA.username, "password123")).body.token.access;

        const create = await fetch(`${BASE}/api/v1/coops`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${operatorAToken}`,
            },
            body: JSON.stringify({ name: "Kandang Baru" }),
        });
        expect(create.status).toBe(403);

        const assign = await adminFetch(operatorAToken, "/api/v1/coops/1/operators", {
            method: "PUT",
            body: JSON.stringify({ operatorIds: [] }),
        });
        expect(assign.status).toBe(403);
    });

    test("Owner cannot assign an operator from another farm to their coop", async () => {
        const adminToken = await superAdminToken();
        const { ownerA, coop1, farmB } = await seededScenario();
        const operatorB = await provisionUser(adminToken, "operator", farmB.id);

        const ownerAToken = (await login(ownerA.username, "password123")).body.token.access;
        const res = await adminFetch(ownerAToken, `/api/v1/coops/${coop1.id}/operators`, {
            method: "PUT",
            body: JSON.stringify({ operatorIds: [operatorB.id] }),
        });
        expect(res.status).toBe(400);
    });

    test("Super Admin has no farm, so cannot create a coop", async () => {
        const token = await superAdminToken();
        const res = await fetch(`${BASE}/api/v1/coops`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ name: "Kandang SA" }),
        });
        expect(res.status).toBe(403);
    });

    test("created coop carries its farm name", async () => {
        const { ownerA, farmA } = await seededScenario();
        const ownerAToken = (await login(ownerA.username, "password123")).body.token.access;

        const res = await adminFetch(ownerAToken, "/api/v1/coops", {
            method: "POST",
            body: JSON.stringify({ name: "Kandang 3" }),
        });
        const body = await res.json();

        expect(res.status).toBe(201);
        expect(body.data.farmId).toBe(farmA.id);
        expect(body.data.farmName).toBe("Farm A");
        expect(body.data.name).toBe("Kandang 3");
        expect(body.data.operatorIds).toEqual([]);
    });

    test("operator assignment returns the coop with its operators", async () => {
        const { ownerA, operatorA, coop1 } = await seededScenario();
        const ownerAToken = (await login(ownerA.username, "password123")).body.token.access;

        const res = await adminFetch(ownerAToken, `/api/v1/coops/${coop1.id}/operators`, {
            method: "PUT",
            body: JSON.stringify({ operatorIds: [operatorA.id] }),
        });
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.data).toEqual({
            id: coop1.id,
            farmId: coop1.farmId,
            farmName: "Farm A",
            name: coop1.name,
            operatorIds: [operatorA.id],
        });
    });

    test("unassigning an operator removes their coop access", async () => {
        const { ownerA, operatorA, coop1 } = await seededScenario();
        const ownerAToken = (await login(ownerA.username, "password123")).body.token.access;
        const operatorAToken = (await login(operatorA.username, "password123")).body.token.access;

        const assigned = await fetch(`${BASE}/api/v1/coops`, {
            headers: { Authorization: `Bearer ${operatorAToken}` },
        }).then((response) => response.json());
        expect(assigned.data.map((coop: { id: number }) => coop.id)).toEqual([coop1.id]);

        await adminFetch(ownerAToken, `/api/v1/coops/${coop1.id}/operators`, {
            method: "PUT",
            body: JSON.stringify({ operatorIds: [] }),
        });

        const res = await fetch(`${BASE}/api/v1/coops`, {
            headers: { Authorization: `Bearer ${operatorAToken}` },
        });
        const coops = (await res.json()).data;
        expect(coops).toHaveLength(0);
    });

    test("a deactivated operator loses access to their assigned coops", async () => {
        const { operatorA } = await seededScenario();
        const operatorAToken = (await login(operatorA.username, "password123")).body.token.access;
        const adminToken = await superAdminToken();

        await adminFetch(adminToken, `/api/v1/admin/users/${operatorA.id}/active`, {
            method: "PATCH",
            body: JSON.stringify({ isActive: false }),
        });

        const res = await fetch(`${BASE}/api/v1/coops`, {
            headers: { Authorization: `Bearer ${operatorAToken}` },
        });
        expect(res.status).toBe(401);
    });

    test("a deactivated operator cannot be assigned to a coop", async () => {
        const adminToken = await superAdminToken();
        const { ownerA, operatorA, coop1 } = await seededScenario();
        const ownerAToken = (await login(ownerA.username, "password123")).body.token.access;

        await adminFetch(adminToken, `/api/v1/admin/users/${operatorA.id}/active`, {
            method: "PATCH",
            body: JSON.stringify({ isActive: false }),
        });

        const res = await adminFetch(ownerAToken, `/api/v1/coops/${coop1.id}/operators`, {
            method: "PUT",
            body: JSON.stringify({ operatorIds: [operatorA.id] }),
        });
        expect(res.status).toBe(400);
    });
});
