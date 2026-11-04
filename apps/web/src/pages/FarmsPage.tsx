import { createResource, createSignal, For, Show } from "solid-js";
import { api } from "../api";
import type { Farm } from "@bk/shared";

export default function FarmsPage() {
    const [farms, { refetch }] = createResource(() => api<Farm[]>("/api/v1/admin/farms"));
    const [name, setName] = createSignal("");
    const [error, setError] = createSignal("");

    async function createFarm(e: Event) {
        e.preventDefault();
        setError("");
        try {
            await api("/api/v1/admin/farms", {
                method: "POST",
                body: JSON.stringify({ name: name() }),
            });
            setName("");
            refetch();
        } catch (err) {
            setError((err as Error).message);
        }
    }

    return (
        <>
            <h1>Farm</h1>
            <div class="card">
                <form class="row" onSubmit={createFarm}>
                    <input
                        type="text"
                        placeholder="Nama farm baru"
                        value={name()}
                        onInput={(e) => setName(e.currentTarget.value)}
                        required
                    />
                    <button type="submit">Tambah Farm</button>
                </form>
                {error() && <p class="error">{error()}</p>}
            </div>

            <div class="card">
                <table>
                    <thead>
                        <tr>
                            <th>Nama Farm</th>
                        </tr>
                    </thead>
                    <tbody>
                        <For each={farms() ?? []}>
                            {(farm) => (
                                <tr>
                                    <td>{farm.name}</td>
                                </tr>
                            )}
                        </For>
                        <Show when={farms()?.length === 0}>
                            <tr>
                                <td class="muted">Belum ada farm.</td>
                            </tr>
                        </Show>
                    </tbody>
                </table>
            </div>
        </>
    );
}
