import { randomUUID } from "node:crypto";
import type { Message } from "@/lib/chat-api";
import { NotFoundException } from "../../../common/http-exception";
import { connectDb } from "../../../database/connect-db";
import { contactService } from "../../../databaseModules/contact/contact.service";
import { messageService } from "../../../databaseModules/message/message.service";
import { lineService } from "../../../line/line.service";
import type { SendMessageDto } from "../dto/send-message.dto";
import { toMessageView } from "../lib/to-message-view";

/**
 * POST /api/messages — แอดมินตอบลูกค้าผ่าน Push API
 * Push ไปที่ LINE ก่อน สำเร็จแล้วค่อยบันทึก — ไม่มีข้อความในประวัติที่ลูกค้าไม่ได้รับ
 */
export async function sendMessageUseCase({ userId, text }: SendMessageDto): Promise<Message> {
  await connectDb();
  if (!(await contactService.exists(userId))) throw new NotFoundException("Conversation not found");

  await lineService.pushText(userId, text, randomUUID());

  const createdAt = new Date();
  const message = await messageService.createOutbound({ lineUserId: userId, text, createdAt });
  await contactService.recordActivity(userId, {
    at: createdAt,
    lastMessage: { direction: "outbound", type: "text", text },
    unread: false,
  });
  return toMessageView(message);
}
