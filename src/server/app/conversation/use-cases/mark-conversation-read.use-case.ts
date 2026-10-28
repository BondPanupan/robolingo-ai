import { BadRequestException } from "../../../common/http-exception";
import { isLineUserId } from "../../../common/line-user-id";
import { connectDb } from "../../../database/connect-db";
import { contactService } from "../../../databaseModules/contact/contact.service";
import { messageService } from "../../../databaseModules/message/message.service";
import { lineService } from "../../../line/line.service";

/**
 * POST /api/conversations/:id/read — แอดมินเปิดอ่านแชตแล้ว
 * รีเซ็ต unread ในระบบ และแจ้ง LINE ให้ลูกค้าเห็น "อ่านแล้ว" ใต้ข้อความที่ส่งมา
 */
export async function markConversationReadUseCase(lineUserId: string): Promise<void> {
  if (!isLineUserId(lineUserId)) throw new BadRequestException("Invalid userId");

  await connectDb();
  await contactService.resetUnread(lineUserId);

  const latest = await messageService.findLatestUnreadInbound(lineUserId);
  if (!latest?.markAsReadToken) return;

  try {
    await lineService.markAsRead(latest.markAsReadToken);
  } catch (error) {
    // LINE ปฏิเสธ (เช่น ปิดโหมด Chat ใน OA) — unread ในระบบรีเซ็ตแล้ว ไม่ต้องให้แอดมินเห็น error;
    // ไม่ตั้ง readAt เพื่อให้ครั้งถัดไปที่เปิดแชตลองแจ้งใหม่
    console.warn(`[line] markAsRead failed for ${lineUserId}:`, error instanceof Error ? error.message : error);
    return;
  }
  await messageService.markInboundReadUpTo(lineUserId, latest.createdAt, new Date());
}
