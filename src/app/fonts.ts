import { Lexend_Deca, Noto_Sans_Thai } from "next/font/google";

// Lexend Deca carries Latin text; Thai glyphs fall through to Noto Sans Thai.
// Shared by the root layout and Storybook's preview so stories render with the same fonts.
export const lexendDeca = Lexend_Deca({
  variable: "--font-latin",
  subsets: ["latin"],
});

export const notoSansThai = Noto_Sans_Thai({
  variable: "--font-thai",
  subsets: ["thai"],
});

export const fontVariables = `${lexendDeca.variable} ${notoSansThai.variable}`;
