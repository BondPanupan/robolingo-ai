// แปลง error ใน route handler เป็น JSON { error } ที่ frontend อ่านได้ (ดู request() ใน lib/chat-api.ts)

import { HttpException } from "./http-exception";

export function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

export function toErrorResponse(error: unknown): Response {
  if (error instanceof HttpException) return jsonError(error.message, error.status);

  console.error(error);
  return jsonError("Internal server error", 500);
}
