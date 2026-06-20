import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Summer Sports Manager",
  description: "Hệ thống quản lý khóa học thể thao hè - Ghi danh, Check-in, Báo cáo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>
        {children}
      </body>
    </html>
  );
}
