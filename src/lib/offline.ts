import { PendingEntry } from "./types";

const STORAGE_KEY = "daily_tracker_pending";

export function getPendingEntries(): PendingEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function savePendingEntry(entry: Omit<PendingEntry, "id" | "createdAt">): void {
  if (typeof window === "undefined") return;
  const entries = getPendingEntries();
  entries.push({
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: Date.now(),
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function removePendingEntry(id: string): void {
  if (typeof window === "undefined") return;
  const entries = getPendingEntries().filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function clearPendingEntries(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export async function syncPendingEntries(): Promise<{ synced: number; failed: number }> {
  const entries = getPendingEntries();
  let synced = 0;
  let failed = 0;

  for (const entry of entries) {
    try {
      const endpoint =
        entry.type === "meal" ? "/api/meals" :
        entry.type === "expense" ? "/api/expenses" :
        "/api/activities";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry.data),
      });

      if (res.ok) {
        removePendingEntry(entry.id);
        synced++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return { synced, failed };
}

export function isOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}
