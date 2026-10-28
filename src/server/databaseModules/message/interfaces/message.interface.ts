// ตรงกับ MessageDirection / MessageType ฝั่ง frontend (lib/chat-api.ts) — ค่าที่เก็บใน DB ส่งออกไปตรง ๆ

export const MESSAGE_DIRECTIONS = ["inbound", "outbound"] as const;
export const MESSAGE_TYPES = ["text", "image", "sticker", "file", "other"] as const;

export type IMessageDirection = (typeof MESSAGE_DIRECTIONS)[number];
export type IMessageType = (typeof MESSAGE_TYPES)[number];

/** เนื้อหาข้อความที่แปลงจาก LINE แล้ว — ประเภทที่ UI ยังไม่รองรับเก็บเป็น "other" */
export interface IMessageContent {
  type: IMessageType;
  text?: string | null;
  contentUrl?: string | null;
}

export interface ICreateInboundMessage extends IMessageContent {
  lineUserId: string;
  lineMessageId: string;
  webhookEventId: string;
  markAsReadToken?: string;
  createdAt: Date;
}

export interface ICreateOutboundMessage extends IMessageContent {
  lineUserId: string;
  createdAt: Date;
}
