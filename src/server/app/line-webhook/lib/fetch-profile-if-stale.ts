import type { IContactProfile } from "../../../databaseModules/contact/interfaces/contact.interface";
import { contactService } from "../../../databaseModules/contact/contact.service";
import { lineService } from "../../../line/line.service";

const PROFILE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * ดึงชื่อ/รูปจาก LINE เมื่อยังไม่มี contact หรือโปรไฟล์เก่ากว่า 1 วัน
 * null = ยังใหม่อยู่ หรือดึงไม่ได้ (เช่น ลูกค้าบล็อก OA) — webhook ยังบันทึกข้อความต่อได้
 */
export async function fetchProfileIfStale(lineUserId: string): Promise<IContactProfile | null> {
  const syncedAt = await contactService.findProfileSyncedAt(lineUserId);
  if (syncedAt && Date.now() - syncedAt.getTime() < PROFILE_TTL_MS) return null;

  try {
    const profile = await lineService.getProfile(lineUserId);
    return { displayName: profile.displayName, pictureUrl: profile.pictureUrl ?? null };
  } catch (error) {
    console.warn(`[line] profile fetch failed for ${lineUserId}:`, error instanceof Error ? error.message : error);
    return null;
  }
}
