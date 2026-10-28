// POST /api/messages/image (multipart/form-data: userId, image, preview) — แอดมินส่งรูปให้ลูกค้า

import type { SendMessageResponse } from "@/lib/chat-api";
import { parseSendImageDto } from "@/server/app/message/dto/send-image.dto";
import { sendImageMessageUseCase } from "@/server/app/message/use-cases/send-image-message.use-case";
import { resolvePublicBaseUrl } from "@/server/common/public-base-url";
import { jsonError, toErrorResponse } from "@/server/common/to-error-response";

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("Expected multipart/form-data", 400);
  }

  try {
    const dto = await parseSendImageDto(form);
    const body: SendMessageResponse = { message: await sendImageMessageUseCase(dto, resolvePublicBaseUrl(request)) };
    return Response.json(body, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
