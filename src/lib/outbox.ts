"use client";

import type { SyncItem } from "./sync-schema";

// Answers go into IndexedDB first, then upload. If the Wi-Fi drops, they wait here and upload when it returns.
const DB_NAME = "aalopp";
const STORE = "outbox";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function run<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const request = work(tx.objectStore(STORE));
        tx.oncomplete = () => resolve(request.result);
        tx.onerror = () => reject(tx.error);
      }),
  );
}

function deleteMany(ids: string[]): Promise<void> {
  if (ids.length === 0) return Promise.resolve();
  return openDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        const store = tx.objectStore(STORE);
        for (const id of ids) store.delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      }),
  );
}

export async function enqueue(item: SyncItem): Promise<void> {
  await run("readwrite", (store) => store.put(item));
  void flush();
}

export function pendingCount(): Promise<number> {
  return run("readonly", (store) => store.count());
}

let flushing: Promise<void> | null = null;

/** Uploads everything queued. Safe to call often; concurrent calls share one upload. */
export function flush(): Promise<void> {
  flushing ??= (async () => {
    try {
      const items = await run<SyncItem[]>("readonly", (store) => store.getAll() as IDBRequest<SyncItem[]>);
      for (let i = 0; i < items.length; i += 50) {
        const batch = items.slice(i, i + 50);
        const res = await fetch("/api/sync", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ items: batch }),
        });
        if (!res.ok) return;
        const { saved, rejected } = (await res.json()) as { saved: string[]; rejected: { id: string }[] };
        // Rejected items (unknown student or question) will never succeed, so drop them in one transaction.
        await deleteMany([...saved, ...rejected.map((r) => r.id)]);
      }
    } catch {
      // Offline or server unreachable: keep the items for the next attempt.
    } finally {
      flushing = null;
    }
  })();
  return flushing;
}

/** Retry when the device comes back online, when the tab becomes visible, and every 30 seconds. */
export function startBackgroundSync(): () => void {
  const onVisible = () => document.visibilityState === "visible" && void flush();
  window.addEventListener("online", flush);
  document.addEventListener("visibilitychange", onVisible);
  const timer = window.setInterval(flush, 30_000);
  void flush();
  return () => {
    window.removeEventListener("online", flush);
    document.removeEventListener("visibilitychange", onVisible);
    window.clearInterval(timer);
  };
}
