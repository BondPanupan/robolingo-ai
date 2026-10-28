// GET /api/media/:id — รูปเต็มที่แอดมินส่ง (LINE originalContentUrl) เปิดสาธารณะ ดู proxy.ts

import { getMediaUseCase } from "@/server/app/media/use-cases/get-media.use-case";
import { toErrorResponse } from "@/server/common/to-error-response";

export async function GET(_request: Request, ctx: RouteContext<"/api/media/[id]">) {
  try {
    const file = await getMediaUseCase((await ctx.params).id, "original");
    return new Response(new Uint8Array(file.data), {
      // ไฟล์ของ id หนึ่งไม่เปลี่ยน — ให้ CDN/LINE cache ได้นาน
      headers: { "Content-Type": file.contentType, "Cache-Control": "public, max-age=31536000, immutable" },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
