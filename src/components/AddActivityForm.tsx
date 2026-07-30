"use client";

import { useState } from "react";
import { ACTIVITY_CATEGORIES } from "@/lib/types";

interface AddActivityFormProps {
  date: string;
  onSave: () => void;
  onClose: () => void;
}

export default function AddActivityForm({ date, onSave, onClose }: AddActivityFormProps) {
  const [category, setCategory] = useState("work");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          category,
          title: title.trim(),
          description: description.trim() || null,
          durationMinutes: duration ? parseInt(duration) : null,
          startTime: startTime || null,
          endTime: endTime || null,
        }),
      });
      onSave();
      onClose();
    } catch {
      alert("Lỗi khi thêm!");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center animate-fade-in" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="bg-surface w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl p-5 space-y-4 animate-slide-up max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">📋 Thêm hoạt động</h2>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-bg flex items-center justify-center text-text-muted hover:text-text">✕</button>
        </div>

        {/* Category */}
        <div className="grid grid-cols-4 gap-2">
          {ACTIVITY_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(cat.value)}
              className={`py-2 px-1 rounded-xl text-xs font-medium transition-all ${
                category === cat.value
                  ? "bg-primary text-white shadow-lg shadow-primary/30"
                  : "bg-bg text-text-muted hover:bg-primary/10"
              }`}
            >
              <div className="text-lg">{cat.emoji}</div>
              {cat.label.split(" ")[1]}
            </button>
          ))}
        </div>

        <div>
          <label className="text-sm text-text-muted mb-1 block">Hoạt động *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="VD: Họp team, Chạy bộ..."
            required
            className="w-full px-4 py-3 rounded-xl bg-bg border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            autoFocus
          />
        </div>

        <div>
          <label className="text-sm text-text-muted mb-1 block">Mô tả</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Chi tiết thêm..."
            rows={2}
            className="w-full px-4 py-3 rounded-xl bg-bg border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-sm text-text-muted mb-1 block">⏰ Bắt đầu</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-3 rounded-xl bg-bg border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-text-muted mb-1 block">🏁 Kết thúc</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-3 rounded-xl bg-bg border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-text-muted mb-1 block">⏱️ Phút</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="30"
              min="0"
              className="w-full px-3 py-3 rounded-xl bg-bg border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="w-full py-3.5 rounded-xl bg-primary text-white font-bold text-lg hover:bg-primary-dark transition-colors disabled:opacity-50 shadow-lg shadow-primary/30"
        >
          {saving ? "Đang lưu..." : "Thêm hoạt động"}
        </button>
      </form>
    </div>
  );
}
