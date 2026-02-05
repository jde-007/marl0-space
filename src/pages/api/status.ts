import type { APIRoute } from 'astro';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const SERVICES_PATH = resolve(process.cwd(), '../services.json');
const SELF_PORT = 8888;

async function checkPort(port: number, timeout = 2000): Promise<{ up: boolean; status: number | null }> {
  if (port === SELF_PORT) return { up: true, status: 200 };
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(`http://localhost:${port}/`, { signal: controller.signal, redirect: 'follow' });
    clearTimeout(timer);
    return { up: true, status: res.status };
  } catch {
    return { up: false, status: null };
  }
}

export const GET: APIRoute = async () => {
  try {
    const raw = await readFile(SERVICES_PATH, 'utf-8');
    const config = JSON.parse(raw);

    const services = [];
    for (const svc of config.services) {
      const apps = [];
      for (const app of svc.apps) {
        const health = await checkPort(app.port);
        apps.push({ ...app, ...health });
      }
      services.push({ ...svc, apps });
    }

    return new Response(JSON.stringify({ services, timestamp: Date.now() }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
