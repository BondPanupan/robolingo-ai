import { NotFoundException } from "../../../common/http-exception";
import { connectDb } from "../../../database/connect-db";
import { messageService } from "../../../databaseModules/message/message.service";
import { lineService } from "../../../line/line.service";

/**
 * GET /api/messages/:id/content — ไฟล์รูปที่ลูกค้าส่งมา ดึงจาก LINE (ต้องใช้ token เบราว์เซอร์จึงดึงตรงไม่ได้)
 * รูปจาก URL ภายนอก (contentProvider external) เก็บ URL ไว้ตรง ๆ ไม่ผ่าน route นี้
 */
export async function getMessageImageUseCase(messageId: string): Promise<Response> {
  await connectDb();
  const message = await messageService.findById(messageId);
  if (message?.type !== "image" || !message.lineMessageId || !message.contentUrl?.startsWith("/api/")) {
    throw new NotFoundException("Image not found");
  }

  return lineService.getMessageContent(message.lineMessageId);
}
