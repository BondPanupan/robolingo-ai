import { Schema, model, models, type HydratedDocument, type InferSchemaType, type Model } from "mongoose";
import {
  MESSAGE_DIRECTIONS,
  MESSAGE_TYPES,
} from "../databaseModules/message/interfaces/message.interface";

const LastMessageSchema = new Schema(
  {
    direction: { type: String, enum: MESSAGE_DIRECTIONS, required: true },
    type: { type: String, enum: MESSAGE_TYPES, required: true },
    text: { type: String, default: null },
  },
  { _id: false },
);

/**
 * ลูกค้า 1 คน = 1 document ใช้ LINE userId เป็น _id
 * แยกจาก messages เพราะข้อความของแชตหนึ่งไม่มีที่สิ้นสุด ฝังไว้ใน contact จะชนเพดาน 16MB
 */
export const ContactSchema = new Schema(
  {
    _id: { type: String, required: true },
    displayName: { type: String, required: true },
    pictureUrl: { type: String, default: null },
    lastMessageAt: { type: Date, default: null },
    lastMessage: { type: LastMessageSchema, default: null },
    unreadCount: { type: Number, default: 0, min: 0 },
    // ดึงชื่อ/รูปจาก LINE ใหม่วันละครั้งพอ ไม่ต้องยิงทุกข้อความ
    profileSyncedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);
ContactSchema.index({ lastMessageAt: -1 });

export type Contact = InferSchemaType<typeof ContactSchema>;
export type ContactDocument = HydratedDocument<Contact>;

// models ?? : กัน OverwriteModelError ตอน hot reload
export const ContactModel = (models.Contact as Model<Contact>) ?? model("Contact", ContactSchema);
