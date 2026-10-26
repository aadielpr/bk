import { type Component, Show } from "solid-js";
import { A, Navigate, Route, Router, RouteSectionProps, useLocation } from "@solidjs/router";
import { Role } from "@bk/shared";
import { clearSession, getStoredUser } from "./api";
import type { AuthUser } from "@bk/shared";
import LoginPage from "./pages/LoginPage";
import CoopsPage from "./pages/CoopsPage";
import UsersPage from "./pages/UsersPage";
import FarmsPage from "./pages/FarmsPage";
import "./styles.css";

const App: Component<RouteSectionProps> = (props) => props.children;

const Layout: Component<RouteSectionProps> = (props) => {
    const user = getStoredUser();
    const location = useLocation();

    function logout() {
        clearSession();
        window.location.href = "/login";
    }

    return (
        <Show when={user} fallback={<Navigate href="/login" />}>
            <header class="bar">
                <strong>Manajemen Broiler</strong>
                <span class="muted" style="color:#9fb0c3">
                    {user!.username} ({user!.role}
                    <Show when={user!.farmName}> · {user!.farmName}</Show>)
                </span>
                <div class="spacer" />
                <Show when={user!.role === Role.SUPER_ADMIN}>
                    <A href="/pengguna" class={location.pathname === "/pengguna" ? "active" : ""}>
                        Pengguna
                    </A>
                    <A href="/farm" class={location.pathname === "/farm" ? "active" : ""}>
                        Farm
                    </A>
                </Show>
                <A href="/" class={location.pathname === "/" ? "active" : ""}>
                    Kandang
                </A>
                <button class="secondary" onClick={logout}>
                    Keluar
                </button>
            </header>
            <main>{props.children}</main>
        </Show>
    );
};

const RoleRoutes: Component = () => {
    const user = getStoredUser();
    return (
        <Show when={user} fallback={<Navigate href="/login" />}>
            <Route path="/" component={() => <CoopsPage user={user!} />} />
            <Show when={user!.role === Role.SUPER_ADMIN}>
                <Route path="/pengguna" component={UsersPage} />
                <Route path="/farm" component={FarmsPage} />
            </Show>
        </Show>
    );
};

export default function Root() {
    return (
        <Router root={App}>
            <Route path="/login" component={LoginPage} />
            <Route component={Layout}>
                <RoleRoutes />
            </Route>
        </Router>
    );
}
