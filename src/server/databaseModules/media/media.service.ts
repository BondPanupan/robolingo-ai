import { randomUUID } from "node:crypto";
import { MediaModel } from "../../schemas/media.schema";
import type { ICreateMedia, IImageFile, IMediaVariant } from "./interfaces/media.interface";

/**
 * .lean() คืนฟิลด์ Buffer เป็น BSON Binary ไม่ใช่ Buffer — new Uint8Array(binary) ได้อาร์เรย์ว่าง
 * (เคยทำให้ /api/media ตอบ 200 แต่ 0 byte และรูปใน LINE ขึ้นไม่ได้)
 */
function toBuffer(value: unknown): Buffer {
  if (Buffer.isBuffer(value)) return value;
  if (value && typeof value === "object" && "buffer" in value && value.buffer instanceof Uint8Array) {
    return Buffer.from(value.buffer);
  }
  throw new Error("Unexpected binary field type");
}

/** query collection media — ไม่มี business logic (อยู่ใน app/<feature>/use-cases) */
export const mediaService = {
  /** คืน id สุ่มของไฟล์ที่เก็บ */
  async create({ original, preview }: ICreateMedia): Promise<string> {
    const _id = randomUUID();
    await MediaModel.create({
      _id,
      contentType: original.contentType,
      data: original.data,
      previewContentType: preview.contentType,
      preview: preview.data,
    });
    return _id;
  },

  async findFile(id: string, variant: IMediaVariant): Promise<IImageFile | null> {
    const fields = variant === "original" ? "contentType data" : "previewContentType preview";
    const doc = await MediaModel.findById(id).select(fields).lean().exec();
    if (!doc) return null;
    return variant === "original"
      ? ({ contentType: doc.contentType, data: toBuffer(doc.data) } as IImageFile)
      : ({ contentType: doc.previewContentType, data: toBuffer(doc.preview) } as IImageFile);
  },

  async delete(id: string): Promise<void> {
    await MediaModel.deleteOne({ _id: id }).exec();
  },
};
