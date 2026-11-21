# Biblioteca: run the local demo

From the repository root on Windows, run **`npm run dev`**, then open **<http://127.0.0.1:5173>** when the launcher prints the URL. One terminal runs the seed, API and Vite; there is no root install or `.env` setup.

## First run

You need Node.js 22.13+ on the 22.x line or Node.js 24+, npm, and running Docker Desktop with Linux containers. The Docker CLI must be on `PATH`, and the Desktop Linux engine must already have the `mongo:8.0` image. The launcher never pulls images or installs packages.

Install the locked app dependencies once, from the root (use `npm.cmd` if PowerShell blocks `npm.ps1`):

```powershell
npm.cmd --prefix backend ci
npm.cmd --prefix frontend ci
npm.cmd run dev
```

On later runs, only the last command is needed. To see usage without starting anything, run `npm.cmd run dev -- --help`.

## Sign in

| Role | Email | Public demo password |
| --- | --- | --- |
| Administrator | `admin@biblioteca.test` | `BibliotecaDemo-Admin!` |
| Reader | `user@biblioteca.test` | `BibliotecaDemo-User!` |

These are **public, local-only fixtures**, not production credentials. Do not forward or share the ports. The seed checks both existing accounts before creating a missing one; a password or role conflict stops startup rather than overwriting an account. It does not seed books.

## Hosted OAuth

The API enables GitHub and Google sign-in when their credential pairs are set. Configure these variables on the API service:

| Variable | Purpose |
| --- | --- |
| `BETTER_AUTH_URL` | Public frontend origin that proxies `/api/*` to the API |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub OAuth app credentials |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth client credentials |

Register these callback URLs in the corresponding providers:

- `https://biblioteca-fullstack-1.onrender.com/api/auth/callback/github`
- `https://biblioteca-fullstack-1.onrender.com/api/auth/callback/google`

For local OAuth testing, use `http://localhost:5173/api/auth/callback/github` and `http://localhost:5173/api/auth/callback/google`. A provider with only one credential configured is omitted instead of receiving a broken sign-in attempt. Email and password sign-in remains available in every environment.

## Stop and return

Press **Ctrl+C** in the launcher terminal to stop its API and UI. MongoDB is left running. The next launch generates a new signing secret, so sign in again if needed.

| Database setup | What happens to data |
| --- | --- |
| Existing `biblioteca-demo` | Reused only if it matches the running, auto-removing `mongo:8.0` demo with both data directories on tmpfs. **Stopping that container or restarting Docker loses its data.** The launcher does not stop or migrate it. |
| No existing demo | Creates `biblioteca-demo-local` and a labeled local volume, `biblioteca-demo-data`. Books and accounts survive an app or container restart as long as the volume is retained. Returning runs reuse the checked resources. |

The demo always uses database `biblioteca_demo` on `127.0.0.1:27028`, the API on `127.0.0.1:3000`, and Vite on `127.0.0.1:5173`. It uses the local Desktop Linux named pipe, not Atlas, another Docker context, GitHub OAuth or hosted auth services.

**If startup refuses:** check that Docker Desktop is running, the image is cached, and `DOCKER_HOST` is unset. An occupied app port may mean the demo is already open. Stop only a process you recognize. An unexpected container, mount, volume attachment or port mapping is a conflict, not a request to delete data; the launcher will not repair or remove it.
