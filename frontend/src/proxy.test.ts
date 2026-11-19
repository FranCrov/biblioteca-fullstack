// @vitest-environment node
import { createServer as createHttpServer } from "node:http";
import type { AddressInfo } from "node:net";
import { createServer, loadConfigFromFile } from "vite";
import { expect, test } from "vitest";

test("rewrites only the health path and forwards the upstream Host", async () => {
  const loaded = await loadConfigFromFile({
    command: "serve",
    mode: "development",
  });
  const rules = loaded?.config.server?.proxy;
  if (!rules) throw new Error("Missing Vite proxy rules");

  const upstream = createHttpServer((req, res) => {
    res.end(JSON.stringify({ path: req.url, host: req.headers.host }));
  });
  await new Promise<void>((resolve, reject) => {
    upstream.once("error", reject);
    upstream.listen(0, "127.0.0.1", resolve);
  });

  let dev: Awaited<ReturnType<typeof createServer>> | undefined;
  let listener: ReturnType<typeof createHttpServer> | undefined;
  try {
    const host = `127.0.0.1:${(upstream.address() as AddressInfo).port}`;
    const target = `http://${host}`;
    dev = await createServer({
      configFile: false,
      optimizeDeps: { noDiscovery: true, include: [] },
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
        proxy: Object.fromEntries(
          Object.entries(rules).map(([key, rule]) => [
            key,
            typeof rule === "string" ? target : { ...rule, target },
          ]),
        ),
      },
    });
    const server = createHttpServer(dev.middlewares);
    listener = server;
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    const { port } = server.address() as AddressInfo;
    for (const [path, expected] of [
      ["/api/health", "/health"],
      ["/api/health?probe=a%2Bb", "/health?probe=a%2Bb"],
      ["/api/healthcheck", "/api/healthcheck"],
      ["/api/health/extra", "/api/health/extra"],
      ["/api/v1/books?q=a%2Bb", "/api/v1/books?q=a%2Bb"],
    ]) {
      const response = await fetch(`http://127.0.0.1:${port}${path}`, {
        signal: AbortSignal.timeout(2000),
      });
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ path: expected, host });
    }
  } finally {
    listener?.close();
    listener?.closeAllConnections();
    try {
      await dev?.close();
    } finally {
      await new Promise<void>((resolve) => {
        upstream.close(() => resolve());
        upstream.closeAllConnections();
      });
    }
  }
});
