// เรียก API ของ webchat (GET/POST /api/messages, GET /api/conversations, POST /api/conversations/:id/read)
// และเป็นที่รวม type ของ response — วันที่ส่งมาเป็น ISO string

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
  /**
   * Outbound only: when the customer is known to have read it. LINE has no read receipts for OA
   * messages, so the backend infers it — a customer who replies after a message has opened the chat.
   * null = not known yet (the customer may have read it without replying). Always null for inbound.
   */
  readAt: string | null;
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

// GET /api/link-preview?url= — Open Graph of a link inside a message; 404 when the page has none
export interface LinkPreview {
  url: string;
  title: string | null;
  description: string | null;
  /** Absolute http(s) URL on the linked site. */
  image: string | null;
  siteName: string | null;
}

/** Outbound message shown before the server confirms it. */
export interface PendingMessage {
  tempId: string;
  lineUserId: string;
  /** Empty for an image message. */
  text: string;
  /** Resized files kept for retry; `objectUrl` shows the preview while uploading. */
  image?: { full: Blob; preview: Blob; objectUrl: string };
  createdAt: string;
  status: "sending" | "failed";
  /** Server's reason when it failed (e.g. not opened over public HTTPS). */
  error?: string;
}

export interface ChatApi {
  getConversations(signal?: AbortSignal): Promise<Conversation[]>;
  getMessages(userId: string, signal?: AbortSignal): Promise<Message[]>;
  sendMessage(userId: string, text: string): Promise<Message>;
  /** `image`/`preview` are already resized JPEGs (see lib/resize-image.ts). */
  sendImage(userId: string, image: Blob, preview: Blob): Promise<Message>;
  markAsRead(userId: string): Promise<void>;
  getLinkPreview(url: string, signal?: AbortSignal): Promise<LinkPreview>;
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
    // FormData: let the browser set multipart/form-data with its boundary
    headers: init?.body instanceof FormData ? init.headers : { "Content-Type": "application/json", ...init?.headers },
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

/** ใช้ตัวนี้ทั่วแอป */
export const chatApi: ChatApi = {
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

  async sendImage(userId, image, preview) {
    const form = new FormData();
    form.set("userId", userId);
    form.set("image", image, "image.jpg");
    form.set("preview", preview, "preview.jpg");
    const data = await request<SendMessageResponse>("/api/messages/image", { method: "POST", body: form });
    return data.message;
  },

  async markAsRead(userId) {
    await request<void>(`/api/conversations/${encodeURIComponent(userId)}/read`, {
      method: "POST",
    });
  },

  getLinkPreview(url, signal) {
    return request<LinkPreview>(`/api/link-preview?url=${encodeURIComponent(url)}`, { signal });
  },
};
