// ค่าคงที่ config ฝั่ง client ที่ใช้ร่วมกันหลายจุด

/** true = ใช้ backend จำลองในเบราว์เซอร์ (lib/mock-chat.ts) แทน /api จริง — ใช้ตอนพัฒนา UI ก่อนมี backend */
export const USE_MOCK_API = process.env.NEXT_PUBLIC_MOCK_API === "1";
