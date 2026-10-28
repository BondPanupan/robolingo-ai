import { Schema, model, models, type HydratedDocument, type InferSchemaType, type Model } from "mongoose";

/**
 * ไฟล์รูปที่แอดมินส่งผ่าน webchat — LINE รับแค่ URL HTTPS ของรูป ต้องมีที่ให้ LINE มาดึงไฟล์เอง
 * เก็บใน MongoDB ตรง ๆ: frontend ย่อรูปแล้ว (≤ 4MB) ไม่ชนเพดาน 16MB ของเอกสาร, ใช้ได้ทั้ง Docker และ Vercel ไม่ต้องมี storage แยก
 * _id = UUID สุ่ม เพราะ route ที่เสิร์ฟไฟล์เปิดสาธารณะ (LINE ส่งรหัสผ่านไม่ได้) — เดา URL ไม่ได้
 */
export const MediaSchema = new Schema(
  {
    _id: { type: String, required: true },
    contentType: { type: String, required: true },
    data: { type: Buffer, required: true },
    previewContentType: { type: String, required: true },
    preview: { type: Buffer, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

export type Media = InferSchemaType<typeof MediaSchema>;
export type MediaDocument = HydratedDocument<Media>;

export const MediaModel = (models.Media as Model<Media>) ?? model("Media", MediaSchema);
