# Biblioteca

Biblioteca is a searchable book catalog with a React, Vite, and TypeScript frontend and an Express, TypeScript, and MongoDB backend. Visitors can browse and open book details. Better Auth handles email/password and GitHub sign-in; only administrators can add, edit, or delete books.

The `Book` entity stores a title, author, genre, and ISBN (strings), publication year (number), availability (boolean), and date added (date).

- [GitHub repository](https://github.com/FranCrov/biblioteca-fullstack)
- [Frontend on Render](https://biblioteca-fullstack-1.onrender.com)
- [Backend on Render](https://biblioteca-fullstack-z28i.onrender.com) ([health check](https://biblioteca-fullstack-z28i.onrender.com/health))
- [Academic roadmap and acceptance checks](odd/tasks/academic-finish.md)

## Run the local demo on Windows

From the repository root on Windows, run **`npm run dev`**, then open **<http://127.0.0.1:5173>** when the launcher prints the URL. One terminal runs the seed, API and Vite; there is no root install or `.env` setup.

### First run

You need Node.js 22.13+ on the 22.x line or Node.js 24+, npm, and running Docker Desktop with Linux containers. The Docker CLI must be on `PATH`, and the Desktop Linux engine must already have the `mongo:8.0` image. The launcher never pulls images or installs packages.

Install the locked app dependencies once, from the root (use `npm.cmd` if PowerShell blocks `npm.ps1`):

```powershell
npm.cmd --prefix backend ci
npm.cmd --prefix frontend ci
npm.cmd run dev
```

On later runs, only the last command is needed. To see usage without starting anything, run `npm.cmd run dev -- --help`.

### Test accounts

| Role | Email | Public demo password |
| --- | --- | --- |
| Administrator | `admin@biblioteca.test` | `BibliotecaDemo-Admin!` |
| Reader | `user@biblioteca.test` | `BibliotecaDemo-User!` |

These are **public, local-only fixtures**, not production credentials. For a deployed review, provide dedicated test accounts privately. Do not forward or share the local ports. The seed checks both existing accounts before creating a missing one; a password or role conflict stops startup rather than overwriting an account. It does not seed books.

### Stop and return

Press **Ctrl+C** in the launcher terminal to stop its API and UI. MongoDB is left running. The next launch generates a new signing secret, so sign in again if needed.

| Database setup | What happens to data |
| --- | --- |
| Existing `biblioteca-demo` | Reused only if it matches the running, auto-removing `mongo:8.0` demo with both data directories on tmpfs. **Stopping that container or restarting Docker loses its data.** The launcher does not stop or migrate it. |
| No existing demo | Creates `biblioteca-demo-local` and a labeled local volume, `biblioteca-demo-data`. Books and accounts survive an app or container restart as long as the volume is retained. Returning runs reuse the checked resources. |

The demo always uses database `biblioteca_demo` on `127.0.0.1:27028`, the API on `127.0.0.1:3000`, and Vite on `127.0.0.1:5173`. It uses the local Desktop Linux named pipe, not Atlas, another Docker context, GitHub OAuth or hosted auth services.

**If startup refuses:** check that Docker Desktop is running, the image is cached, and `DOCKER_HOST` is unset. An occupied app port may mean the demo is already open. Stop only a process you recognize. An unexpected container, mount, volume attachment or port mapping is a conflict, not a request to delete data; the launcher will not repair or remove it.

## Run the services separately

1. Use the Node.js version listed above and start a local MongoDB instance. Install dependencies with `npm ci` in `backend/` and `frontend/`.
2. Copy `backend/.env.example` to `backend/.env`. Set `MONGODB_URI` to your database (for example, `mongodb://127.0.0.1:27017/biblioteca`) and set `BETTER_AUTH_SECRET` to a private, random value. Generate one with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Keep `PORT=3000` for the Vite proxy and set `BETTER_AUTH_URL=http://localhost:5173`.
3. To create the two review accounts in this database, set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `USER_EMAIL`, and `USER_PASSWORD` in `backend/.env`, then run `npm run seed` from `backend/`. This step is optional if the accounts already exist or you only need to browse.
4. Run `npm run dev` from `backend/`, and `npm run dev` from `frontend/` in a second terminal. Open <http://localhost:5173>. The frontend needs no environment variables. To test OAuth locally, use separate development credentials and register `http://localhost:5173/api/auth/callback/github` for GitHub or `http://localhost:5173/api/auth/callback/google` for Google.

Never commit `backend/.env`, database credentials, signing secrets, or OAuth secrets. To run the test suites, use `npm --prefix backend test` and `npm --prefix frontend test` from the repository root.

## API endpoints

| Method | Path | Required role | Result |
| --- | --- | --- | --- |
| `GET` | `/api/v1/books` | Public | `200`: paginated catalog with search and filters |
| `GET` | `/api/v1/books/:id` | Public | `200`: book details |
| `POST` | `/api/v1/books` | `admin` | `201`: created book |
| `PUT` | `/api/v1/books/:id` | `admin` | `200`: updated book |
| `DELETE` | `/api/v1/books/:id` | `admin` | `204`: deleted book |
| `GET` | `/health` | Public | `200`: backend health check, on the backend origin |

Invalid input returns `400`. A valid ID for a missing book returns `404`. Write requests return `401` without a session and `403` with a non-admin session. Better Auth handles registration, sign-in, sign-out, and sessions under `/api/auth`; new accounts receive the `user` role.

## Render deployment

| Service | Render type | Root directory | Build command | Start or publish |
| --- | --- | --- | --- | --- |
| Backend | Web Service | `backend` | `npm ci --include=dev && npm run build` | `npm start`; health check: `/health` |
| Frontend | Static Site | `frontend` | `npm ci --include=dev && npm run build` | Publish `dist` |

Configure two **Rewrite** rules on the Static Site, in this order:

| Source | Destination |
| --- | --- |
| `/api/*` | `https://biblioteca-fullstack-z28i.onrender.com/api/*` |
| `/*` | `/index.html` |

The first rule forwards API and auth requests without changing the browser origin. The second lets React Router handle direct visits and reloads on routes such as `/login` and `/admin`.

Set `NODE_ENV=production`, `MONGODB_URI`, and `BETTER_AUTH_SECRET` on the backend. Set `BETTER_AUTH_URL=https://biblioteca-fullstack-1.onrender.com` to match the **frontend** origin.

### Hosted OAuth

Set each provider’s credential pair on the backend and register its production callback URL:

| Provider | Backend variables | Production callback URL |
| --- | --- | --- |
| GitHub | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | `https://biblioteca-fullstack-1.onrender.com/api/auth/callback/github` |
| Google (optional) | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | `https://biblioteca-fullstack-1.onrender.com/api/auth/callback/google` |

A provider is enabled only when both credentials are set. Email and password sign-in remains available without OAuth.

### Production smoke test

1. Open `/login` directly on the frontend and reload it. Request `/api/v1/books` on the same origin; it should return JSON, not the SPA HTML.
2. Sign in with each review account. After reloading, the `user` account must stay signed in but be redirected away from `/admin`, while the `admin` account must retain access. Sign out between checks.
3. Sign in with GitHub. After authorizing the OAuth App, confirm that the browser returns to Biblioteca signed in and that the session survives a reload.
