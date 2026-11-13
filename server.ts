import dotenv from 'dotenv';
import express from 'express';
import type { Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.resolve(__dirname, '.data');
const DATA_FILE = path.join(DATA_DIR, 'lms-state.json');

interface PersistedSnapshot {
  employees: unknown[];
  leaveTypes: unknown[];
  entitlements: unknown[];
  leaveRecords: unknown[];
  holidays: unknown[];
  auditLogs: unknown[];
}

interface StoredEnvelope {
  data: PersistedSnapshot | null;
  updatedAt: number;
}

function loadPersistedState(): StoredEnvelope {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as StoredEnvelope;
      if (parsed && parsed.data && Array.isArray(parsed.data.employees)) {
        return {
          data: sanitizeSnapshot(parsed.data),
          updatedAt: parsed.updatedAt || Date.now(),
        };
      }
    }
  } catch (err) {
    console.error('Failed to read persisted LMS state:', err);
  }
  return { data: null, updatedAt: 0 };
}

function sanitizeSnapshot(snapshot: PersistedSnapshot): PersistedSnapshot {
  const leaveTypes = Array.isArray(snapshot.leaveTypes)
    ? snapshot.leaveTypes.filter((lt) => {
        const item = lt as { id?: string };
        return item?.id !== 'LT_MATERNITY';
      })
    : [];

  const entitlements = Array.isArray(snapshot.entitlements)
    ? snapshot.entitlements.filter((ent) => {
        const item = ent as { leaveTypeId?: string };
        return item?.leaveTypeId !== 'LT_MATERNITY';
      })
    : [];

  return {
    employees: Array.isArray(snapshot.employees) ? snapshot.employees : [],
    leaveTypes,
    entitlements,
    leaveRecords: Array.isArray(snapshot.leaveRecords) ? snapshot.leaveRecords : [],
    holidays: Array.isArray(snapshot.holidays) ? snapshot.holidays : [],
    auditLogs: Array.isArray(snapshot.auditLogs) ? snapshot.auditLogs : [],
  };
}

function savePersistedState(envelope: StoredEnvelope): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tmpFile = `${DATA_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(envelope, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DATA_FILE);
  } catch (err) {
    console.error('Failed to write persisted LMS state:', err);
  }
}

let state: StoredEnvelope = loadPersistedState();
const sseClients = new Set<Response>();

function broadcastUpdate(updatedAt: number, sourceClientId?: string | null) {
  const payload = JSON.stringify({ updatedAt, sourceClientId: sourceClientId || null });
  for (const client of sseClients) {
    try {
      client.write(`event: db_update\ndata: ${payload}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, updatedAt: state.updatedAt, clients: sseClients.size });
  });

  app.get('/api/config', (_req: Request, res: Response) => {
    res.json({
      appUrl: process.env.APP_URL || '',
    });
  });

  app.get('/api/db', (_req: Request, res: Response) => {
    res.json({
      data: state.data,
      updatedAt: state.updatedAt,
    });
  });

  app.put('/api/db', (req: Request, res: Response) => {
    const body = req.body as {
      data?: PersistedSnapshot;
      sourceClientId?: string;
    };

    const incoming = body?.data;
    if (
      !incoming ||
      !Array.isArray(incoming.employees) ||
      !Array.isArray(incoming.leaveTypes) ||
      !Array.isArray(incoming.entitlements)
    ) {
      res.status(400).json({ ok: false, error: 'Invalid database payload' });
      return;
    }

    const sanitized = sanitizeSnapshot(incoming);
    const updatedAt = Date.now();
    state = { data: sanitized, updatedAt };
    savePersistedState(state);
    broadcastUpdate(updatedAt, body.sourceClientId);

    res.json({ ok: true, updatedAt });
  });

  app.get('/api/stream', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    sseClients.add(res);
    res.write(`event: connected\ndata: ${JSON.stringify({ updatedAt: state.updatedAt })}\n\n`);

    const heartbeat = setInterval(() => {
      try {
        res.write(': heartbeat\n\n');
      } catch {
        clearInterval(heartbeat);
        sseClients.delete(res);
      }
    }, 25000);

    req.on('close', () => {
      clearInterval(heartbeat);
      sseClients.delete(res);
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Leave Management Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
