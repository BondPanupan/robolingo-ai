// POST /api/line/webhook — LINE ส่ง event มาที่นี่ (ตั้ง URL นี้ใน LINE Developers Console)
// controller: อ่าน body ดิบ (ต้องใช้ตรวจลายเซ็น) แล้วส่งต่อให้ use-case

import { receiveWebhookUseCase } from "@/server/app/line-webhook/use-cases/receive-webhook.use-case";
import { toErrorResponse } from "@/server/common/to-error-response";

export async function POST(request: Request) {
  try {
    await receiveWebhookUseCase(await request.text(), request.headers.get("x-line-signature"));
    return new Response(null, { status: 200 });
  } catch (error) {
    // ตอบ non-2xx ให้ LINE ส่งซ้ำได้ (ถ้าเปิด redelivery) — webhookEventId กันบันทึกซ้ำอยู่แล้ว
    return toErrorResponse(error);
  }
}
