# Biblioteca academic closeout

Individual submission. `Book` is the only domain model. This is the shared roadmap; the root README remains the submission guide.
Branch: `feat/academic-finish`. First delivery: roadmap plus STEP-13 (forecast: under 400 authored changed lines). Runner: Vitest via npm. Later steps are separate reviewable units.

## Specs

1. **S1 — Scope and budget.** “Soy yo solo como integrante, asi que no hace falta añadir otro” and “pero acordate que esto tiene que ser gratis, no quiero poner ni un peso”. Keep the professor-approved individual scope, the current React/Vite and Express/TypeScript applications, MongoDB, and Render. Use only $0 tiers; no paid trial, paid fallback, or automatic upgrade. Recheck quotas and account tiers before enabling each hosted integration.
2. **S2 — Baseline and final proof (`STEP-12`, `STEP-21`).** The public catalog, admin panel, and API already share `Book` data. In Chrome on the delivered revision, verify public list/detail and sample data, registration (`user` by default), visible login errors, private redirects, logout to home, and the admin create/edit/delete flow reflected in the public catalog. API evidence: `201`, `400`, `401`, `403`, `404`. Confirm cloud MongoDB, frontend/backend URLs, and deployment revision. Before delivery, document local setup and all env placeholders, check history for secrets (including outside `.env` files), and verify descriptive, attributable PRs to `main`. Prepare isolated test accounts and share credentials privately in the submission email, at least one week before the exam. Rehearse form → state → route → middleware → controller → MongoDB and demonstrate each optional actually completed.
3. **S3 — Confirmation modal (`STEP-13`).** “me gusta eso de un modal para confirmar la baja”. Show the selected title, permanent-delete warning, Cancel, and Delete permanently. Cancel or Escape before submission sends no request. Confirm invokes the existing deletion once; show progress, prevent duplicate submission, close on success, and show an inline error on failure while preserving a retry/cancel path. Preserve create/update and the backend contract. Verify with `npm.cmd --prefix frontend test -- --run src/pages/admin.test.tsx` and `npm.cmd --prefix frontend run verify`; in Chrome, also check initial focus, keyboard cancellation, and focus after close.
4. **S4 — Book lifecycle (`STEP-14`).** Define archive separately from `available`. A logical baja preserves the record, hides it in public list/detail and agent results, and remains visible in the admin panel. Physical deletion removes the record; keep it in the admin panel with explicit confirmation. Test active versus archived reads, authorized writes, and both persistent outcomes. No production data cleanup is part of the implementation.
5. **S5 — Google (`STEP-15`, +1).** The provider exists; confirm the registered production callback on the frontend origin, sign in, reload, and show the default `user` role. Do not count this until the deployed flow succeeds.
6. **S6 — Pagination (`STEP-16`, +1).** The public catalog and API already paginate. Add navigation to the admin list instead of a fixed first 50. Demonstrate distinct pages through `?page=&limit=`, correct totals, and reset on filter changes where filters exist; preserve the public filters and sorting.
7. **S7 — Swagger (`STEP-17`, +1).** Serve a validated `swagger: "2.0"` document and UI from the backend at `/api/docs`. Inventory all enabled API endpoints, including authentication, and document shapes, statuses, roles, and actual Better Auth cookie behavior (do not represent it as bearer auth). Changes to API routes after this step update the spec in the same unit.
8. **S8 — Sessions and permissions (`STEP-18`, +1).** Replace the read-only session overview with a working admin view: list users, change roles, inspect active sessions, and revoke a session. Verify the expected Better Auth result/error shapes, forbidden access for `user`, effective role changes and revocation, and protection against removing the last admin.
9. **S9 — External book covers (`STEP-19`, +1).** Supabase Storage Free is the candidate for objects only; MongoDB stores `coverUrl`, not the image. An admin uploads a validated image through the backend. Show the result in the card and detail, keeping the fallback for existing books. Define object cleanup on replacement and physical deletion; keep the cover on archive. Demonstrate a real upload on the final deployment and check quotas and inactive-project pausing.
10. **S10 — Catalog agent (`STEP-20`, +1).** “Es decir, poder usar la api.” and “agamoslo con groq free y fue.” Use Vercel AI SDK (`ToolLoopAgent` in Express, `useChat` in React), with Groq Free and `openai/gpt-oss-120b` as the first model to verify. Keep provider credentials in the backend and configure the model without changing tools. The agent uses typed, allowlisted tools against the real Books API to find, create, and give a book a baja. Require a separate UI confirmation for writes, binding the exact action and input to the requesting admin and rechecking the current role before executing once. The model never receives database credentials or a generic HTTP tool. Default scope: archive from chat; physical deletion stays out unless explicitly requested. If quota is exhausted, show a clear chat error while the catalog and panel remain usable; never fall back to a billable model. Demonstrate Spanish requests, missing required fields, an ambiguous title, successful create/archive, cancel, and blocked writes by a `user`.

Provider references: [Groq Free limits](https://console.groq.com/docs/rate-limits), [Groq tool use](https://console.groq.com/docs/tool-use), [AI SDK with Express](https://github.com/vercel/ai/tree/main/examples/express), and [Supabase pricing](https://supabase.com/pricing).

## Tasks

- [x] T1 · S1–S10 · inline · Write the shared roadmap and link it from the README and local runbook.
- [ ] T2 · S3 · inline · STEP-13 confirmation modal; Risk: item 1 (gates existing permanent deletion), item 4 (duplicate submission).
- [ ] T3 · S2 · pending · STEP-12 collect authenticated deployment evidence; requires authorized access for remote checks. No blocker for local work.
- [ ] T4 · S4 · planned · STEP-14 archive and permanent delete rules.
- [ ] T5 · S5 · planned · STEP-15 Google production verification.
- [ ] T6 · S6 · planned · STEP-16 pagination.
- [ ] T7 · S7 · planned · STEP-17 Swagger 2.0.
- [ ] T8 · S8 · planned · STEP-18 session and role administration.
- [ ] T9 · S9 · planned · STEP-19 external covers.
- [ ] T10 · S10 · planned · STEP-20 Groq Free agent; depends on STEP-14 and a free provider key.
- [ ] T11 · S2 · planned · STEP-21 final delivery and oral defense.

## Log

- L1 — “bueno listo, agamoslo con groq free y fue. arma la documentacion en el proyecto con todo y comenzemos con el desarrollo”
- L2 — 2026-11-27: Baseline `717bfae`. First development slice is STEP-13. The previous local-only runbook excluded Groq and chat; this roadmap explicitly brings them into STEP-20. No push, cloud changes, or activation of billing is authorized by this local work.
