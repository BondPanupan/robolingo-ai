import type { UpdateQuery } from "mongoose";
import { ContactModel, type Contact } from "../../schemas/contact.schema";
import type { IContactActivity, IContactProfile } from "./interfaces/contact.interface";

const FALLBACK_DISPLAY_NAME = "LINE user";

export type ContactRecord = Contact & { _id: string; createdAt: Date };

/** query collection contacts — ไม่มี business logic (อยู่ใน app/<feature>/use-cases) */
export const contactService = {
  /** เรียงจากข้อความล่าสุด; คนที่แอดเพื่อนแต่ยังไม่คุย (lastMessageAt = null) ต่อท้ายตามเวลาที่แอด */
  findAllByRecentActivity(limit: number): Promise<ContactRecord[]> {
    return ContactModel.find().sort({ lastMessageAt: -1, createdAt: -1 }).limit(limit).lean<ContactRecord[]>().exec();
  },

  async exists(lineUserId: string): Promise<boolean> {
    return (await ContactModel.exists({ _id: lineUserId })) !== null;
  },

  /** null = ยังไม่มี contact หรือยังไม่เคยดึงโปรไฟล์สำเร็จ */
  async findProfileSyncedAt(lineUserId: string): Promise<Date | null> {
    const doc = await ContactModel.findById(lineUserId).select("profileSyncedAt").lean().exec();
    return doc?.profileSyncedAt ?? null;
  },

  /** สร้างถ้ายังไม่มี — ไม่มีโปรไฟล์ (ดึงจาก LINE ไม่ได้) ก็ยังสร้างด้วยชื่อสำรอง */
  async upsert(lineUserId: string, profile: IContactProfile | null, activity?: IContactActivity): Promise<void> {
    const $set: Record<string, unknown> = {};
    const $setOnInsert: Record<string, unknown> = {};
    if (profile) Object.assign($set, profile, { profileSyncedAt: new Date() });
    else $setOnInsert.displayName = FALLBACK_DISPLAY_NAME;

    const update: UpdateQuery<Contact> = { $set, $setOnInsert };
    if (activity) {
      $set.lastMessage = activity.lastMessage;
      update.$max = { lastMessageAt: activity.at };
      if (activity.unread) update.$inc = { unreadCount: 1 };
    }

    await ContactModel.updateOne({ _id: lineUserId }, update, { upsert: true }).exec();
  },

  /** ข้อความขาออกของแอดมิน — contact ต้องมีอยู่แล้ว ไม่นับ unread */
  async recordActivity(lineUserId: string, activity: IContactActivity): Promise<void> {
    await ContactModel.updateOne(
      { _id: lineUserId },
      { $set: { lastMessage: activity.lastMessage }, $max: { lastMessageAt: activity.at } },
    ).exec();
  },

  async resetUnread(lineUserId: string): Promise<void> {
    await ContactModel.updateOne({ _id: lineUserId }, { $set: { unreadCount: 0 } }).exec();
  },
};
