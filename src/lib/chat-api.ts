// เรียก API ของ webchat (GET/POST /api/messages, GET /api/conversations, POST /api/conversations/:id/read)
// และเป็นที่รวม type ของ response — วันที่ส่งมาเป็น ISO string

import { USE_MOCK_API } from "./config";
import { mockChatApi } from "./mock-chat";

export type MessageDirection = "inbound" | "outbound";

export type MessageType = "text" | "image" | "sticker" | "file" | "other";

export interface Message {
  id: string;
  lineUserId: string;
  direction: MessageDirection;
  type: MessageType;
  text: string | null;
  /** Image/sticker URL when the backend has stored the content. */
  contentUrl: string | null;
  createdAt: string;
}

export interface LastMessage {
  direction: MessageDirection;
  type: MessageType;
  text: string | null;
}

export interface Conversation {
  lineUserId: string;
  displayName: string;
  pictureUrl: string | null;
  lastMessageAt: string;
  unreadCount: number;
  lastMessage: LastMessage | null;
}

// GET /api/conversations
export interface ConversationsResponse {
  conversations: Conversation[];
}

// GET /api/messages?userId=
export interface MessagesResponse {
  messages: Message[];
}

// POST /api/messages
export interface SendMessageRequest {
  userId: string;
  text: string;
}

export interface SendMessageResponse {
  message: Message;
}

/** Outbound message shown before the server confirms it. */
export interface PendingMessage {
  tempId: string;
  lineUserId: string;
  text: string;
  createdAt: string;
  status: "sending" | "failed";
}

export interface ChatApi {
  getConversations(signal?: AbortSignal): Promise<Conversation[]>;
  getMessages(userId: string, signal?: AbortSignal): Promise<Message[]>;
  sendMessage(userId: string, text: string): Promise<Message>;
  markAsRead(userId: string): Promise<void>;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body: unknown = await res.json();
      if (body && typeof body === "object" && "error" in body && typeof body.error === "string") {
        message = body.error;
      }
    } catch {
      // body was not JSON; keep the generic message
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

const httpChatApi: ChatApi = {
  async getConversations(signal) {
    const data = await request<ConversationsResponse>("/api/conversations", { signal });
    return data.conversations;
  },

  async getMessages(userId, signal) {
    const data = await request<MessagesResponse>(
      `/api/messages?userId=${encodeURIComponent(userId)}`,
      { signal },
    );
    return data.messages;
  },

  async sendMessage(userId, text) {
    const body: SendMessageRequest = { userId, text };
    const data = await request<SendMessageResponse>("/api/messages", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return data.message;
  },

  async markAsRead(userId) {
    await request<void>(`/api/conversations/${encodeURIComponent(userId)}/read`, {
      method: "POST",
    });
  },
};

/** ใช้ตัวนี้ทั่วแอป — สลับเป็น mock เมื่อตั้ง NEXT_PUBLIC_MOCK_API=1 */
export const chatApi: ChatApi = USE_MOCK_API ? mockChatApi : httpChatApi;
