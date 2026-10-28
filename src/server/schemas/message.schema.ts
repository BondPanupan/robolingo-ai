import { Schema, model, models, type HydratedDocument, type InferSchemaType, type Model } from "mongoose";
import {
  MESSAGE_DIRECTIONS,
  MESSAGE_TYPES,
} from "../databaseModules/message/interfaces/message.interface";

/** ข้อความ 1 รายการ ทั้งขาเข้า (webhook) และขาออก (แอดมินตอบผ่าน Push API) */
export const MessageSchema = new Schema(
  {
    lineUserId: { type: String, required: true, ref: "Contact" },
    direction: { type: String, enum: MESSAGE_DIRECTIONS, required: true },
    type: { type: String, enum: MESSAGE_TYPES, required: true },
    text: { type: String, maxlength: 5000 },
    contentUrl: String,
    lineMessageId: String,
    // ไม่ใส่ฟิลด์นี้เลยสำหรับข้อความขาออก — unique+sparse ข้ามแค่เอกสารที่ไม่มีฟิลด์ ถ้าใส่ null จะชนกันเอง
    webhookEventId: String,
    // เวลาจาก LINE (event.timestamp) ไม่ใช่เวลาที่ webhook มาถึง
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);
MessageSchema.index({ lineUserId: 1, createdAt: 1 });
MessageSchema.index({ webhookEventId: 1 }, { unique: true, sparse: true });

export type Message = InferSchemaType<typeof MessageSchema>;
export type MessageDocument = HydratedDocument<Message>;

export const MessageModel = (models.Message as Model<Message>) ?? model("Message", MessageSchema);
