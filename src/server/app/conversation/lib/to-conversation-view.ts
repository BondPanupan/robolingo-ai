import type { Conversation } from "@/lib/chat-api";
import type { ContactRecord } from "../../../databaseModules/contact/contact.service";

/** contact document → Conversation ที่ frontend ใช้ (lib/chat-api.ts) */
export function toConversationView(doc: ContactRecord): Conversation {
  return {
    lineUserId: doc._id,
    displayName: doc.displayName,
    pictureUrl: doc.pictureUrl ?? null,
    // ลูกค้าที่เพิ่งแอดเพื่อนยังไม่มีข้อความ ใช้เวลาที่แอดแทน
    lastMessageAt: (doc.lastMessageAt ?? doc.createdAt).toISOString(),
    unreadCount: doc.unreadCount,
    lastMessage: doc.lastMessage
      ? { direction: doc.lastMessage.direction, type: doc.lastMessage.type, text: doc.lastMessage.text ?? null }
      : null,
  };
}
