import type { Message } from "@/lib/chat-api";
import { BadRequestException } from "../../../common/http-exception";
import { isLineUserId } from "../../../common/line-user-id";
import { connectDb } from "../../../database/connect-db";
import { messageService } from "../../../databaseModules/message/message.service";
import { toMessageView } from "../lib/to-message-view";

const PAGE_SIZE = 500;

/** GET /api/messages?userId= — ประวัติแชตล่าสุด เรียงเก่า → ใหม่ */
export async function listMessagesUseCase(lineUserId: string): Promise<Message[]> {
  if (!isLineUserId(lineUserId)) throw new BadRequestException("Invalid userId");

  await connectDb();
  const messages = await messageService.findLatestByUser(lineUserId, PAGE_SIZE);
  return messages.map(toMessageView);
}
