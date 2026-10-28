import { Types } from "mongoose";
import { MessageModel, type Message } from "../../schemas/message.schema";
import type { ICreateInboundMessage, ICreateOutboundMessage } from "./interfaces/message.interface";

export type MessageRecord = Message & { _id: Types.ObjectId };

function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11000;
}

/** query collection messages — ไม่มี business logic (อยู่ใน app/<feature>/use-cases) */
export const messageService = {
  /** ข้อความล่าสุด `limit` รายการ เรียงเก่า → ใหม่ */
  async findLatestByUser(lineUserId: string, limit: number): Promise<MessageRecord[]> {
    const docs = await MessageModel.find({ lineUserId })
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .lean<MessageRecord[]>()
      .exec();
    return docs.reverse();
  },

  findById(id: string): Promise<MessageRecord | null> {
    if (!Types.ObjectId.isValid(id)) return Promise.resolve(null);
    return MessageModel.findById(id).lean<MessageRecord>().exec();
  },

  /**
   * false = webhookEventId นี้บันทึกไปแล้ว (LINE ส่ง event เดิมซ้ำ) — ผู้เรียกต้องไม่นับ unread ซ้ำ
   * รับ _id จากผู้เรียก เพราะ URL ของรูปต้องรู้ id ก่อนบันทึก
   */
  async createInbound(_id: Types.ObjectId, input: ICreateInboundMessage): Promise<boolean> {
    try {
      await MessageModel.create({ _id, direction: "inbound", ...input });
      return true;
    } catch (error) {
      if (isDuplicateKeyError(error)) return false;
      throw error;
    }
  },

  async createOutbound(input: ICreateOutboundMessage): Promise<MessageRecord> {
    const doc = await MessageModel.create({ direction: "outbound", type: "text", ...input });
    return doc.toObject() as MessageRecord;
  },
};
