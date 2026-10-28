import { BadRequestException } from "../../../common/http-exception";
import { isLineUserId } from "../../../common/line-user-id";
import { connectDb } from "../../../database/connect-db";
import { contactService } from "../../../databaseModules/contact/contact.service";

/** POST /api/conversations/:id/read — แอดมินเปิดอ่านแชตแล้ว รีเซ็ต unread */
export async function markConversationReadUseCase(lineUserId: string): Promise<void> {
  if (!isLineUserId(lineUserId)) throw new BadRequestException("Invalid userId");

  await connectDb();
  await contactService.resetUnread(lineUserId);
}
