import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daily Tracker",
  description: "Theo dõi hoạt động hàng ngày",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body className="bg-slate-100 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
