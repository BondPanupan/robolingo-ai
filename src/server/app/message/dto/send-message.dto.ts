import type { SendMessageRequest } from "@/lib/chat-api";
import { BadRequestException } from "../../../common/http-exception";
import { isLineUserId } from "../../../common/line-user-id";

export const MAX_TEXT_LENGTH = 5000;

/** body ของ POST /api/messages — ข้อความที่ trim แล้ว */
export type SendMessageDto = SendMessageRequest;

/**
 * ตรวจ body ก่อนส่งเข้า use-case — เช็ก type ด้วย กัน object แบบ { "$ne": null } หลุดเข้า query ของ MongoDB
 * @throws BadRequestException
 */
export function parseSendMessageDto(input: unknown): SendMessageDto {
  const { userId, text } = (input ?? {}) as Record<string, unknown>;

  if (!isLineUserId(userId)) throw new BadRequestException("Invalid userId");
  if (typeof text !== "string" || !text.trim()) throw new BadRequestException("Message text is required");
  if (text.length > MAX_TEXT_LENGTH) {
    throw new BadRequestException(`Message is longer than ${MAX_TEXT_LENGTH} characters`);
  }

  return { userId, text: text.trim() };
}
