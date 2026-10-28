// เชื่อม MongoDB ผ่าน Mongoose (MONGODB_URI)
// เก็บ connection ไว้บน globalThis: serverless function ที่ยังอุ่นอยู่และ hot reload ตอน dev จะได้ใช้ connection เดิม ไม่เปิดใหม่ทุก request

import mongoose from "mongoose";
import { ServiceUnavailableException } from "../common/http-exception";

const globalForDb = globalThis as typeof globalThis & {
  mongooseConnection?: Promise<typeof mongoose>;
};

export function connectDb(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) return Promise.reject(new ServiceUnavailableException("MONGODB_URI is not configured"));

  globalForDb.mongooseConnection ??= mongoose
    .connect(uri, { serverSelectionTimeoutMS: 5_000 })
    .catch((error: unknown) => {
      // ต่อไม่ติดรอบนี้ ให้ request ถัดไปลองใหม่ ไม่ค้าง promise ที่ fail ไว้ตลอด
      globalForDb.mongooseConnection = undefined;
      throw error;
    });

  return globalForDb.mongooseConnection;
}
