import { createResource, createSignal, For, Show } from "solid-js";
import { api } from "../api";

// Section component — rendered on the coop page for every role.
export default function ChangePasswordSection() {
  const [current, setCurrent] = createSignal("");
  const [next, setNext] = createSignal("");
  const [error, setError] = createSignal("");
  const [notice, setNotice] = createSignal("");
  const [busy, setBusy] = createSignal(false);

  async function submit(e: Event) {
    e.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      await api("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword: current(), newPassword: next() }),
      });
      setNotice("Password berhasil diubah");
      setCurrent("");
      setNext("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div class="card">
      <h2>Ubah Password</h2>
      <form onSubmit={submit}>
        <label>Password saat ini</label>
        <input
          type="password"
          value={current()}
          onInput={(e) => setCurrent(e.currentTarget.value)}
          required
        />
        <label>Password baru (minimal 8 karakter)</label>
        <input
          type="password"
          value={next()}
          onInput={(e) => setNext(e.currentTarget.value)}
          required
          minlength={8}
        />
        <button type="submit" disabled={busy()} style="margin-top:12px">
          {busy() ? "Memproses..." : "Ubah Password"}
        </button>
      </form>
      {error() && <p class="error">{error()}</p>}
      {notice() && <p class="notice">{notice()}</p>}
    </div>
  );
}
