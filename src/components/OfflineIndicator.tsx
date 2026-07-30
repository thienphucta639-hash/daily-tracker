"use client";

import { useState, useEffect, useCallback } from "react";
import { getPendingEntries, syncPendingEntries, isOnline } from "@/lib/offline";

interface OfflineIndicatorProps {
  onSync?: () => void;
}

export default function OfflineIndicator({ onSync }: OfflineIndicatorProps) {
  const [online, setOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [lastOfflineTime, setLastOfflineTime] = useState<number | null>(null);

  const updatePendingCount = useCallback(() => {
    setPendingCount(getPendingEntries().length);
  }, []);

  useEffect(() => {
    setOnline(isOnline());
    updatePendingCount();

    const handleOnline = () => {
      setOnline(true);
      // Show "back online" banner if was offline
      if (lastOfflineTime && Date.now() - lastOfflineTime > 5000) {
        setShowBanner(true);
      }
      updatePendingCount();
    };

    const handleOffline = () => {
      setOnline(false);
      setLastOfflineTime(Date.now());
      setShowBanner(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check pending entries periodically
    const interval = setInterval(updatePendingCount, 5000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [lastOfflineTime, updatePendingCount]);

  const handleSync = async () => {
    if (!online || syncing) return;
    setSyncing(true);
    try {
      const result = await syncPendingEntries();
      updatePendingCount();
      if (result.synced > 0) {
        onSync?.();
        alert(`✅ Đã đồng bộ ${result.synced} mục!`);
      }
      if (result.failed > 0) {
        alert(`⚠️ ${result.failed} mục lỗi, thử lại sau.`);
      }
    } catch {
      alert("Lỗi đồng bộ!");
    } finally {
      setSyncing(false);
    }
  };

  // Offline banner
  if (!online) {
    return (
      <div className="bg-orange-500 text-white px-4 py-2 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="text-lg">📴</span>
          <div>
            <div className="font-bold">Không có mạng</div>
            <div className="text-orange-100 text-xs">Dữ liệu sẽ lưu tạm, đồng bộ khi có mạng</div>
          </div>
        </div>
        {pendingCount > 0 && (
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
            {pendingCount} chờ
          </span>
        )}
      </div>
    );
  }

  // Back online banner with pending entries
  if (showBanner && pendingCount > 0) {
    return (
      <div className="bg-green-500 text-white px-4 py-2 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="text-lg">📶</span>
          <div>
            <div className="font-bold">Đã có mạng trở lại!</div>
            <div className="text-green-100 text-xs">{pendingCount} mục đang chờ đồng bộ</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="bg-white text-green-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-green-50 disabled:opacity-50"
          >
            {syncing ? "..." : "Đồng bộ"}
          </button>
          <button
            onClick={() => setShowBanner(false)}
            className="text-white/70 hover:text-white"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  // Just pending indicator (small)
  if (pendingCount > 0) {
    return (
      <button
        onClick={handleSync}
        disabled={syncing}
        className="fixed top-2 right-2 bg-orange-500 text-white px-2.5 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1 z-50 hover:bg-orange-600 disabled:opacity-50"
      >
        {syncing ? (
          <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <span>🔄</span>
        )}
        {pendingCount} chờ đồng bộ
      </button>
    );
  }

  return null;
}
