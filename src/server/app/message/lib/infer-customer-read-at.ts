import type { MessageRecord } from "../../../databaseModules/message/message.service";

/**
 * เวลาที่ถือว่าลูกค้าอ่านข้อความขาออกแต่ละข้อความแล้ว — key = id ของข้อความ
 *
 * LINE Messaging API ไม่มี event แจ้งตอนลูกค้าอ่านข้อความของ OA จึงอนุมานจากพฤติกรรม:
 * ลูกค้าพิมพ์ตอบได้ต้องเปิดห้องแชต และการเปิดห้องแชตทำให้ทุกข้อความในห้องเป็น "อ่านแล้ว"
 * → ข้อความขาออกที่มีข้อความขาเข้าตามหลัง = อ่านแล้ว ณ เวลาของข้อความขาเข้าแรกที่ตามมา
 * ข้อความหลังจากนั้นยังไม่รู้ (ลูกค้าอาจอ่านแล้วแต่ไม่ได้ตอบ) — ไม่ใส่ค่า ไม่ได้แปลว่า "ยังไม่อ่าน"
 *
 * @param messages เรียงเก่า → ใหม่
 */
export function inferCustomerReadAt(messages: MessageRecord[]): Map<string, Date> {
  const readAt = new Map<string, Date>();
  let nextInboundAt: Date | null = null;

  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message.direction === "inbound") nextInboundAt = message.createdAt;
    else if (nextInboundAt) readAt.set(String(message._id), nextInboundAt);
  }
  return readAt;
}
