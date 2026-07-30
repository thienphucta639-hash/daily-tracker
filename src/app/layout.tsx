import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daily Tracker — Theo dõi hoạt động hàng ngày",
  description: "Ứng dụng theo dõi chi tiết hoạt động, bữa ăn, chi tiêu hàng ngày",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#6366f1",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body className="bg-bg text-text antialiased">{children}</body>
    </html>
  );
}
