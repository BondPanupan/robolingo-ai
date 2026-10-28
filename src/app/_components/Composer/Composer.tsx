"use client";

import { useRef, useState } from "react";
import styles from "./Composer.module.css";

const MAX_LENGTH = 5000; // LINE text message limit
const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif";

/** รูปที่พักไว้ก่อนส่ง — url เป็น object URL ของไฟล์ต้นฉบับ ใช้แสดงตัวอย่าง */
export interface Attachment {
  id: string;
  file: File;
  url: string;
}

interface ComposerProps {
  /** กดส่ง/Enter — text ว่างได้ถ้ามีรูปแนบ (ผู้ส่งต่อส่งรูปก่อนแล้วข้อความ) */
  onSend: (text: string) => void;
  /** รูปจากปุ่มหรือวางจาก clipboard → พักไว้ในแถบรูป; ไม่ส่ง = ไม่มีปุ่มแนบรูป (ลากวางจัดการที่ ChatPanel) */
  onPickImages?: (files: File[]) => void;
  attachments?: Attachment[];
  onRemoveAttachment?: (id: string) => void;
  /** กำลังย่อ/อัปโหลดรูป — ปิดปุ่มส่งชั่วคราว */
  isPreparingImage?: boolean;
  /** ข้อความแจ้งเมื่อแนบ/ส่งรูปไม่ได้ แสดงแทน hint */
  imageError?: string | null;
  disabled?: boolean;
}

/** ไอคอนรูปภาพ (กรอบ + ภูเขา + พระอาทิตย์) — สีตาม currentColor */
function ImageIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect x="2" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="6.5" cy="7" r="1.5" fill="currentColor" />
      <path d="m3 14 4-4 3 3 2-2 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function AttachmentThumb({ attachment, onRemove }: { attachment: Attachment; onRemove?: (id: string) => void }) {
  const [broken, setBroken] = useState(false);
  return (
    <li className={styles.thumb} title={attachment.file.name}>
      {broken ? (
        // เช่น HEIC บน Chrome — แสดงตัวอย่างไม่ได้ แต่ยังลองส่งได้ (ถ้าย่อไม่ได้จะแจ้งตอนส่ง)
        <span className={styles.thumbFallback}>{attachment.file.name.split(".").pop()?.toUpperCase()}</span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={attachment.url} alt={attachment.file.name} onError={() => setBroken(true)} />
      )}
      {onRemove && (
        <button type="button" className={styles.thumbRemove} onClick={() => onRemove(attachment.id)} aria-label={`เอา ${attachment.file.name} ออก`}>
          ×
        </button>
      )}
    </li>
  );
}

export function Composer({
  onSend,
  onPickImages,
  attachments = [],
  onRemoveAttachment,
  isPreparingImage,
  imageError,
  disabled,
}: ComposerProps) {
  const [text, setText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const canSend = !disabled && !isPreparingImage && (text.trim().length > 0 || attachments.length > 0);

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
        {attachments.length > 0 && (
          <ul className={styles.tray} aria-label="รูปที่จะส่ง">
            {attachments.map((a) => (
              <AttachmentThumb key={a.id} attachment={a} onRemove={onRemoveAttachment} />
            ))}
          </ul>
        )}
        <textarea
          className={styles.input}
          rows={2}
          value={text}
          maxLength={MAX_LENGTH}
          placeholder={attachments.length > 0 ? "พิมพ์ข้อความเพิ่ม (ไม่ใส่ก็ได้)…" : "พิมพ์ข้อความ…"}
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
          onPaste={(e) => {
            // วางรูปจาก clipboard (เช่น screenshot) → แนบไว้ในแถบรูป
            const images = [...e.clipboardData.files].filter((f) => f.type.startsWith("image/"));
            if (images.length > 0 && onPickImages) {
              e.preventDefault();
              onPickImages(images);
            }
          }}
        />
        <div className={styles.toolbar}>
          {onPickImages && (
            <>
              <button
                type="button"
                className={styles.attach}
                onClick={() => fileRef.current?.click()}
                disabled={disabled || isPreparingImage}
                aria-label="แนบรูปภาพ"
                title="แนบรูปภาพ — หรือลากรูปมาวางในห้องแชต / วางรูปในช่องข้อความ"
              >
                <ImageIcon />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept={IMAGE_ACCEPT}
                multiple
                hidden
                onChange={(e) => {
                  const files = [...(e.target.files ?? [])];
                  e.target.value = ""; // เลือกไฟล์เดิมซ้ำได้
                  if (files.length > 0) onPickImages(files);
                }}
              />
            </>
          )}
          {imageError ? (
            <span className={styles.error} role="alert">
              {imageError}
            </span>
          ) : (
            <span className={styles.hint}>
              {isPreparingImage
                ? "กำลังส่งรูป…"
                : attachments.length > 0
                  ? `แนบ ${attachments.length} รูป · Enter ส่ง`
                  : "Enter ส่ง · Shift+Enter ขึ้นบรรทัดใหม่"}
            </span>
          )}
          <button className={styles.send} type="submit" disabled={!canSend}>
            ส่ง
          </button>
        </div>
      </div>
    </form>
  );
}
