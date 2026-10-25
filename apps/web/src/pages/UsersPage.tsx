import { createResource, createSignal, For, Show } from "solid-js";
import { api } from "../api";
import type { AuthUser, Farm } from "@bk/shared";

// Super Admin: list users, provision new ones, deactivate/reactivate, reset passwords.
export default function UsersPage() {
  const [users, { refetch }] = createResource(() => api<AuthUser[]>("/api/admin/users"));
  const [farms] = createResource(() => api<Farm[]>("/api/admin/farms"));

  const [username, setUsername] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [role, setRole] = createSignal<"owner" | "operator">("owner");
  const [farmId, setFarmId] = createSignal<number | null>(null);
  const [error, setError] = createSignal("");
  const [notice, setNotice] = createSignal("");
  const [busy, setBusy] = createSignal(false);

  const farmName = (id: number | null) =>
    farms()?.find((f) => f.id === id)?.name ?? "—";

  async function provision(e: Event) {
    e.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      await api("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          username: username(),
          password: password(),
          role: role(),
          farmId: farmId(),
        }),
      });
      setNotice(`Akun ${username()} berhasil dibuat`);
      setUsername("");
      setPassword("");
      refetch();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(user: AuthUser) {
    setError("");
    setNotice("");
    try {
      await api(`/api/admin/users/${user.id}/active`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      refetch();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function resetPassword(user: AuthUser) {
    const newPassword = prompt(`Password baru untuk ${user.username}:`);
    if (!newPassword) return;
    setError("");
    setNotice("");
    try {
      await api(`/api/admin/users/${user.id}/password`, {
        method: "PATCH",
        body: JSON.stringify({ password: newPassword }),
      });
      setNotice(`Password ${user.username} direset`);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <>
      <h1>Pengguna</h1>

      <div class="card">
        <h2>Buat Akun Baru</h2>
        <form onSubmit={provision}>
          <label>Username</label>
          <input
            type="text"
            value={username()}
            onInput={(e) => setUsername(e.currentTarget.value)}
            required
            minlength={3}
          />
          <label>Password awal (minimal 8 karakter)</label>
          <input
            type="text"
            value={password()}
            onInput={(e) => setPassword(e.currentTarget.value)}
            required
            minlength={8}
          />
          <label>Role</label>
          <select
            value={role()}
            onChange={(e) => setRole(e.currentTarget.value as "owner" | "operator")}
          >
            <option value="owner">Owner</option>
            <option value="operator">Operator</option>
          </select>
          <label>Farm</label>
          <select
            required
            value={farmId() ?? ""}
            onChange={(e) => setFarmId(Number(e.currentTarget.value))}
          >
            <option value="" disabled>Pilih farm</option>
            <For each={farms() ?? []}>{(f) => <option value={f.id}>{f.name}</option>}</For>
          </select>
          <div>
            <button type="submit" disabled={busy() || !farmId()} style="margin-top:12px">
              {busy() ? "Memproses..." : "Buat Akun"}
            </button>
          </div>
        </form>
        {error() && <p class="error">{error()}</p>}
        {notice() && <p class="notice">{notice()}</p>}
      </div>

      <div class="card">
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Farm</th>
              <th>Status</th>
              <th style="width:260px"></th>
            </tr>
          </thead>
          <tbody>
            <For each={users() ?? []}>
              {(user) => (
                <tr>
                  <td>{user.username}</td>
                  <td>{user.role}</td>
                  <td>{farmName(user.farmId)}</td>
                  <td>
                    <Show when={user.role !== "super_admin"} fallback={<span class="muted">—</span>}>
                      {user.isActive ? "Aktif" : "Nonaktif"}
                    </Show>
                  </td>
                  <td>
                    <Show when={user.role !== "super_admin"}>
                      <button class="secondary" onClick={() => resetPassword(user)}>
                        Reset Password
                      </button>{" "}
                      <button
                        class={user.isActive ? "danger" : "secondary"}
                        onClick={() => toggleActive(user)}
                      >
                        {user.isActive ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                    </Show>
                  </td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </div>
    </>
  );
}
