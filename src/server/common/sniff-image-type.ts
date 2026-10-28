// ชนิดไฟล์รูปดูจาก byte แรกของไฟล์ ไม่เชื่อ Content-Type ที่ client ส่งมา — LINE รับแค่ JPEG/PNG
// (เช่น SVG ที่แอบตั้ง type เป็น image/jpeg จะถูกปฏิเสธ ไม่ได้ไปเสิร์ฟจาก route สาธารณะ)

export type ImageContentType = "image/jpeg" | "image/png";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

export function sniffImageType(bytes: Uint8Array): ImageContentType | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (PNG_SIGNATURE.every((b, i) => bytes[i] === b)) return "image/png";
  return null;
}
