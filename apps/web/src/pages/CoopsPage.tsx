import { createResource, createSignal, For, Show } from "solid-js";
import { api } from "../api";
import type { Coop, AuthUser } from "@bk/shared";
import ChangePasswordSection from "./ChangePasswordSection";

interface Operator {
  id: number;
  username: string;
}

// Coop list — the landing view for every role. Owners get manage controls
// (create, rename, assign Operators), Operators see their assigned coops
// read-only, Super Admin sees everything.
export default function CoopsPage(props: { user: AuthUser }) {
  const [coops, { refetch }] = createResource(() => api<Coop[]>("/api/coops"));
  const [operators] = createResource(
    () => props.user.role === "owner",
    (isOwner) => (isOwner ? api<Operator[]>("/api/operators") : Promise.resolve([])),
  );
  const [newName, setNewName] = createSignal("");
  const [openCoop, setOpenCoop] = createSignal<number | null>(null);
  const [error, setError] = createSignal("");

  const isOwner = () => props.user.role === "owner";

  async function createCoop(e: Event) {
    e.preventDefault();
    setError("");
    try {
      await api("/api/coops", { method: "POST", body: JSON.stringify({ name: newName() }) });
      setNewName("");
      refetch();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function renameCoop(id: number, name: string) {
    setError("");
    try {
      await api(`/api/coops/${id}`, { method: "PATCH", body: JSON.stringify({ name }) });
      refetch();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function saveAssignment(coop: Coop, operatorIds: number[]) {
    setError("");
    try {
      await api(`/api/coops/${coop.id}/operators`, {
        method: "PUT",
        body: JSON.stringify({ operatorIds }),
      });
      refetch();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <>
      <h1>Kandang</h1>
      <Show when={props.user.farmName}>
        <p class="muted">Farm: {props.user.farmName}</p>
      </Show>

      <Show when={isOwner()}>
        <div class="card">
          <form class="row" onSubmit={createCoop}>
            <input
              type="text"
              placeholder="Nama kandang baru"
              value={newName()}
              onInput={(e) => setNewName(e.currentTarget.value)}
              required
            />
            <button type="submit">Tambah Kandang</button>
          </form>
        </div>
      </Show>

      <div class="card">
        <table>
          <thead>
            <tr>
              <th>Nama Kandang</th>
              <th>Operator</th>
              <th style="width:220px"></th>
            </tr>
          </thead>
          <tbody>
            <For each={coops() ?? []}>
              {(coop) => (
                <tr>
                  <td>
                    <input
                      value={coop.name}
                      disabled={!isOwner()}
                      onBlur={(e) =>
                        e.currentTarget.value !== coop.name &&
                        renameCoop(coop.id, e.currentTarget.value)
                      }
                      style={isOwner() ? "max-width:220px" : "border:none;background:transparent"}
                    />
                  </td>
                  <td class="muted">
                    {coop.operatorIds
                      .map((id) => operators()?.find((o) => o.id === id)?.username)
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </td>
                  <td>
                    <Show when={isOwner()}>
                      <button
                        class="secondary"
                        onClick={() => setOpenCoop(openCoop() === coop.id ? null : coop.id)}
                      >
                        {openCoop() === coop.id ? "Tutup" : "Atur Operator"}
                      </button>
                    </Show>
                  </td>
                </tr>
              )}
              {/*
              Assignment panel is rendered below the table for the open coop.
              */}
            </For>
          </tbody>
        </table>
        <Show when={coops()?.length === 0}>
          <p class="muted">Belum ada kandang.</p>
        </Show>

        <Show when={isOwner() && openCoop() !== null}>
          <AssignmentPanel
            coop={coops()!.find((c) => c.id === openCoop())!}
            operators={operators() ?? []}
            onSave={saveAssignment}
          />
        </Show>
      </div>
      {error() && <p class="error">{error()}</p>}

      <ChangePasswordSection />
    </>
  );
}

function AssignmentPanel(props: {
  coop: Coop;
  operators: Operator[];
  onSave: (coop: Coop, operatorIds: number[]) => void;
}) {
  const [selected, setSelected] = createSignal<number[]>(props.coop.operatorIds);

  function toggle(id: number) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  return (
    <div style="margin-top:16px;padding-top:16px;border-top:1px solid #eceff2">
      <h2>Operator untuk {props.coop.name}</h2>
      <Show
        when={props.operators.length > 0}
        fallback={
          <p class="muted">
            Belum ada Operator di farm ini. Minta Super Admin membuat akun Operator.
          </p>
        }
      >
        <For each={props.operators}>
          {(op) => (
            <div class="row" style="margin:6px 0">
              <input
                type="checkbox"
                checked={selected().includes(op.id)}
                onChange={() => toggle(op.id)}
              />
              <span>{op.username}</span>
            </div>
          )}
        </For>
        <button style="margin-top:10px" onClick={() => props.onSave(props.coop, selected())}>
          Simpan Penugasan
        </button>
      </Show>
    </div>
  );
}
