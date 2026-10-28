import type { ImageContentType } from "../../../common/sniff-image-type";

export interface IImageFile {
  contentType: ImageContentType;
  data: Buffer;
}

export interface ICreateMedia {
  original: IImageFile;
  preview: IImageFile;
}

/** ไฟล์ที่จะเสิร์ฟ: รูปเต็ม (LINE originalContentUrl) หรือรูปย่อ (previewImageUrl) */
export type IMediaVariant = "original" | "preview";
