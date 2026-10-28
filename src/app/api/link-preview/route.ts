// GET /api/link-preview?url= — Open Graph ของลิงก์ในข้อความ (อยู่หลัง Basic Auth เหมือน /api อื่น ๆ)

import type { NextRequest } from "next/server";
import { getLinkPreviewUseCase } from "@/server/app/link-preview/use-cases/get-link-preview.use-case";
import { toErrorResponse } from "@/server/common/to-error-response";

export async function GET(request: NextRequest) {
  try {
    const preview = await getLinkPreviewUseCase(request.nextUrl.searchParams.get("url") ?? "");
    // หน้าเว็บปลายทางไม่ค่อยเปลี่ยน og:* — ให้เบราว์เซอร์จำไว้ 1 ชม. ไม่ต้องถามซ้ำทุกครั้งที่เปิดแชต
    return Response.json(preview, { headers: { "Cache-Control": "private, max-age=3600" } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
