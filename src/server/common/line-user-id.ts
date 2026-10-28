// LINE userId ของแชต 1:1 = "U" + hex 32 ตัว — ตรวจก่อนใช้เป็น key ใน DB หรือส่งต่อให้ LINE

export const LINE_USER_ID_PATTERN = /^U[0-9a-f]{32}$/;

export function isLineUserId(value: unknown): value is string {
  return typeof value === "string" && LINE_USER_ID_PATTERN.test(value);
}
