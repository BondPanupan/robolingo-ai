import { BadRequestException } from "../../../common/http-exception";
import { isLineUserId } from "../../../common/line-user-id";
import { sniffImageType } from "../../../common/sniff-image-type";
import type { IImageFile } from "../../../databaseModules/media/interfaces/media.interface";

// LINE: รูปเต็ม ≤ 10MB, รูปพรีวิว ≤ 1MB — รูปเต็มจำกัดที่ 4MB เพราะ Vercel รับ body ได้ราว 4.5MB ต่อ request
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const MAX_PREVIEW_BYTES = 1024 * 1024;

/** body ของ POST /api/messages/image (multipart/form-data: userId, image, preview) */
export interface SendImageDto {
  userId: string;
  image: IImageFile;
  preview: IImageFile;
}

async function readImage(value: FormDataEntryValue | null, field: string, maxBytes: number): Promise<IImageFile> {
  if (!(value instanceof Blob) || value.size === 0) throw new BadRequestException(`${field} is required`);
  if (value.size > maxBytes) {
    throw new BadRequestException(`${field} is larger than ${Math.round(maxBytes / 1024 / 1024)}MB`);
  }
  const data = Buffer.from(await value.arrayBuffer());
  const contentType = sniffImageType(data);
  if (!contentType) throw new BadRequestException(`${field} must be a JPEG or PNG image`);
  return { contentType, data };
}

/** @throws BadRequestException */
export async function parseSendImageDto(form: FormData): Promise<SendImageDto> {
  const userId = form.get("userId");
  if (!isLineUserId(userId)) throw new BadRequestException("Invalid userId");

  return {
    userId,
    image: await readImage(form.get("image"), "image", MAX_IMAGE_BYTES),
    preview: await readImage(form.get("preview"), "preview", MAX_PREVIEW_BYTES),
  };
}
