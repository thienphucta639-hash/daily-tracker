"use client";

import { useState } from "react";
import { MEAL_TYPES } from "@/lib/types";
import { getCurrentTimeHHMM, formatDate } from "@/lib/utils";
import { isOnline, savePendingEntry } from "@/lib/offline";
import ImageCapture from "./ImageCapture";

interface AddMealFormProps {
  date: string;
  onSave: () => void;
  onClose: () => void;
}

function autoMealType(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 10) return "breakfast";
  if (h >= 10 && h < 14) return "lunch";
  if (h >= 17 && h < 21) return "dinner";
  return "snack";
}

export default function AddMealForm({ date, onSave, onClose }: AddMealFormProps) {
  const isToday = date === formatDate(new Date());
  const [mealType, setMealType] = useState(isToday ? autoMealType() : "breakfast");
  const [foodName, setFoodName] = useState("");
  const [calories, setCalories] = useState("");
  const [time, setTime] = useState(isToday ? getCurrentTimeHHMM() : "");
  const [notes, setNotes] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName.trim()) return;
    setSaving(true);

    const data = {
      date,
      mealType,
      foodName: foodName.trim(),
      calories: calories ? parseInt(calories) : null,
      time: time || getCurrentTimeHHMM(),
      notes: notes.trim() || null,
      image: image || null,
    };

    if (!isOnline()) {
      // Save offline
      savePendingEntry({ type: "meal", data });
      onSave();
      onClose();
      return;
    }

    try {
      await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      onSave();
      onClose();
    } catch {
      // Save offline on error
      savePendingEntry({ type: "meal", data });
      onSave();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadImage = () => {
    if (!image) return;
    const link = document.createElement("a");
    link.download = `meal-${date}-${time || "unknown"}.jpg`;
    link.href = image;
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center animate-fade-in" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="bg-surface w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl p-4 space-y-3 animate-slide-up max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">🍽️ Thêm bữa ăn</h2>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-bg flex items-center justify-center text-text-muted">✕</button>
        </div>

        {/* Meal type */}
        <div className="flex gap-1.5">
          {MEAL_TYPES.map((mt) => (
            <button
              key={mt.value}
              type="button"
              onClick={() => setMealType(mt.value)}
              className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                mealType === mt.value
                  ? "bg-primary text-white shadow-lg shadow-primary/30"
                  : "bg-bg text-text-muted"
              }`}
            >
              <div className="text-base">{mt.emoji}</div>
              {mt.label}
            </button>
          ))}
        </div>

        {/* Image capture */}
        <ImageCapture
          value={image}
          onChange={setImage}
          placeholder="📷 Chụp ảnh món ăn (để tính calo)"
        />
        {image && (
          <button
            type="button"
            onClick={handleDownloadImage}
            className="w-full py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
          >
            📥 Tải ảnh xuống để tính calo
          </button>
        )}

        <input
          type="text"
          value={foodName}
          onChange={(e) => setFoodName(e.target.value)}
          placeholder="Tên món ăn (Phở, Cơm...)"
          required
          autoFocus
          className="w-full px-4 py-2.5 rounded-xl bg-bg border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
        />

        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-bg border border-border focus:ring-2 focus:ring-primary outline-none text-sm"
            />
          </div>
          <div className="flex-1">
            <input
              type="number"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="🔥 Calories"
              min="0"
              className="w-full px-3 py-2 rounded-xl bg-bg border border-border focus:ring-2 focus:ring-primary outline-none text-sm"
            />
          </div>
        </div>

        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="📝 Ghi chú (tùy chọn)"
          className="w-full px-4 py-2 rounded-xl bg-bg border border-border focus:ring-2 focus:ring-primary outline-none text-sm"
        />

        <button
          type="submit"
          disabled={saving || !foodName.trim()}
          className="w-full py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-colors disabled:opacity-50 shadow-lg shadow-primary/30"
        >
          {saving ? "..." : isOnline() ? "Thêm bữa ăn" : "Lưu offline 📴"}
        </button>
      </form>
    </div>
  );
}
