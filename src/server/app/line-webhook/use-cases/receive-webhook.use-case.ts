import { Types } from "mongoose";
import {
  BadRequestException,
  ServiceUnavailableException,
  UnauthorizedException,
} from "../../../common/http-exception";
import { connectDb } from "../../../database/connect-db";
import { contactService } from "../../../databaseModules/contact/contact.service";
import { messageService } from "../../../databaseModules/message/message.service";
import {
  directUserId,
  isMessageEvent,
  type ILineMessageEvent,
  type ILineWebhookBody,
} from "../../../line/interfaces/line-webhook.interface";
import { verifyLineSignature } from "../../../line/line-signature";
import { fetchProfileIfStale } from "../lib/fetch-profile-if-stale";
import { toMessageContent } from "../lib/to-message-content";

async function saveInboundMessage(event: ILineMessageEvent, lineUserId: string): Promise<void> {
  const _id = new Types.ObjectId();
  const content = toMessageContent(_id, event.message);
  const createdAt = new Date(event.timestamp);

  const created = await messageService.createInbound(_id, {
    lineUserId,
    ...content,
    lineMessageId: event.message.id,
    webhookEventId: event.webhookEventId,
    markAsReadToken: event.message.markAsReadToken,
    createdAt,
  });
  // LINE ส่ง event เดิมซ้ำ (redelivery) — บันทึกไปแล้ว ไม่นับ unread ซ้ำ
  if (!created) return;

  await contactService.upsert(lineUserId, await fetchProfileIfStale(lineUserId), {
    at: createdAt,
    lastMessage: { direction: "inbound", type: content.type, text: content.text ?? null },
    unread: true,
  });
}

/**
 * POST /api/line/webhook — route นี้ไม่อยู่หลัง Basic Auth จึงต้องตรวจ x-line-signature ก่อนเชื่อ body ทุกครั้ง
 * ประมวลผล event ตามลำดับที่ LINE ส่งมา; รองรับ message และ follow ที่เหลือข้ามไป
 */
export async function receiveWebhookUseCase(rawBody: string, signature: string | null): Promise<void> {
  const secret = process.env.LINE_CHANNEL_SECRET;
  if (!secret) throw new ServiceUnavailableException("LINE_CHANNEL_SECRET is not configured");
  if (!verifyLineSignature(rawBody, signature, secret)) throw new UnauthorizedException("Invalid signature");

  let body: ILineWebhookBody;
  try {
    body = JSON.parse(rawBody) as ILineWebhookBody;
  } catch {
    throw new BadRequestException("Invalid JSON");
  }

  const events = Array.isArray(body.events) ? body.events : [];
  if (events.length === 0) return; // ปุ่ม Verify ใน LINE Console ส่ง events ว่าง — ไม่ต้องแตะ DB

  await connectDb();
  for (const event of events) {
    const lineUserId = directUserId(event);
    if (!lineUserId) continue;

    if (isMessageEvent(event)) await saveInboundMessage(event, lineUserId);
    else if (event.type === "follow") await contactService.upsert(lineUserId, await fetchProfileIfStale(lineUserId));
  }
}
