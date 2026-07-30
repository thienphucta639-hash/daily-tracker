"use client";

import { useRef, useState } from "react";

interface ImageCaptureProps {
  value: string | null;
  onChange: (base64: string | null) => void;
  placeholder?: string;
}

export default function ImageCapture({ value, onChange, placeholder = "📷 Chụp/chọn ảnh" }: ImageCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setLoading(true);
    try {
      // Resize image to max 800px and compress
      const base64 = await resizeImage(file, 800, 0.7);
      onChange(base64);
    } catch {
      alert("Không thể xử lý ảnh");
    } finally {
      setLoading(false);
    }
  };

  const resizeImage = (file: File, maxSize: number, quality: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let { width, height } = img;
          
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) { reject(new Error("No ctx")); return; }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleDownload = () => {
    if (!value) return;
    const link = document.createElement("a");
    link.download = `image-${Date.now()}.jpg`;
    link.href = value;
    link.click();
  };

  if (value) {
    return (
      <div className="relative">
        <img src={value} alt="Preview" className="w-full h-32 object-cover rounded-xl" />
        <div className="absolute top-1 right-1 flex gap-1">
          <button
            type="button"
            onClick={handleDownload}
            className="w-7 h-7 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center text-xs"
            title="Tải xuống"
          >
            📥
          </button>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="w-7 h-7 bg-black/50 hover:bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="w-full py-2.5 border-2 border-dashed border-border rounded-xl text-sm text-text-muted hover:border-primary hover:text-primary transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            Đang xử lý...
          </>
        ) : (
          placeholder
        )}
      </button>
    </div>
  );
}
