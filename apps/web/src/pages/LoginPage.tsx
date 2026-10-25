import { createSignal } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { api, storeSession } from "../api";
import type { AuthUser } from "@bk/shared";

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal("");
  const [busy, setBusy] = createSignal(false);

  async function submit(e: Event) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { token, user } = await api<{ token: string; user: AuthUser }>(
        "/api/auth/login",
        { method: "POST", body: JSON.stringify({ username: username(), password: password() }) },
      );
      storeSession(token, user);
      navigate("/");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div class="login-wrap">
      <h1>Manajemen Broiler</h1>
      <form onSubmit={submit}>
        <label>Username</label>
        <input
          type="text"
          value={username()}
          onInput={(e) => setUsername(e.currentTarget.value)}
          required
          style="width:100%"
        />
        <label>Password</label>
        <input
          type="password"
          value={password()}
          onInput={(e) => setPassword(e.currentTarget.value)}
          required
          style="width:100%"
        />
        <button type="submit" disabled={busy()} style="width:100%;margin-top:16px">
          {busy() ? "Memproses..." : "Masuk"}
        </button>
        {error() && <p class="error">{error()}</p>}
      </form>
    </div>
  );
}
