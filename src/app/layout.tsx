import type { Metadata, Viewport } from "next";
import { Lexend_Deca, Noto_Sans_Thai } from "next/font/google";
import "./globals.css";

// Lexend Deca carries Latin text; Thai glyphs fall through to Noto Sans Thai.
const lexendDeca = Lexend_Deca({
  variable: "--font-latin",
  subsets: ["latin"],
});

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-thai",
  subsets: ["thai"],
});

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
    <html lang="th" className={`${lexendDeca.variable} ${notoSansThai.variable}`}>
      <body>{children}</body>
    </html>
  );
}
