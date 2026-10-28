// แชทที่เปิดอยู่เก็บไว้ใน URL (?chat=<lineUserId>) เพื่อให้คลิกขวา "เปิดในแท็บใหม่" หรือแชร์ลิงก์ไปที่คนนั้นได้ตรง ๆ
// ?view=popout = หน้าต่างแยกที่มีแค่ห้องแชทของคนนั้น (เปิดจาก openChatPopout)

const CHAT_PARAM = "chat";
const VIEW_PARAM = "view";
const POPOUT_VIEW = "popout";
const POPOUT_FEATURES = "popup,width=440,height=720";

export function chatHref(lineUserId: string | null): string {
  return lineUserId ? `/?${CHAT_PARAM}=${encodeURIComponent(lineUserId)}` : "/";
}

export function popoutHref(lineUserId: string): string {
  return `${chatHref(lineUserId)}&${VIEW_PARAM}=${POPOUT_VIEW}`;
}

/** อ่านจาก window.location — เรียกได้เฉพาะฝั่ง browser (ใน effect / event handler) */
export function readChatParam(): string | null {
  return new URLSearchParams(window.location.search).get(CHAT_PARAM);
}

export function readIsPopout(): boolean {
  return new URLSearchParams(window.location.search).get(VIEW_PARAM) === POPOUT_VIEW;
}

/**
 * เปิดแชทของคนนั้นในหน้าต่างเล็กแยก — ตั้งชื่อหน้าต่างตาม user ทำให้กดซ้ำแล้วไปโฟกัสหน้าต่างเดิมแทนการเปิดใหม่
 * ถ้า browser บล็อก popup จะ fallback เป็นแท็บใหม่
 */
export function openChatPopout(lineUserId: string): void {
  const href = popoutHref(lineUserId);
  const win = window.open(href, `chat-${lineUserId}`, POPOUT_FEATURES) ?? window.open(href, "_blank");
  win?.focus();
}
