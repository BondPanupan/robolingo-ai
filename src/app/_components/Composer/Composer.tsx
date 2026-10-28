"use client";

import { useState } from "react";
import styles from "./Composer.module.css";

const MAX_LENGTH = 5000; // LINE text message limit

interface ComposerProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function Composer({ onSend, disabled }: ComposerProps) {
  const [text, setText] = useState("");
  const canSend = !disabled && text.trim().length > 0;

  const submit = () => {
    if (!canSend) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <form
      className={styles.composer}
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className={styles.box}>
        <div className={styles.tabs}>
          <span className={styles.tab}>ตอบกลับ</span>
          <span className={styles.via}>
            ผ่าน <span className={styles.channel}>LINE</span>
          </span>
        </div>
        <textarea
          className={styles.input}
          rows={2}
          value={text}
          maxLength={MAX_LENGTH}
          placeholder="พิมพ์ข้อความ…"
          aria-label="ข้อความ"
          disabled={disabled}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            // isComposing: don't send while a Thai/Japanese IME is still composing.
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <div className={styles.toolbar}>
          <span className={styles.hint}>Enter ส่ง · Shift+Enter ขึ้นบรรทัดใหม่</span>
          <button className={styles.send} type="submit" disabled={!canSend}>
            ส่ง
          </button>
        </div>
      </div>
    </form>
  );
}
