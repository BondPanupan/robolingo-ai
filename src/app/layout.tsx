import type { Metadata, Viewport } from "next";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "LINE OA Webchat",
  description: "แชทกับลูกค้าผ่าน LINE Official Account",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2d3e50",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}
