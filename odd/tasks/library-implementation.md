# Library implementation
Branch: `codex/step-04-books-api`. Runner: `npm run verify` and isolated local HTTP probes.
Delivery strategy: ask-on-risk → feature-branch-chain. Local slice boundaries only; no remote delivery is authorized.

## Specs

- S1: “bueno, hace las pruebas, cuando pasen segui con los siguientes steps por implementar”. Verify STEP-04 against real MongoDB and Better Auth before implementing the subsequent steps from `docs/steps/INDEX.md`.
- S2: “no me estas usando el conteiner de seguros o si? quiero que sea algo aparte.” Run database probes only against a separate, temporary MongoDB container published to loopback; do not use Atlas or other project containers.
- S3: “te autorizo a descargar la imagen”. The official `mongo:8.0` image is authorized for anonymous download from Docker Hub.
- S4: “bueno perfecto, te autorizo a descargar las dependecias, y continua con los steps”. Anonymous frontend dependency downloads from `registry.npmjs.org` are authorized.
- S5: “eso me dice cuando hago el npm run dev.” Root command RED: `npm error Missing script: "dev"`. Start the local demo from the repo root without touching Atlas or Seguros.
- S6: “hagamos eso que propones para el estilo y tambien lo del panel de administracion.” Editorial catalog, usable admin book management, empty-state action, session management, profile.
- S7: “hace eso que propones de los commits, cambie el nombre porque lo escribi mal al momento de crearlo, ahora se llama https://github.com/FranCrov/biblioteca-fullstack.” Keep small meaningful commits, no main/merge. Use only the corrected destination for any authorized push.

## Tasks

- T1 (S1–S3, inline): STEP-04 verification — passed, 27 automated tests and real HTTP CRUD/auth on MongoDB 8.0.
- T2 (S1–S2, inline): STEP-05 seed — `b7b00a5`. RED: missing CLI and unsafe partial write. GREEN: 28 tests, both CLI regressions rechecked independently, both roles signed in over HTTP. Risk: item 2 (test account roles and credentials). Atlas and env template acceptance remain unverified.
- T3 (S1, S4, inline): STEP-06 frontend foundation — `e35b8a3`. RED: missing App and wrong proxy Host. GREEN: two tests, typecheck, lint, build, offline installation and live Express health routing. Risk: item 5 (dependencies and dev proxy).
- T4 (S1, S4, inline): STEP-07 routing and session — `317db15`. RED: missing routes. GREEN: 11 tests and browser with real session/sign-out. Risk: item 2 (session and route guards).
- T5 (S1, inline): STEP-08 books UI — `cb77674`; 13 tests, typecheck, lint, build and real Mongo filter, pagination, detail, and deep-link HTTP probes. Risk: none.
- T6 (S1, S4, inline): STEP-09 auth forms — `a70c182`; 18 tests and real Edge validation/registration/login/logout passed. Live GitHub OAuth proof still blocked by missing designated test app. Risk: item 2 (auth forms and OAuth).
- T7 (S1, inline): STEP-10 admin tools — `a70c182`; admin book ABM, profile, sessions and role guards. Frontend verify passed 21 tests. Risk: item 2 (admin mutations and session data).
- T8 (S1, inline): STEP-11 README — `6b34b3c`; root quick start, fixture table, stop and return behavior. Risk: none.
- T9 (S1, pending): STEP-12 final remote delivery after the authorized push; local checks pass, live OAuth remains out of scope.
- T10 (S5, delegated, context backstop): Root demo launcher and quick-start documentation — `6b34b3c`. RED: missing root script. GREEN: 27 launcher tests, help path, read-only Docker fingerprint, typecheck and independent verifier. Risk 2/5: local credentials, host binding and Docker isolation.
- T11 (S6, inline): Editorial redesign and public catalog first-book action — `93c891d`; 21 frontend tests, typecheck, lint and build. Risk: none.
- T12 (S7, inline): Scoped commits `b7b00a5`, `a70c182`, `93c891d`, `6b34b3c`; docs commit follows. Push authorized to the corrected `FranCrov/biblioteca-fullstack`; no main or merge.

## Log

- L1: “bueno, hace las pruebas, cuando pasen segui con los siguientes steps por implementar”.
- L2: “no me estas usando el conteiner de seguros o si? quiero que sea algo aparte.\n\nte autorizo a descargar la imagen”.
- L3: STEP-04 passed with a browser-equivalent HTTP client, real signed sessions and CRUD against a disposable MongoDB with no shared volumes. Existing source changes were not committed.
- L4: Access to `backend/.env.example` was denied. Do not attempt to access it via another route. Keep this limitation explicit in STEP-05 delivery.
- L5: Engram mirror pending.
- L6: First verifier found a second-account role conflict could leave an admin behind and a password mismatch returned success. Fixed both by checking existing roles and credentials before any signup. Repeat run and both rejected runs preserve BSON; verifier confirmed the fixes. `npm run verify` ran 28 tests including the opt-in local integration test, plus typecheck, lint and build. No Atlas use, no other project container use, no commits or push. Removed the disposable MongoDB container; kept the downloaded image.
- L7: “bueno perfecto, te autorizo a descargar las dependecias, y continua con los steps”.
- L8: T3 installed 265 packages from the anonymous public npm registry; npm 11.5.1's Arborist optional-peer resolution crashed before install, so the clone-local frontend npm configuration enables legacy peer resolution. Independent offline CI passed. Proxy regression verified that `/api/health` rewrites to `/health`, other `/api` paths retain their path and query, and both proxy rules forward the upstream Host. A recheck confirmed the Node engine range matches every lockfile engine constraint. Frontend needs no API environment variables; no `.env.example` was added. No commit or push. Proposed delivery slices: backend API, seed, frontend tooling, session/router, catalog, login, admin and final docs/verification; keep generated lockfile with tooling and count authored lines separately.
- L9: User chose “Cadena en rama (Recommended)”. Do not publish or merge.
- L10: Local slices: tooling `e35b8a3` (227 authored lines plus generated lockfile), routing/session `317db15` (288 authored lines plus lockfile update). STEP-07 independent Edge verification covered guest redirects, user/admin reload persistence and actual button sign-out with no remaining auth cookies. Backend API and seed worktree edits remain uncommitted, separate from the frontend slices. Native receipt review is off at clone scope.
- L11: Catalog slice `cb77674` is 473 authored changed lines; controls, API requests and browser-facing regression tests stay together. Real Mongo HTTP probe exercised regex search, availability, genre, paging, sort, detail, 404 and Vite deep-link fallback. Vite reports a non-blocking JavaScript chunk-size warning.
- L12: STEP-09 RED 5 before forms; GREEN 18 plus typecheck, lint and build. Independent Edge proof passed signup and role logins, validated inputs without HTTP, kept data unchanged on invalid/duplicate requests, and cleared cookies on sign-out. Current registration sends a newly signed-in user to the catalog; the step also calls for returning to sign-in, so confirm the contract. GitHub is mocked and provider-disabled locally; live callback proof requires explicit destination/operation/session authorization and a designated test OAuth app. STEP-10–12 remain pending. No publishing, no Atlas or Seguros. Disposable test container removed.
- L13: New request approves editorial style, admin panel and small commits; GitHub repo renamed. Root startup failure reproduced; root manifest was absent. Do not interrupt an existing demo process or write into a user's database during verification.
- L14: T10 selected legacy reuse after a read-only metadata inspection of biblioteca-demo. Writer verified 21 tests and typecheck; parent re-ran launcher tests and the native assessment returned unassessable because of untracked files, so no native review started. Independent verifier confirmed S2/S5 with 30 probes and zero mutating Docker calls on rejection paths; scratch dirs were removed. Added scripts/dev.isolation.test.mjs after one mock-only failure and confirmed 27 launcher tests pass. Backend verify passed 27 tests; frontend verify passed 21 tests, typecheck, lint and build with a non-blocking chunk-size warning. BookForm schema moved into the functional frontend commit so each commit builds. Commit history: b7b00a5 backend, a70c182 frontend features, 93c891d style, 6b34b3c launcher; docs commit follows. Corrected remote is FranCrov/biblioteca-fullstack; push authorization is explicit and main/merge remain untouched.
