import type { Message } from "@/lib/chat-api";
import type { MessageRecord } from "../../../databaseModules/message/message.service";

/** message document → Message ที่ frontend ใช้ (lib/chat-api.ts) */
export function toMessageView(doc: MessageRecord): Message {
  return {
    id: String(doc._id),
    lineUserId: doc.lineUserId,
    direction: doc.direction,
    type: doc.type,
    text: doc.text ?? null,
    contentUrl: doc.contentUrl ?? null,
    createdAt: doc.createdAt.toISOString(),
  };
}
