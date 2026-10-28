// GET /api/messages?userId= — ประวัติแชต
// POST /api/messages { userId, text } — แอดมินตอบลูกค้า (Push API)

import type { NextRequest } from "next/server";
import type { MessagesResponse, SendMessageResponse } from "@/lib/chat-api";
import { parseSendMessageDto } from "@/server/app/message/dto/send-message.dto";
import { listMessagesUseCase } from "@/server/app/message/use-cases/list-messages.use-case";
import { sendMessageUseCase } from "@/server/app/message/use-cases/send-message.use-case";
import { jsonError, toErrorResponse } from "@/server/common/to-error-response";

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId") ?? "";
    const body: MessagesResponse = { messages: await listMessagesUseCase(userId) };
    return Response.json(body);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  try {
    const body: SendMessageResponse = { message: await sendMessageUseCase(parseSendMessageDto(input)) };
    return Response.json(body, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
