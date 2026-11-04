import postgres from "postgres";
import { config } from "../src/config.js";
import { bootstrap } from "../src/index.js";
import type { Server } from "../src/server.js";

export const BASE = `http://localhost:${config.port}`;
export const SA_USER = config.superAdminUsername;
export const SA_PASS = config.superAdminPassword;

const sql = postgres(config.databaseUrl, { max: 1, prepare: false });

let server: Server | undefined;
let seq = 0;

export async function startServer() {
    server = await bootstrap();
}

export function closeServer() {
    return server?.close();
}

export async function resetDb() {
    await sql`TRUNCATE coop_assignments, coops, users, farms RESTART IDENTITY CASCADE`;
    await sql`INSERT INTO users (username, password_hash, role)
            VALUES (${SA_USER}, ${await Bun.password.hash(SA_PASS)}, 'super_admin')`;
    seq = 0;
}

export async function login(username: string, password: string) {
    const res = await fetch(`${BASE}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
    });
    const body = await res.json();
    return { res, body };
}

export async function superAdminToken(): Promise<string> {
    const { body } = await login(SA_USER, SA_PASS);
    return body.token.access;
}

export async function adminFetch(
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

export async function provisionUser(
    token: string,
    role: "owner" | "operator",
    farmId: number,
): Promise<{
    id: number;
    username: string;
    role: string;
    farmId: number | null;
}> {
    seq += 1;
    const res = await adminFetch(token, "/api/v1/admin/users", {
        method: "POST",
        body: JSON.stringify({
            username: `user${seq}`,
            password: "password123",
            role,
            farmId,
        }),
    });
    if (res.status !== 201) throw new Error(`provisionUser failed: ${res.status}`);
    return (await res.json()).data;
}

export async function createFarm(
    token: string,
    name: string,
): Promise<{ id: number; name: string }> {
    const res = await adminFetch(token, "/api/v1/admin/farms", {
        method: "POST",
        body: JSON.stringify({ name }),
    });
    if (res.status !== 201) throw new Error(`createFarm failed: ${res.status}`);
    return (await res.json()).data;
}
