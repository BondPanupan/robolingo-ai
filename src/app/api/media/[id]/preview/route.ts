// GET /api/media/:id/preview — รูปย่อที่แอดมินส่ง (LINE previewImageUrl) เปิดสาธารณะ ดู proxy.ts

import { getMediaUseCase } from "@/server/app/media/use-cases/get-media.use-case";
import { toErrorResponse } from "@/server/common/to-error-response";

export async function GET(_request: Request, ctx: RouteContext<"/api/media/[id]/preview">) {
  try {
    const file = await getMediaUseCase((await ctx.params).id, "preview");
    return new Response(new Uint8Array(file.data), {
      headers: { "Content-Type": file.contentType, "Cache-Control": "public, max-age=31536000, immutable" },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
