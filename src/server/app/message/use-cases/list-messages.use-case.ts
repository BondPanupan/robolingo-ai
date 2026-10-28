import type { Message } from "@/lib/chat-api";
import { BadRequestException } from "../../../common/http-exception";
import { isLineUserId } from "../../../common/line-user-id";
import { connectDb } from "../../../database/connect-db";
import { messageService } from "../../../databaseModules/message/message.service";
import { inferCustomerReadAt } from "../lib/infer-customer-read-at";
import { toMessageView } from "../lib/to-message-view";

const PAGE_SIZE = 500;

/** GET /api/messages?userId= — ประวัติแชตล่าสุด เรียงเก่า → ใหม่ พร้อมสถานะลูกค้าอ่านแล้วของข้อความขาออก */
export async function listMessagesUseCase(lineUserId: string): Promise<Message[]> {
  if (!isLineUserId(lineUserId)) throw new BadRequestException("Invalid userId");

  await connectDb();
  const messages = await messageService.findLatestByUser(lineUserId, PAGE_SIZE);
  const readAt = inferCustomerReadAt(messages);
  return messages.map((message) => toMessageView(message, readAt.get(String(message._id))));
}
