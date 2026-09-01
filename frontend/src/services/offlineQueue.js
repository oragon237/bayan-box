/**
 * Bayan offline queue — IndexedDB-backed store (FR-OFF-001).
 * Cap: 1,000 queued entries (NFR 6.2). Actions are flushed via the service
 * worker when connectivity returns (FR-OFF-002).
 */

const DB_NAME = 'bayanbox_offline';
const STORE = 'actions';
const VERSION = 1;
const MAX_ENTRIES = 1000;

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
        store.createIndex('byQueuedAt', 'queued_at');
        store.createIndex('bySynced', 'synced');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore(mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    const result = fn(store);
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Enqueue an offline action. Auto-drops the oldest entries past the cap.
 * @param {{ type: string, payload: object }} action
 */
export async function enqueueAction(action) {
  await withStore('readwrite', (store) => {
    store.add({
      type: action.type,
      payload: action.payload,
      queued_at: new Date().toISOString(),
      synced: 0,
      attempts: 0,
    });

    // Enforce the 1,000-entry cap (NFR 6.2)
    const all = store.getAll();
    all.onsuccess = () => {
      if (all.result.length > MAX_ENTRIES) {
        const toDrop = all.result
          .sort((a, b) => new Date(a.queued_at) - new Date(b.queued_at))
          .slice(0, all.result.length - MAX_ENTRIES);
        toDrop.forEach((entry) => store.delete(entry.id));
      }
    };
  });
}

export async function getQueue() {
  return withStore('readonly', (store) => store.getAll());
}

export async function markSynced(id) {
  const entry = await getEntry(id);
  await withStore('readwrite', (store) => store.put({ ...entry, synced: 1 }));
}

export async function removeAction(id) {
  await withStore('readwrite', (store) => store.delete(id));
}

async function getEntry(id) {
  return withStore('readonly', (store) => store.get(id));
}

/**
 * Flush the queue to the API sequentially. Called by the background sync
 * event or the connectivity listener.
 */
export async function flushQueue(client, onProgress) {
  const queue = await getQueue();
  const pending = queue.filter((a) => !a.synced).sort((a, b) => new Date(a.queued_at) - new Date(b.queued_at));

  for (const action of pending) {
    try {
      await client.post('/sync/offline-queue', {
        actions: [
          {
            action_id: String(action.id),
            type: action.type,
            payload: action.payload,
            queued_at: action.queued_at,
          },
        ],
      });
      await removeAction(action.id);
      onProgress?.(action);
    } catch (err) {
      // Leave entry queued; retry on next connectivity event.
      console.warn('Offline flush failed for action', action.id, err);
    }
  }

  return pending.length;
}

export async function queueCount() {
  return withStore('readonly', (store) => store.count());
}
