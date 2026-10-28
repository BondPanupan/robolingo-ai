"use client";

import { useEffect, useState } from "react";
import { chatApi, type LinkPreview as LinkPreviewData } from "@/lib/chat-api";
import styles from "./LinkPreview.module.css";

// แชตถูก poll ทุก 3 วินาทีและ bubble render ใหม่บ่อย — จำผลต่อ URL ไว้ตลอดอายุหน้า (null = ไม่มีการ์ด)
const previewCache = new Map<string, Promise<LinkPreviewData | null>>();

function loadPreview(url: string): Promise<LinkPreviewData | null> {
  let pending = previewCache.get(url);
  if (!pending) {
    pending = chatApi.getLinkPreview(url).catch(() => null);
    previewCache.set(url, pending);
  }
  return pending;
}

/** การ์ดแบบ LINE: หัวข้อ + คำอธิบายทางซ้าย รูป og:image สี่เหลี่ยมทางขวา คลิกทั้งการ์ดเปิดลิงก์ */
export function LinkPreviewCard({ preview }: { preview: LinkPreviewData }) {
  const [imageFailed, setImageFailed] = useState(false);
  const host = new URL(preview.url).hostname.replace(/^www\./, "");

  return (
    <a className={styles.card} href={preview.url} target="_blank" rel="noopener noreferrer">
      <span className={styles.text}>
        <span className={styles.title}>{preview.title ?? host}</span>
        {preview.description && <span className={styles.description}>{preview.description}</span>}
        <span className={styles.site}>{preview.siteName ?? host}</span>
      </span>
      {preview.image && !imageFailed && (
        // รูปอยู่บนเว็บปลายทาง: ไม่ส่ง referrer ไปบอกว่ามาจากหน้าแอดมิน
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className={styles.image}
          src={preview.image}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
        />
      )}
    </a>
  );
}

/** ดึง Open Graph ของ url แล้วแสดงการ์ด — ระหว่างโหลดหรือหน้าเว็บไม่มี og:* ไม่แสดงอะไร */
export function LinkPreview({ url }: { url: string }) {
  const [preview, setPreview] = useState<LinkPreviewData | null>(null);

  useEffect(() => {
    let active = true;
    loadPreview(url).then((data) => {
      if (active) setPreview(data);
    });
    return () => {
      active = false;
    };
  }, [url]);

  return preview ? <LinkPreviewCard preview={preview} /> : null;
}
