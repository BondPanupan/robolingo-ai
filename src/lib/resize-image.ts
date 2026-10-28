// ย่อรูปในเบราว์เซอร์ก่อนอัปโหลด — รูปจากมือถือ 5–15MB ย่อเหลือหลักร้อย KB ส่งเร็ว ไม่ชนเพดาน body ~4.5MB ของ Vercel
// ได้ 2 ไฟล์ตามที่ LINE ต้องการ: รูปเต็ม (originalContentUrl) และรูปย่อ (previewImageUrl ≤ 1MB)

export const MAX_EDGE_PX = 2048;
export const PREVIEW_EDGE_PX = 480;
const MAX_IMAGE_BYTES = 3.8 * 1024 * 1024; // ต่ำกว่าเพดาน 4MB ของ server เล็กน้อย
const QUALITY_STEPS = [0.85, 0.75, 0.6, 0.45];

export interface ResizedImage {
  image: Blob;
  preview: Blob;
  width: number;
  height: number;
}

/** ขนาดใหม่ที่ด้านยาวไม่เกิน maxEdge โดยคงสัดส่วน — รูปเล็กอยู่แล้วไม่ขยาย */
export function fitWithin(width: number, height: number, maxEdge: number): { width: number; height: number } {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

function toJpeg(source: ImageBitmap, maxEdge: number, quality: number): Promise<Blob> {
  const { width, height } = fitWithin(source.width, source.height, maxEdge);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("Canvas is not supported"));
  // JPEG ไม่มีพื้นโปร่งใส — PNG โปร่งใสจะกลายเป็นพื้นดำถ้าไม่ลงพื้นขาวก่อน
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, width, height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not encode image"))), "image/jpeg", quality),
  );
}

/**
 * @throws Error ถ้าเบราว์เซอร์เปิดไฟล์นี้ไม่ได้ (เช่น HEIC บน Chrome) หรือย่อแล้วยังใหญ่เกิน
 */
export async function resizeImage(file: Blob): Promise<ResizedImage> {
  // from-image: หมุนตาม EXIF — รูปแนวตั้งจากมือถือไม่กลายเป็นแนวนอน
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    let image: Blob | null = null;
    for (const quality of QUALITY_STEPS) {
      image = await toJpeg(bitmap, MAX_EDGE_PX, quality);
      if (image.size <= MAX_IMAGE_BYTES) break;
    }
    if (!image || image.size > MAX_IMAGE_BYTES) throw new Error("Image is too large after resizing");

    const preview = await toJpeg(bitmap, PREVIEW_EDGE_PX, 0.7);
    return { image, preview, ...fitWithin(bitmap.width, bitmap.height, MAX_EDGE_PX) };
  } finally {
    bitmap.close();
  }
}
