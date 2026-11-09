// Spins up a throwaway local mongod on a random port with a temp data dir, so
// the integration tests never touch the real (Atlas) database. If no mongod
// binary can be found the integration suites skip themselves rather than fail.
import { spawn } from 'child_process';
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'fs';
import net from 'net';
import os from 'os';
import path from 'path';
import mongoose from 'mongoose';

const findMongod = () => {
  if (process.env.MONGOD_PATH && existsSync(process.env.MONGOD_PATH)) return process.env.MONGOD_PATH;
  const exe = process.platform === 'win32' ? 'mongod.exe' : 'mongod';
  for (const dir of (process.env.PATH || '').split(path.delimiter)) {
    if (dir && existsSync(path.join(dir, exe))) return path.join(dir, exe);
  }
  if (process.platform === 'win32') {
    const root = 'C:\\Program Files\\MongoDB\\Server';
    if (existsSync(root)) {
      for (const v of readdirSync(root).sort().reverse()) {
        const p = path.join(root, v, 'bin', exe);
        if (existsSync(p)) return p;
      }
    }
  }
  return null;
};

const freePort = () =>
  new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
    srv.on('error', reject);
  });

export const mongodAvailable = () => findMongod() !== null;

export async function startTestDb() {
  const bin = findMongod();
  if (!bin) throw new Error('mongod binary not found');
  const dbPath = mkdtempSync(path.join(os.tmpdir(), 'techgadgets-test-'));
  const port = await freePort();
  const proc = spawn(bin, ['--dbpath', dbPath, '--port', String(port), '--bind_ip', '127.0.0.1'], {
    stdio: 'ignore',
  });
  const uri = `mongodb://127.0.0.1:${port}/techgadgets_test`;
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 30000 });
  return {
    uri,
    async stop() {
      await mongoose.disconnect();
      proc.kill();
      await new Promise((r) => setTimeout(r, 500));
      try {
        rmSync(dbPath, { recursive: true, force: true });
      } catch {
        // temp dir cleanup is best effort (Windows may still hold a file lock)
      }
    },
  };
}
