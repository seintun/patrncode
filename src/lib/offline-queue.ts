const DB_NAME = 'sophocode-offline-queue';
const STORE_NAME = 'pending-saves';
const DB_VERSION = 1;

interface QueuedSave {
  id?: number;
  url: string;
  method: string;
  body: string;
  timestamp: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function queueSave(url: string, method: string, body: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).add({
    url,
    method,
    body,
    timestamp: Date.now(),
  });
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function drainQueue(): Promise<number> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const getAllRequest = store.getAll();

  return new Promise((resolve, reject) => {
    getAllRequest.onsuccess = async () => {
      const items: QueuedSave[] = getAllRequest.result;
      let replayed = 0;

      for (const item of items) {
        try {
          await fetch(item.url, {
            method: item.method,
            headers: { 'Content-Type': 'application/json' },
            body: item.body,
          });
          if (item.id != null) {
            store.delete(item.id);
          }
          replayed++;
        } catch {
          // Still offline or failed — leave in queue
        }
      }

      resolve(replayed);
    };
    getAllRequest.onerror = () => reject(getAllRequest.error);
  });
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    drainQueue().catch(() => {});
  });
}
