// Fix data saved with wrong timezone (UTC instead of local)
// Run once on app load — safe to run multiple times

export function migrateTimezone() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem("t_tz_fixed")) return;

  const offset = new Date().getTimezoneOffset(); // e.g. -420 for GMT+7
  if (offset >= 0) { localStorage.setItem("t_tz_fixed", "1"); return; } // only fix for positive timezone

  const fixDate = (isoDate: string): string => {
    // If already correct format YYYY-MM-DD just return
    if (!isoDate || isoDate.length !== 10) return isoDate;
    // Re-parse using local time to check if it was off
    return isoDate; // can't reliably fix without knowing original — just mark as fixed
  };

  // Actually the real fix: for items created with toISOString() the date might be
  // yesterday in UTC. We check createdAt timestamp vs the stored date.
  const keys = [
    { key: "t_meals", dateField: "date", tsField: "createdAt" },
    { key: "t_acts", dateField: "date", tsField: "createdAt" },
    { key: "t_exps", dateField: "date", tsField: "createdAt" },
  ];

  for (const { key, dateField, tsField } of keys) {
    try {
      const items = JSON.parse(localStorage.getItem(key) || "[]");
      let changed = false;
      for (const item of items) {
        if (item[tsField]) {
          const created = new Date(item[tsField]);
          const localDate = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}-${String(created.getDate()).padStart(2, "0")}`;
          if (item[dateField] !== localDate) {
            item[dateField] = localDate;
            changed = true;
          }
        }
      }
      if (changed) localStorage.setItem(key, JSON.stringify(items));
    } catch { /* ignore */ }
  }

  localStorage.setItem("t_tz_fixed", "1");
}
