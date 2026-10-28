// ข้อมูลตัวอย่างสำหรับ Storybook เท่านั้น — เวลาอิงจากตอนเปิด story เพื่อให้ "วันนี้/เมื่อวาน" แสดงถูก

import type { Conversation, Message, PendingMessage } from "@/lib/chat-api";

export function minutesAgo(min: number) {
  return new Date(Date.now() - min * 60_000).toISOString();
}

/** รูปโปรไฟล์ทดแทน (SVG inline) — ไม่ต้องพึ่ง network */
export const SAMPLE_PICTURE_URL =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#00a4bd"/><circle cx="40" cy="32" r="14" fill="#e5f5f8"/><rect x="16" y="52" width="48" height="28" rx="14" fill="#e5f5f8"/></svg>',
  );

export const SAMPLE_STICKER_URL =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><circle cx="60" cy="60" r="54" fill="#ffd166"/><circle cx="42" cy="50" r="7" fill="#33475b"/><circle cx="78" cy="50" r="7" fill="#33475b"/><path d="M36 74 q24 22 48 0" stroke="#33475b" stroke-width="7" fill="none" stroke-linecap="round"/></svg>',
  );

/** รูปที่ลูกค้าส่งมา (แนวนอน) — ใช้ทดสอบ Modal Box รูปใหญ่; ต้องมี width/height ไม่งั้น <img> จะกว้าง 0 */
export const SAMPLE_IMAGE_URL =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><rect width="1200" height="800" fill="#e5f5f8"/><rect x="300" y="180" width="600" height="440" rx="24" fill="#2d3e50"/><circle cx="600" cy="400" r="120" fill="#ff7a59"/><text x="600" y="720" font-family="sans-serif" font-size="48" text-anchor="middle" fill="#33475b">1200 × 800</text></svg>',
  );

export const conversations: Conversation[] = [
  {
    lineUserId: "U1001",
    displayName: "สมหญิง ใจดี",
    pictureUrl: SAMPLE_PICTURE_URL,
    lastMessageAt: minutesAgo(3),
    unreadCount: 2,
    lastMessage: { direction: "inbound", type: "text", text: "ตัวนี้มีสีอื่นไหมคะ" },
  },
  {
    lineUserId: "U1002",
    displayName: "Kittipong",
    pictureUrl: null,
    lastMessageAt: minutesAgo(45),
    unreadCount: 0,
    lastMessage: { direction: "outbound", type: "text", text: "ขอบคุณที่อุดหนุนครับ 😊" },
  },
  {
    lineUserId: "U1003",
    displayName: "Nok 🐦",
    pictureUrl: null,
    lastMessageAt: minutesAgo(60 * 25),
    unreadCount: 1,
    lastMessage: { direction: "inbound", type: "sticker", text: null },
  },
  {
    lineUserId: "U1004",
    displayName: "ร้านป้าแดง (ชื่อยาวมากเพื่อทดสอบการตัดข้อความ)",
    pictureUrl: null,
    lastMessageAt: minutesAgo(60 * 24 * 4),
    unreadCount: 128,
    lastMessage: { direction: "inbound", type: "image", text: null },
  },
];

function msg(id: string, partial: Omit<Message, "id" | "lineUserId" | "contentUrl" | "readAt"> & Partial<Message>): Message {
  return { id, lineUserId: "U1001", contentUrl: null, readAt: null, ...partial };
}

export const messages: Message[] = [
  msg("m1", { direction: "inbound", type: "text", text: "สวัสดีค่ะ สนใจสินค้าตัวนี้ค่ะ", createdAt: minutesAgo(60 * 26) }),
  msg("m2", { direction: "outbound", type: "text", text: "สวัสดีครับ ยินดีให้บริการครับ", createdAt: minutesAgo(60 * 26 - 2), readAt: minutesAgo(20) }),
  msg("m3", { direction: "inbound", type: "image", text: null, createdAt: minutesAgo(20) }),
  msg("m4", { direction: "inbound", type: "sticker", text: null, contentUrl: SAMPLE_STICKER_URL, createdAt: minutesAgo(18) }),
  msg("m5", {
    direction: "inbound",
    type: "text",
    text: "ตัวนี้มีสีอื่นไหมคะ\nถ้ามีสีดำขอ 2 ตัว ส่งไปเชียงใหม่ได้ไหมคะ",
    createdAt: minutesAgo(3),
  }),
];

export const pendingMessages: PendingMessage[] = [
  {
    tempId: "t1", lineUserId: "U1001",
    text: "มีสีดำครับ เดี๋ยวส่งรูปให้นะครับ",
    createdAt: minutesAgo(0),
    status: "sending"
  },
  {
    tempId: "t2",
    lineUserId: "U1001",
    text: "ค่าส่ง 50 บาทครับ",
    createdAt: minutesAgo(0),
    status: "failed"
  },
];
