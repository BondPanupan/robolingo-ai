// In-browser fake backend so the UI can be developed before the API routes exist.
// Enable with NEXT_PUBLIC_MOCK_API=1. Sending a message containing "fail" simulates an error.

import type { ChatApi, Conversation, Message, MessageType } from "./chat-api";

interface MockUser {
  lineUserId: string;
  displayName: string;
  pictureUrl: string | null;
  unreadCount: number;
}

interface MockState {
  users: MockUser[];
  messages: Message[];
}

const LATENCY_MS = 350;
const INBOUND_INTERVAL_MS = 20_000;

const INBOUND_SAMPLES: { type: MessageType; text: string | null }[] = [
  { type: "text", text: "สวัสดีค่ะ ยังมีของอยู่ไหมคะ" },
  { type: "text", text: "ส่งต่างจังหวัดกี่วันครับ" },
  { type: "sticker", text: null },
  { type: "image", text: null },
  { type: "text", text: "โอนแล้วนะคะ 🙏" },
  { type: "file", text: null },
];

let state: MockState | null = null;
let counter = 0;

function nextId() {
  counter += 1;
  return `mock-${Date.now()}-${counter}`;
}

function minutesAgo(min: number) {
  return new Date(Date.now() - min * 60_000).toISOString();
}

function msg(
  lineUserId: string,
  direction: Message["direction"],
  type: MessageType,
  text: string | null,
  createdAt: string,
): Message {
  return { id: nextId(), lineUserId, direction, type, text, contentUrl: null, createdAt };
}

// Built lazily so nothing time-dependent runs during server prerender.
function getState(): MockState {
  if (state) return state;

  const users: MockUser[] = [
    { lineUserId: "U1001", displayName: "สมหญิง ใจดี", pictureUrl: null, unreadCount: 2 },
    { lineUserId: "U1002", displayName: "Kittipong", pictureUrl: null, unreadCount: 0 },
    { lineUserId: "U1003", displayName: "Nok 🐦", pictureUrl: null, unreadCount: 1 },
    { lineUserId: "U1004", displayName: "ร้านป้าแดง", pictureUrl: null, unreadCount: 0 },
  ];

  const messages: Message[] = [
    msg("U1001", "inbound", "text", "สวัสดีค่ะ สนใจสินค้าตัวนี้ค่ะ", minutesAgo(60 * 26)),
    msg("U1001", "outbound", "text", "สวัสดีครับ ยินดีให้บริการครับ", minutesAgo(60 * 26 - 2)),
    msg("U1001", "inbound", "image", null, minutesAgo(12)),
    msg("U1001", "inbound", "text", "ตัวนี้มีสีอื่นไหมคะ", minutesAgo(11)),
    msg("U1002", "inbound", "text", "ขอบคุณครับ ได้รับของแล้ว", minutesAgo(90)),
    msg("U1002", "outbound", "text", "ขอบคุณที่อุดหนุนครับ 😊", minutesAgo(88)),
    msg("U1003", "inbound", "sticker", null, minutesAgo(5)),
    msg("U1004", "inbound", "text", "พรุ่งนี้ร้านเปิดกี่โมงคะ", minutesAgo(60 * 50)),
    msg("U1004", "outbound", "text", "เปิด 9 โมงครับ", minutesAgo(60 * 49)),
  ];

  state = { users, messages };

  // Simulate a customer writing in through LINE.
  setInterval(() => {
    const s = getState();
    const user = s.users[Math.floor(Math.random() * s.users.length)];
    const sample = INBOUND_SAMPLES[Math.floor(Math.random() * INBOUND_SAMPLES.length)];
    s.messages.push(
      msg(user.lineUserId, "inbound", sample.type, sample.text, new Date().toISOString()),
    );
    user.unreadCount += 1;
  }, INBOUND_INTERVAL_MS);

  return state;
}

function delay<T>(value: T, signal?: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(value), LATENCY_MS);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });
}

function toConversation(user: MockUser, messages: Message[]): Conversation {
  const own = messages.filter((m) => m.lineUserId === user.lineUserId);
  const last = own.at(-1);
  return {
    lineUserId: user.lineUserId,
    displayName: user.displayName,
    pictureUrl: user.pictureUrl,
    unreadCount: user.unreadCount,
    lastMessageAt: last?.createdAt ?? new Date(0).toISOString(),
    lastMessage: last ? { direction: last.direction, type: last.type, text: last.text } : null,
  };
}

export const mockChatApi: ChatApi = {
  getConversations(signal) {
    const s = getState();
    const list = s.users
      .map((u) => toConversation(u, s.messages))
      .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
    return delay(structuredClone(list), signal);
  },

  getMessages(userId, signal) {
    const s = getState();
    return delay(
      structuredClone(s.messages.filter((m) => m.lineUserId === userId)),
      signal,
    );
  },

  async sendMessage(userId, text) {
    await delay(null);
    if (text.toLowerCase().includes("fail")) {
      throw new Error("ส่งข้อความไม่สำเร็จ (mock)");
    }
    const message = msg(userId, "outbound", "text", text, new Date().toISOString());
    getState().messages.push(message);
    return structuredClone(message);
  },

  async markAsRead(userId) {
    const user = getState().users.find((u) => u.lineUserId === userId);
    if (user) user.unreadCount = 0;
  },
};
