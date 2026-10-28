// เรียก LINE Messaging API (โปรไฟล์ลูกค้า, Push ข้อความ, ดึงไฟล์รูป)
// token อยู่ใน LINE_CHANNEL_ACCESS_TOKEN เท่านั้น ห้ามส่งไปฝั่ง client

import { BadGatewayException, ServiceUnavailableException } from "../common/http-exception";
import type { ILineProfile } from "./interfaces/line-webhook.interface";

const API_BASE = "https://api.line.me/v2/bot";
const DATA_API_BASE = "https://api-data.line.me/v2/bot";

function accessToken(): string {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) throw new ServiceUnavailableException("LINE_CHANNEL_ACCESS_TOKEN is not configured");
  return token;
}

async function lineFetch(url: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: { Authorization: `Bearer ${accessToken()}`, ...init?.headers },
  });
  if (!res.ok) {
    let message = `LINE API ${res.status}`;
    try {
      const body = (await res.json()) as { message?: string };
      if (body.message) message = `${message}: ${body.message}`;
    } catch {
      // body ไม่ใช่ JSON
    }
    throw new BadGatewayException(message);
  }
  return res;
}

export const lineService = {
  async getProfile(userId: string): Promise<ILineProfile> {
    const res = await lineFetch(`${API_BASE}/profile/${encodeURIComponent(userId)}`);
    return (await res.json()) as ILineProfile;
  },

  /** retryKey กันส่งซ้ำถ้า request เดิมถูกยิงอีกรอบ */
  async pushText(userId: string, text: string, retryKey: string): Promise<void> {
    await lineFetch(`${API_BASE}/message/push`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Line-Retry-Key": retryKey },
      body: JSON.stringify({ to: userId, messages: [{ type: "text", text }] }),
    });
  },

  /** ไฟล์รูป/ไฟล์แนบที่ลูกค้าส่งมา — LINE เก็บไว้ชั่วคราวเท่านั้น */
  getMessageContent(lineMessageId: string): Promise<Response> {
    return lineFetch(`${DATA_API_BASE}/message/${encodeURIComponent(lineMessageId)}/content`);
  },

  stickerImageUrl(stickerId: string): string {
    return `https://stickershop.line-scdn.net/stickershop/v1/sticker/${encodeURIComponent(stickerId)}/android/sticker.png`;
  },
};
