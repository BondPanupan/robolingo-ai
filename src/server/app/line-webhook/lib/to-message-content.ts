import type { Types } from "mongoose";
import type { IMessageContent } from "../../../databaseModules/message/interfaces/message.interface";
import type { ILineMessage } from "../../../line/interfaces/line-webhook.interface";
import { lineService } from "../../../line/line.service";

/** ข้อความจาก LINE → ฟิลด์ที่เก็บ; ประเภทที่ UI ยังไม่รองรับ (วิดีโอ เสียง ฯลฯ) เก็บเป็น "other" */
export function toMessageContent(messageId: Types.ObjectId, message: ILineMessage): IMessageContent {
  switch (message.type) {
    case "text":
      return { type: "text", text: message.text };
    case "image":
      return {
        type: "image",
        // รูปบน LINE ต้องใช้ token ถึงจะดึงได้ → ผ่าน route ของเราที่อยู่หลัง Basic Auth
        contentUrl:
          message.contentProvider.type === "external"
            ? message.contentProvider.originalContentUrl
            : `/api/messages/${messageId}/content`,
      };
    case "sticker":
      return { type: "sticker", contentUrl: lineService.stickerImageUrl(message.stickerId) };
    case "file":
      return { type: "file", text: message.fileName };
    case "location":
      return { type: "other", text: [message.title, message.address].filter(Boolean).join(" — ") || null };
    default:
      return { type: "other" };
  }
}
