"use client";

// เสียงแจ้งเตือนเมื่อลูกค้าส่งข้อความใหม่ + สวิตช์เปิด/ปิด (จำไว้ในเบราว์เซอร์นี้ ใช้ร่วมกันทุกแท็บ/หน้าต่าง pop-out)

import { useCallback, useEffect, useRef, useState } from "react";
import type { Conversation } from "./chat-api";

const SOUND_URL = "/sounds/notification/chime-3.mp3";
const STORAGE_KEY = "robolingo:notification-sound";

let audio: HTMLAudioElement | null = null;

/** เล่นเสียงหนึ่งครั้ง — เบราว์เซอร์บล็อกเสียงจนกว่าผู้ใช้จะคลิกหน้าเว็บสักครั้ง ถ้าโดนบล็อกก็เงียบไป */
export function playNotificationSound() {
  audio ??= new Audio(SOUND_URL);
  audio.currentTime = 0;
  audio.play().catch(() => {
    // autoplay policy หรือไฟล์โหลดไม่ได้ — ไม่ใช่เรื่องที่ต้องแจ้งแอดมิน
  });
}

function readEnabled(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true; // storage ถูกปิด (private mode ฯลฯ) — ใช้ค่าเริ่มต้น เปิด
  }
}

/** สวิตช์เปิด/ปิดเสียง ค่าเริ่มต้น = เปิด */
export function useSoundEnabled(): [boolean, (enabled: boolean) => void] {
  const [enabled, setEnabledState] = useState(true);

  useEffect(() => {
    // อ่านหลัง mount: หน้า prerender ไม่มี localStorage
    setEnabledState(readEnabled());
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setEnabledState(readEnabled());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setEnabled = useCallback((next: boolean) => {
    setEnabledState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
    } catch {
      // จำไม่ได้ก็ใช้ได้แค่รอบนี้
    }
    // เปิดแล้วเล่นให้ฟังทันที: ได้ยินว่าเสียงเป็นแบบไหน และการคลิกนี้ปลดล็อก autoplay ของเบราว์เซอร์ด้วย
    if (next) playNotificationSound();
  }, []);

  return [enabled, setEnabled];
}

/**
 * เล่นเสียงเมื่อรายการแชตรอบใหม่มีข้อความขาเข้าที่ใหม่กว่าที่เคยเห็น (ครั้งเดียวต่อรอบ poll)
 * รอบแรกแค่จำสถานะไว้ ไม่เล่น — เปิดหน้าใหม่ไม่ควรมีเสียงจากข้อความเก่า
 */
export function useNewMessageSound(conversations: Conversation[] | undefined, enabled: boolean) {
  const seenRef = useRef<Map<string, string> | null>(null);

  useEffect(() => {
    if (!conversations) return;

    const seen = seenRef.current;
    let hasNewInbound = false;
    const next = new Map<string, string>();
    for (const c of conversations) {
      next.set(c.lineUserId, c.lastMessageAt);
      const before = seen?.get(c.lineUserId);
      if (seen && c.lastMessage?.direction === "inbound" && (!before || c.lastMessageAt > before)) {
        hasNewInbound = true;
      }
    }
    seenRef.current = next;

    if (hasNewInbound && enabled) playNotificationSound();
  }, [conversations, enabled]);
}
