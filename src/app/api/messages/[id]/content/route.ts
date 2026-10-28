// GET /api/messages/:id/content — ส่งต่อไฟล์รูปจาก LINE ให้เบราว์เซอร์ (อยู่หลัง Basic Auth เหมือน /api อื่น ๆ)

import { getMessageImageUseCase } from "@/server/app/message/use-cases/get-message-image.use-case";
import { toErrorResponse } from "@/server/common/to-error-response";

export async function GET(_request: Request, ctx: RouteContext<"/api/messages/[id]/content">) {
  try {
    const upstream = await getMessageImageUseCase((await ctx.params).id);
    return new Response(upstream.body, {
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "application/octet-stream",
        // ไฟล์ของข้อความหนึ่งไม่เปลี่ยน; private เพราะอยู่หลัง Basic Auth
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
