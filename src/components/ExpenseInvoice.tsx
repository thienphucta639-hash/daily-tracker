"use client";

import { useRef } from "react";
import { Expense, EXPENSE_CATEGORIES } from "@/lib/types";
import { formatCurrency, formatDateDisplay } from "@/lib/utils";

interface ExpenseInvoiceProps {
  expenses: Expense[];
  date: string;
  onClose: () => void;
}

const getExpCat = (v: string) => EXPENSE_CATEGORIES.find((c) => c.value === v);

export default function ExpenseInvoice({ expenses, date, onClose }: ExpenseInvoiceProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const total = expenses.reduce((s, e) => s + e.amount, 0);

  // Group by category
  const grouped: Record<string, { emoji: string; label: string; items: Expense[]; subtotal: number }> = {};
  expenses.forEach(exp => {
    const cat = getExpCat(exp.category);
    const key = exp.category;
    if (!grouped[key]) {
      grouped[key] = { emoji: cat?.emoji || "📦", label: cat?.label || "Khác", items: [], subtotal: 0 };
    }
    grouped[key].items.push(exp);
    grouped[key].subtotal += exp.amount;
  });

  const handleDownload = async () => {
    if (!invoiceRef.current) return;
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const el = invoiceRef.current;
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      canvas.width = w * 2;
      canvas.height = h * 2;
      ctx.scale(2, 2);

      // White background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);

      // Simple text-based rendering
      ctx.fillStyle = "#1e293b";
      ctx.font = "bold 18px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`🧾 Hóa đơn chi tiêu`, w / 2, 30);

      ctx.font = "13px sans-serif";
      ctx.fillStyle = "#64748b";
      ctx.fillText(formatDateDisplay(date) + " — " + date, w / 2, 50);

      let y = 80;
      ctx.textAlign = "left";

      Object.values(grouped).forEach(group => {
        ctx.fillStyle = "#6366f1";
        ctx.font = "bold 13px sans-serif";
        ctx.fillText(`${group.emoji} ${group.label}`, 20, y);
        ctx.fillStyle = "#ef4444";
        ctx.textAlign = "right";
        ctx.fillText(formatCurrency(group.subtotal), w - 20, y);
        ctx.textAlign = "left";
        y += 20;

        ctx.fillStyle = "#334155";
        ctx.font = "12px sans-serif";
        group.items.forEach(item => {
          ctx.fillText(`  • ${item.description}`, 20, y);
          ctx.textAlign = "right";
          ctx.fillStyle = "#64748b";
          ctx.fillText(formatCurrency(item.amount), w - 20, y);
          ctx.textAlign = "left";
          ctx.fillStyle = "#334155";
          y += 18;
        });
        y += 8;
      });

      // Total line
      y += 5;
      ctx.strokeStyle = "#e2e8f0";
      ctx.beginPath();
      ctx.moveTo(20, y);
      ctx.lineTo(w - 20, y);
      ctx.stroke();
      y += 20;

      ctx.fillStyle = "#1e293b";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText("TỔNG CỘNG:", 20, y);
      ctx.textAlign = "right";
      ctx.fillStyle = "#ef4444";
      ctx.fillText(formatCurrency(total), w - 20, y);

      // Crop canvas to content
      canvas.height = (y + 30) * 2;
      // Re-draw at correct size
      ctx.scale(1, 1); // reset
      const finalCanvas = document.createElement("canvas");
      const fctx = finalCanvas.getContext("2d");
      if (!fctx) return;
      finalCanvas.width = w * 2;
      finalCanvas.height = (y + 30) * 2;
      fctx.scale(2, 2);
      fctx.fillStyle = "#ffffff";
      fctx.fillRect(0, 0, w, y + 30);

      fctx.fillStyle = "#1e293b";
      fctx.font = "bold 18px sans-serif";
      fctx.textAlign = "center";
      fctx.fillText(`🧾 Hóa đơn chi tiêu`, w / 2, 30);
      fctx.font = "13px sans-serif";
      fctx.fillStyle = "#64748b";
      fctx.fillText(formatDateDisplay(date) + " — " + date, w / 2, 50);

      let y2 = 80;
      fctx.textAlign = "left";
      Object.values(grouped).forEach(group => {
        fctx.fillStyle = "#6366f1";
        fctx.font = "bold 13px sans-serif";
        fctx.fillText(`${group.emoji} ${group.label}`, 20, y2);
        fctx.fillStyle = "#ef4444";
        fctx.textAlign = "right";
        fctx.fillText(formatCurrency(group.subtotal), w - 20, y2);
        fctx.textAlign = "left";
        y2 += 20;
        fctx.fillStyle = "#334155";
        fctx.font = "12px sans-serif";
        group.items.forEach(item => {
          fctx.fillText(`  • ${item.description}`, 20, y2);
          fctx.textAlign = "right";
          fctx.fillStyle = "#64748b";
          fctx.fillText(formatCurrency(item.amount), w - 20, y2);
          fctx.textAlign = "left";
          fctx.fillStyle = "#334155";
          y2 += 18;
        });
        y2 += 8;
      });
      y2 += 5;
      fctx.strokeStyle = "#e2e8f0";
      fctx.beginPath(); fctx.moveTo(20, y2); fctx.lineTo(w - 20, y2); fctx.stroke();
      y2 += 20;
      fctx.fillStyle = "#1e293b";
      fctx.font = "bold 16px sans-serif";
      fctx.textAlign = "left";
      fctx.fillText("TỔNG CỘNG:", 20, y2);
      fctx.textAlign = "right";
      fctx.fillStyle = "#ef4444";
      fctx.fillText(formatCurrency(total), w - 20, y2);

      const link = document.createElement("a");
      link.download = `hoa-don-${date}.png`;
      link.href = finalCanvas.toDataURL("image/png");
      link.click();
    } catch {
      alert("Không thể tải hóa đơn");
    }
  };

  const handleSaving = () => {
    const data = {
      date,
      total,
      items: expenses.map(e => ({
        description: e.description,
        amount: e.amount,
        category: e.category,
      })),
    };
    const encoded = encodeURIComponent(JSON.stringify(data));
    window.open(`https://saving-y2k.vercel.app/?expenses=${encoded}`, "_blank");
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center animate-fade-in" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl max-h-[90vh] overflow-y-auto animate-slide-up"
      >
        {/* Invoice preview */}
        <div ref={invoiceRef} className="p-5">
          <div className="text-center mb-4">
            <div className="text-2xl font-black">🧾 Hóa đơn chi tiêu</div>
            <div className="text-sm text-text-muted">{formatDateDisplay(date)} — {date}</div>
          </div>

          <div className="space-y-3">
            {Object.entries(grouped).map(([key, group]) => (
              <div key={key}>
                <div className="flex items-center justify-between text-sm font-bold mb-1">
                  <span className="text-primary">{group.emoji} {group.label}</span>
                  <span className="text-danger">{formatCurrency(group.subtotal)}</span>
                </div>
                {group.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between pl-5 py-0.5">
                    <span className="text-xs text-text">{item.description}</span>
                    <span className="text-xs text-text-muted">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="border-t-2 border-dashed border-border mt-4 pt-3 flex items-center justify-between">
            <span className="font-black text-lg">TỔNG CỘNG</span>
            <span className="font-black text-xl text-danger">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 space-y-2">
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="flex-1 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark transition-colors flex items-center justify-center gap-1.5"
            >
              📥 Tải hình ảnh
            </button>
            <button
              onClick={handleSaving}
              className="flex-1 py-2.5 bg-green-500 text-white rounded-xl font-bold text-sm hover:bg-green-600 transition-colors flex items-center justify-center gap-1.5"
            >
              💰 Tiết kiệm
            </button>
          </div>
          <button
            onClick={onClose}
            className="w-full py-2 bg-bg text-text-muted rounded-xl text-sm font-medium hover:bg-border transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
