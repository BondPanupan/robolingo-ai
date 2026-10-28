// GET /api/conversations — รายชื่อแชตเรียงจากข้อความล่าสุด

import { connection } from "next/server";
import type { ConversationsResponse } from "@/lib/chat-api";
import { listConversationsUseCase } from "@/server/app/conversation/use-cases/list-conversations.use-case";
import { toErrorResponse } from "@/server/common/to-error-response";

export async function GET() {
  // ไม่ได้อ่าน request เลย — บอก Next ว่าต้องรันตอนมี request จริง ไม่ prerender ตอน build
  await connection();
  try {
    const body: ConversationsResponse = { conversations: await listConversationsUseCase() };
    return Response.json(body);
  } catch (error) {
    return toErrorResponse(error);
  }
}
