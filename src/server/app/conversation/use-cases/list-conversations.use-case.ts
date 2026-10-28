import type { Conversation } from "@/lib/chat-api";
import { connectDb } from "../../../database/connect-db";
import { contactService } from "../../../databaseModules/contact/contact.service";
import { toConversationView } from "../lib/to-conversation-view";

const PAGE_SIZE = 500;

/** GET /api/conversations — รายชื่อแชตเรียงจากข้อความล่าสุด */
export async function listConversationsUseCase(): Promise<Conversation[]> {
  await connectDb();
  const contacts = await contactService.findAllByRecentActivity(PAGE_SIZE);
  return contacts.map(toConversationView);
}
