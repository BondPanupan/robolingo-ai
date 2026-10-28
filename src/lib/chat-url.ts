// แชทที่เปิดอยู่เก็บไว้ใน URL (?chat=<lineUserId>) เพื่อให้คลิกขวา "เปิดในแท็บใหม่" หรือแชร์ลิงก์ไปที่คนนั้นได้ตรง ๆ

const CHAT_PARAM = "chat";

export function chatHref(lineUserId: string | null): string {
  return lineUserId ? `/?${CHAT_PARAM}=${encodeURIComponent(lineUserId)}` : "/";
}

/** อ่านจาก window.location — เรียกได้เฉพาะฝั่ง browser (ใน effect / event handler) */
export function readChatParam(): string | null {
  return new URLSearchParams(window.location.search).get(CHAT_PARAM);
}
