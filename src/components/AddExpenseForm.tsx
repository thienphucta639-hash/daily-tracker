"use client";

import { useState } from "react";
import { EXPENSE_CATEGORIES } from "@/lib/types";
import { isOnline, savePendingEntry } from "@/lib/offline";
import ImageCapture from "./ImageCapture";

interface AddExpenseFormProps {
  date: string;
  onSave: () => void;
  onClose: () => void;
}

export default function AddExpenseForm({ date, onSave, onClose }: AddExpenseFormProps) {
  const [category, setCategory] = useState("food");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount) return;
    setSaving(true);

    const data = {
      date,
      category,
      description: description.trim(),
      amount: parseInt(amount),
      image: image || null,
    };

    if (!isOnline()) {
      savePendingEntry({ type: "expense", data });
      onSave();
      onClose();
      return;
    }

    try {
      await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      onSave();
      onClose();
    } catch {
      savePendingEntry({ type: "expense", data });
      onSave();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadImage = () => {
    if (!image) return;
    const link = document.createElement("a");
    link.download = `receipt-${date}-${Date.now()}.jpg`;
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
          <h2 className="text-lg font-bold">💰 Thêm chi tiêu</h2>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-bg flex items-center justify-center text-text-muted">✕</button>
        </div>

        {/* Category */}
        <div className="flex flex-wrap gap-1.5">
          {EXPENSE_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCategory(cat.value)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                category === cat.value
                  ? "bg-primary text-white shadow-lg shadow-primary/30"
                  : "bg-bg text-text-muted"
              }`}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {/* Receipt image */}
        <ImageCapture
          value={image}
          onChange={setImage}
          placeholder="🧾 Chụp hóa đơn/biên lai"
        />
        {image && (
          <button
            type="button"
            onClick={handleDownloadImage}
            className="w-full py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
          >
            📥 Tải hóa đơn xuống
          </button>
        )}

        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Mô tả (Cà phê, Grab...)"
          required
          autoFocus
          className="w-full px-4 py-2.5 rounded-xl bg-bg border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
        />

        <div>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="💵 Số tiền (VNĐ)"
            required
            min="0"
            className="w-full px-4 py-2.5 rounded-xl bg-bg border border-border focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-lg font-bold"
          />
          {amount && (
            <p className="text-xs text-text-muted mt-1 text-right">
              = {new Intl.NumberFormat("vi-VN").format(parseInt(amount) || 0)}đ
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={saving || !description.trim() || !amount}
          className="w-full py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-colors disabled:opacity-50 shadow-lg shadow-primary/30"
        >
          {saving ? "..." : isOnline() ? "Thêm chi tiêu" : "Lưu offline 📴"}
        </button>
      </form>
    </div>
  );
}
