// body ของ webhook จาก LINE (เฉพาะฟิลด์ที่ใช้) — https://developers.line.biz/en/reference/messaging-api/#webhook-event-objects

export interface ILineWebhookBody {
  destination: string;
  events: ILineWebhookEvent[];
}

export interface ILineEventBase {
  type: string;
  webhookEventId: string;
  timestamp: number;
  source?: { type: "user"; userId: string } | { type: "group" | "room"; userId?: string };
  deliveryContext?: { isRedelivery: boolean };
}

export type ILineMessage =
  | { id: string; type: "text"; text: string }
  | {
      id: string;
      type: "image";
      contentProvider: { type: "line" } | { type: "external"; originalContentUrl: string };
    }
  | { id: string; type: "sticker"; packageId: string; stickerId: string }
  | { id: string; type: "file"; fileName: string; fileSize: number }
  | { id: string; type: "location"; title?: string; address?: string }
  | { id: string; type: "video" | "audio" };

export interface ILineMessageEvent extends ILineEventBase {
  type: "message";
  // markAsReadToken: ส่งกลับไปที่ /v2/bot/chat/markAsRead ให้ลูกค้าเห็น "อ่านแล้ว" (ไม่มีวันหมดอายุ)
  message: ILineMessage & { markAsReadToken?: string };
}

export type ILineWebhookEvent = ILineMessageEvent | ILineEventBase;

export function isMessageEvent(event: ILineWebhookEvent): event is ILineMessageEvent {
  return event.type === "message" && "message" in event;
}

/** userId ของแชต 1:1 เท่านั้น — group/room ไม่ได้อยู่ในขอบเขตของ webchat นี้ */
export function directUserId(event: ILineWebhookEvent): string | null {
  return event.source?.type === "user" ? event.source.userId : null;
}

export interface ILineProfile {
  displayName: string;
  pictureUrl?: string;
}
