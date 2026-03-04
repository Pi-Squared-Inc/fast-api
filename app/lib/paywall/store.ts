import fs from 'node:fs/promises';
import path from 'node:path';
import type { PaywallStoreData } from './types';

const g = globalThis as typeof globalThis & {
  __moneyPaywallStoreWriteQueue?: Promise<void>;
};

function storePath(): string {
  if (process.env.PAYWALL_STORE_PATH?.trim()) {
    return process.env.PAYWALL_STORE_PATH.trim();
  }
  return path.join(process.cwd(), '.data', 'paywall-store.json');
}

function defaultStore(): PaywallStoreData {
  return {
    version: 1,
    products: {},
    products_by_slug: {},
    assets: {},
    receiver_accounts: {},
    intents: {},
    payment_events: {},
    unlock_grants: {},
    seen_transfers: {},
  };
}

async function readFromDisk(): Promise<PaywallStoreData> {
  const filePath = storePath();
  let raw: string;
  try {
    raw = await fs.readFile(filePath, 'utf-8');
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return defaultStore();
    }
    throw err;
  }

  const parsed = JSON.parse(raw) as Partial<PaywallStoreData>;
  if (!parsed || parsed.version !== 1) {
    return defaultStore();
  }
  return {
    version: 1,
    products: parsed.products ?? {},
    products_by_slug: parsed.products_by_slug ?? {},
    assets: parsed.assets ?? {},
    receiver_accounts: parsed.receiver_accounts ?? {},
    intents: parsed.intents ?? {},
    payment_events: parsed.payment_events ?? {},
    unlock_grants: parsed.unlock_grants ?? {},
    seen_transfers: parsed.seen_transfers ?? {},
  };
}

async function writeToDisk(store: PaywallStoreData): Promise<void> {
  const filePath = storePath();
  await fs.mkdir(path.dirname(filePath), { recursive: true, mode: 0o700 });
  const tmpPath = `${filePath}.tmp.${process.pid}.${Date.now()}`;
  try {
    await fs.writeFile(tmpPath, JSON.stringify(store, null, 2), {
      encoding: 'utf-8',
      mode: 0o600,
    });
    await fs.rename(tmpPath, filePath);
  } catch (err: unknown) {
    try {
      await fs.unlink(tmpPath);
    } catch {
      // ignore cleanup failure
    }
    throw err;
  }
}

function getWriteQueue(): Promise<void> {
  if (!g.__moneyPaywallStoreWriteQueue) {
    g.__moneyPaywallStoreWriteQueue = Promise.resolve();
  }
  return g.__moneyPaywallStoreWriteQueue;
}

function setWriteQueue(queue: Promise<void>): void {
  g.__moneyPaywallStoreWriteQueue = queue;
}

export async function readPaywallStore(): Promise<PaywallStoreData> {
  await getWriteQueue();
  return readFromDisk();
}

export async function mutatePaywallStore<T>(
  mutator: (store: PaywallStoreData) => Promise<T> | T,
): Promise<T> {
  let result!: T;
  const task = getWriteQueue().then(async () => {
    const store = await readFromDisk();
    result = await mutator(store);
    await writeToDisk(store);
  });
  setWriteQueue(task.catch(() => undefined));
  await task;
  return result;
}

