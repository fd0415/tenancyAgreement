import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "租约体检 · AI 合同审核",
  description: "上传合同，AI 逐条扫描风险条款，生成体检报告与修改建议",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
