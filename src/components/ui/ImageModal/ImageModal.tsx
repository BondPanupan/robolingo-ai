"use client";

import { useEffect, useRef } from "react";
import styles from "./ImageModal.module.css";

interface ImageModalProps {
  src: string;
  alt: string;
  title: string;
  /** บรรทัดเล็กใต้หัวข้อ เช่น วัน/เวลาที่ส่ง */
  subtitle?: string;
  onClose: () => void;
}

/**
 * Modal Box แสดงรูปขนาดใหญ่ — เปิดทันทีที่ mount, ผู้ใช้ unmount เมื่อได้ onClose (render แบบมีเงื่อนไข)
 * ใช้ <dialog> แบบ modal: Esc ปิด, focus อยู่ในกล่อง, ด้านหลังกดไม่ได้ ไม่ต้องเขียน focus trap เอง
 * ปิดได้ 4 ทาง: Esc, ปุ่ม ×, ปุ่ม "ปิด", คลิกพื้นหลังนอกกล่อง
 */
export function ImageModal({ src, alt, title, subtitle, onClose }: ImageModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    // dialog ถูกถอดออกจาก DOM ก่อน cleanup เลยคืนโฟกัสเองไม่ได้ — จำปุ่มที่กดเปิดไว้ แล้วโฟกัสกลับตอนปิด
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog?.showModal();
    return () => {
      dialog?.close();
      opener?.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="image-modal-title"
      // Esc: เบราว์เซอร์ปิด dialog เองแล้วยิง close — ปุ่ม/คลิกพื้นหลังเรียก onClose ตรง ไม่รอ event นี้
      // (ถ้า close ไม่มาถึง state ฝั่งผู้ใช้จะค้างเป็น "เปิด" แล้วคลิกรูปซ้ำไม่ขึ้น) — onClose ต้องเรียกซ้ำได้
      // close ยิงแบบ async: StrictMode รัน effect เปิด→ปิด→เปิด แล้ว close ของรอบแรกมาถึงตอนเปิดอยู่ — ข้ามไป
      onClose={() => {
        if (!dialogRef.current?.open) onClose();
      }}
      onClick={(event) => {
        // dialog กินพื้นที่แค่ตัวกล่อง คลิกที่ target เป็นตัว dialog เอง = คลิก ::backdrop นอกกล่อง
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <header className={styles.header}>
        <div className={styles.heading}>
          <h2 id="image-modal-title">{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {/* ปุ่มแรกใน DOM: showModal() โฟกัส element แรกที่โฟกัสได้ */}
        <button type="button" className={styles.close} onClick={onClose} aria-label="ปิดหน้าต่าง">
          ×
        </button>
      </header>

      <div className={styles.body}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.image} src={src} alt={alt} />
      </div>

      <footer className={styles.footer}>
        <a className={styles.secondary} href={src} target="_blank" rel="noopener noreferrer">
          เปิดรูปในแท็บใหม่
        </a>
        <button type="button" className={styles.primary} onClick={onClose}>
          ปิด
        </button>
      </footer>
    </dialog>
  );
}
