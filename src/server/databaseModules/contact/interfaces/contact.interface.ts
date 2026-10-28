import type { IMessageDirection, IMessageType } from "../../message/interfaces/message.interface";

/** สำเนาข้อความล่าสุดที่เก็บใน contact — หน้า Inbox โหลดรายชื่อได้ใน query เดียว */
export interface ILastMessage {
  direction: IMessageDirection;
  type: IMessageType;
  text: string | null;
}

export interface IContactProfile {
  displayName: string;
  pictureUrl: string | null;
}

/** มีข้อความใหม่ในแชต — อัปเดตข้อความล่าสุด และนับ unread ถ้าเป็นข้อความขาเข้า */
export interface IContactActivity {
  at: Date;
  lastMessage: ILastMessage;
  unread: boolean;
}
