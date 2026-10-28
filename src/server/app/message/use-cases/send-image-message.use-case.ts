import { randomUUID } from "node:crypto";
import type { Message } from "@/lib/chat-api";
import { NotFoundException } from "../../../common/http-exception";
import { connectDb } from "../../../database/connect-db";
import { contactService } from "../../../databaseModules/contact/contact.service";
import { mediaService } from "../../../databaseModules/media/media.service";
import { messageService } from "../../../databaseModules/message/message.service";
import { lineService } from "../../../line/line.service";
import type { SendImageDto } from "../dto/send-image.dto";
import { toMessageView } from "../lib/to-message-view";

/**
 * POST /api/messages/image — แอดมินส่งรูป (frontend ย่อรูปมาแล้ว)
 * เก็บไฟล์ → push รูปเป็น URL สาธารณะของเรา → บันทึกข้อความ; push ไม่ผ่านก็ลบไฟล์ทิ้ง
 * @param publicBaseUrl origin https ที่เซิร์ฟเวอร์ LINE เข้ามาดึงไฟล์ได้
 */
export async function sendImageMessageUseCase(
  { userId, image, preview }: SendImageDto,
  publicBaseUrl: string,
): Promise<Message> {
  await connectDb();
  if (!(await contactService.exists(userId))) throw new NotFoundException("Conversation not found");

  const mediaId = await mediaService.create({ original: image, preview });
  const contentUrl = `/api/media/${mediaId}`;
  try {
    await lineService.pushImage(
      userId,
      `${publicBaseUrl}${contentUrl}`,
      `${publicBaseUrl}${contentUrl}/preview`,
      randomUUID(),
    );
  } catch (error) {
    await mediaService.delete(mediaId);
    throw error;
  }

  const createdAt = new Date();
  const message = await messageService.createOutbound({ lineUserId: userId, type: "image", contentUrl, createdAt });
  await contactService.recordActivity(userId, {
    at: createdAt,
    lastMessage: { direction: "outbound", type: "image", text: null },
    unread: false,
  });
  return toMessageView(message);
}
