import { NextResponse, type NextRequest } from "next/server";
import { getBasicAuthCredentials, isAuthorized } from "@/server/auth/basic-auth";

// ทั้งหน้าแอดมินและ /api ของแอดมินอยู่หลัง Basic Auth — URL เป็น public ใครก็เข้ามาตอบแทนร้านได้ถ้าไม่ล็อก
export function proxy(request: NextRequest) {
  const credentials = getBasicAuthCredentials();

  if (!credentials) {
    // dev ไม่ตั้งก็ใช้ได้; production ต้องตั้งเสมอ ห้ามเปิดโล่งเพราะลืมใส่ env
    if (process.env.NODE_ENV !== "production") return NextResponse.next();
    return new NextResponse("Basic Auth is not configured", { status: 503 });
  }

  if (isAuthorized(request.headers.get("authorization"), credentials)) {
    return NextResponse.next();
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="LINE OA Webchat", charset="UTF-8"' },
  });
}

export const config = {
  matcher: [
    /*
     * ทุก path ยกเว้น:
     * - api/line/webhook: LINE ส่ง user/password ไม่ได้ — route นั้นป้องกันด้วย x-line-signature แทน
     * - api/media/: รูปที่แอดมินส่ง เซิร์ฟเวอร์ LINE ต้องดึงไปแสดงให้ลูกค้า — id เป็น UUID สุ่ม เดาไม่ได้
     * - _next/static, _next/image, favicon.ico: asset ของ Next
     */
    "/((?!api/line/webhook|api/media/|_next/static|_next/image|favicon.ico).*)",
  ],
};
