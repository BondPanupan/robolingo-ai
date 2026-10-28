import type { LastMessage, MessageType } from "./chat-api";

const LOCALE = "th-TH";

const timeFmt = new Intl.DateTimeFormat(LOCALE, { hour: "2-digit", minute: "2-digit" });
const shortDateFmt = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short" });
const longDateFmt = new Intl.DateTimeFormat(LOCALE, {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function daysAgo(d: Date, now: Date) {
  return Math.round((startOfDay(now) - startOfDay(d)) / 86_400_000);
}

export function formatTime(iso: string) {
  return timeFmt.format(new Date(iso));
}

/** Compact stamp for the conversation list: time today, "เมื่อวาน", else date. */
export function formatListStamp(iso: string, now = new Date()) {
  const d = new Date(iso);
  const diff = daysAgo(d, now);
  if (diff === 0) return timeFmt.format(d);
  if (diff === 1) return "เมื่อวาน";
  return shortDateFmt.format(d);
}

/** Divider label between days in the chat history. */
export function formatDayDivider(iso: string, now = new Date()) {
  const d = new Date(iso);
  const diff = daysAgo(d, now);
  if (diff === 0) return "วันนี้";
  if (diff === 1) return "เมื่อวาน";
  return longDateFmt.format(d);
}

export function dayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export const TYPE_LABEL: Record<Exclude<MessageType, "text">, string> = {
  image: "[รูปภาพ]",
  sticker: "[สติกเกอร์]",
  file: "[ไฟล์]",
  other: "[ข้อความที่ไม่รองรับ]",
};

export function previewText(last: LastMessage | null) {
  if (!last) return "ยังไม่มีข้อความ";
  const body = last.type === "text" ? (last.text ?? "") : TYPE_LABEL[last.type];
  return last.direction === "outbound" ? `คุณ: ${body}` : body;
}
