import type { Message } from "@/lib/chat-api";
import type { MessageRecord } from "../../../databaseModules/message/message.service";

/**
 * message document → Message ที่ frontend ใช้ (lib/chat-api.ts)
 * @param customerReadAt ข้อความขาออกเท่านั้น: เวลาที่ถือว่าลูกค้าอ่านแล้ว (ดู inferCustomerReadAt)
 */
export function toMessageView(doc: MessageRecord, customerReadAt?: Date): Message {
  return {
    id: String(doc._id),
    lineUserId: doc.lineUserId,
    direction: doc.direction,
    type: doc.type,
    text: doc.text ?? null,
    contentUrl: doc.contentUrl ?? null,
    createdAt: doc.createdAt.toISOString(),
    readAt: doc.direction === "outbound" ? (customerReadAt?.toISOString() ?? null) : null,
  };
}
