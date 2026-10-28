// รัน `next <command>` หลังโหลด .env.local / .env เข้า process.env ก่อน — Next เปิดพอร์ตก่อนอ่านไฟล์ .env
// จึงตั้ง PORT ในไฟล์ไม่ได้ถ้ารัน next ตรง ๆ (ใช้ `node --env-file` ไม่ได้ เพราะ next dev ส่ง flag ต่อผ่าน NODE_OPTIONS แล้ว Node ปฏิเสธ)
// ลำดับความสำคัญเหมือน Next: ค่าใน shell > .env.local > .env

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";

// loadEnvFile ไม่ทับตัวแปรที่มีอยู่แล้ว → โหลดไฟล์ที่สำคัญกว่าก่อน
for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) process.loadEnvFile(file);
}

const nextBin = createRequire(import.meta.url).resolve("next/dist/bin/next");
const child = spawn(process.execPath, [nextBin, ...process.argv.slice(2)], { stdio: "inherit" });

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}
child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
