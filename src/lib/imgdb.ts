// IndexedDB image storage — much larger quota than localStorage (~hundreds of MB)
// localStorage keys are preserved; images move to IndexedDB transparently

const DB_NAME = "jay_tracker_images";
const STORE = "imgs";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => { req.result.createObjectStore(STORE); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveImage(id: string, data: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(data, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getImage(id: string): Promise<string | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteImage(id: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
  } catch { /* ignore */ }
}

// Migrate: move base64 images from localStorage items to IndexedDB
// Replaces inline base64 with "idb:ID" reference
export async function migrateImages(): Promise<void> {
  if (typeof window === "undefined") return;

  const keys = ["t_meals", "t_exps"];
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const items = JSON.parse(raw);
      let changed = false;

      for (const item of items) {
        if (item.image && item.image.startsWith("data:")) {
          // Move to IndexedDB
          const imgId = `img_${item.id}`;
          try {
            await saveImage(imgId, item.image);
            item.image = `idb:${imgId}`;
            changed = true;
          } catch { /* keep inline if IDB fails */ }
        }
      }

      if (changed) {
        localStorage.setItem(key, JSON.stringify(items));
      }
    } catch { /* ignore */ }
  }
}

// Check if a string is an IDB reference
export function isIdbRef(s: string | null): boolean {
  return !!s && s.startsWith("idb:");
}

// Resolve image: if IDB ref, load from IndexedDB; otherwise return as-is
export async function resolveImage(ref: string | null): Promise<string | null> {
  if (!ref) return null;
  if (ref.startsWith("idb:")) {
    const id = ref.slice(4);
    return getImage(id);
  }
  return ref; // inline base64 or URL
}
