import { NotFoundException } from "../../../common/http-exception";
import { connectDb } from "../../../database/connect-db";
import type { IImageFile, IMediaVariant } from "../../../databaseModules/media/interfaces/media.interface";
import { mediaService } from "../../../databaseModules/media/media.service";

const MEDIA_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/**
 * GET /api/media/:id และ /api/media/:id/preview — รูปที่แอดมินส่ง
 * เปิดสาธารณะ (ไม่อยู่หลัง Basic Auth) เพราะเซิร์ฟเวอร์ LINE ต้องดึงไฟล์นี้ไปแสดงในแชตของลูกค้า
 */
export async function getMediaUseCase(id: string, variant: IMediaVariant): Promise<IImageFile> {
  if (!MEDIA_ID_PATTERN.test(id)) throw new NotFoundException("Media not found");

  await connectDb();
  const file = await mediaService.findFile(id, variant);
  if (!file) throw new NotFoundException("Media not found");
  return file;
}
