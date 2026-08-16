const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development", // Tắt PWA khi đang code để tránh lỗi cache, chỉ bật khi deploy
  workboxOptions: {
    disableDevLogs: true,
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Nếu trước đó file next.config của bạn có code gì ở trong, hãy dán lại vào khu vực này
  reactStrictMode: true,
};

module.exports = withPWA(nextConfig);