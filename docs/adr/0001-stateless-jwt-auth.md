# Stateless JWT authentication

Sessions are stateless JWTs carried in the `Authorization: Bearer` header, not server-side cookie sessions. A single access token with a short expiry (~12 hours) is issued at login; there are no refresh tokens and no server-side session store, so Redis is not part of the auth path.

Why stateless: the API must serve both the web SPA and a future Expo mobile client, and avoiding a session store keeps the server simple. The accepted trade-off is that revocation is not instant — deactivating a user blocks their next login, but an already-issued token remains valid until it expires (at most ~12 hours). For a private farm-recording app this staleness window is acceptable; revisit this ADR if instant revocation becomes a requirement.

Considered alternatives: httpOnly cookie + Postgres session table (rejected: refresh/revocation state re-introduces server state for little benefit), long-lived JWT (rejected: widens the revocation window).
