"use client";

import { useState } from "react";
import { ImageModal } from "@/components/ui/ImageModal";
import type { Message, MessageDirection, PendingMessage } from "@/lib/chat-api";
import { TYPE_LABEL, formatDayDivider, formatTime } from "@/lib/chat-format";
import { firstLink, linkify } from "@/lib/linkify";
import { LinkPreview } from "../LinkPreview";
import styles from "./MessageBubble.module.css";

/** ข้อความที่มีลิงก์: ลิงก์คลิกได้ และลิงก์แรกมีการ์ดพรีวิว (og:image) ใต้ข้อความ */
function TextContent({ text }: { text: string }) {
  const previewUrl = firstLink(text);
  return (
    <>
      {linkify(text).map((part, i) =>
        part.kind === "link" ? (
          <a key={i} className={styles.link} href={part.href} target="_blank" rel="noopener noreferrer">
            {part.text}
          </a>
        ) : (
          part.text
        ),
      )}
      {previewUrl && <LinkPreview url={previewUrl} />}
    </>
  );
}

/** รูปในแชต — คลิกแล้วเปิด Modal Box รูปขนาดใหญ่ */
function ImageContent({ message, src }: { message: Message; src: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const sender = message.direction === "inbound" ? "ลูกค้าส่ง" : "คุณส่ง";

  return (
    <>
      <button type="button" className={styles.imageButton} onClick={() => setIsOpen(true)} aria-label="ดูรูปขนาดใหญ่">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.image} src={src} alt={TYPE_LABEL.image} loading="lazy" />
      </button>
      {isOpen && (
        <ImageModal
          src={src}
          alt={TYPE_LABEL.image}
          title="รูปภาพ"
          subtitle={`${sender} · ${formatDayDivider(message.createdAt)} ${formatTime(message.createdAt)}`}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

function MessageContent({ message }: { message: Message }) {
  if (message.type === "text") return <TextContent text={message.text ?? ""} />;

  if (message.type === "image" && message.contentUrl) return <ImageContent message={message} src={message.contentUrl} />;

  if (message.type === "sticker" && message.contentUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img className={styles.sticker} src={message.contentUrl} alt={TYPE_LABEL.sticker} loading="lazy" />
    );
  }

  return <span className={styles.placeholder}>{TYPE_LABEL[message.type]}</span>;
}

interface BubbleFrameProps {
  direction: MessageDirection;
  createdAt: string;
  /** ข้อความขาออก: ลูกค้าอ่านแล้ว (backend อนุมานจากการที่ลูกค้าตอบกลับ) — แสดง "อ่านแล้ว" เหมือน LINE OA Manager */
  readAt?: string | null;
  status?: PendingMessage["status"];
  children: React.ReactNode;
  footer?: React.ReactNode;
}

function BubbleFrame({ direction, createdAt, readAt, status, children, footer }: BubbleFrameProps) {
  return (
    <div className={styles.row} data-direction={direction} data-status={status}>
      <div className={styles.bubble}>{children}</div>
      <div className={styles.meta}>
        {status === "sending" ? (
          <span>กำลังส่ง…</span>
        ) : status === "failed" ? (
          footer
        ) : (
          <>
            {direction === "outbound" && readAt && (
              <span title={`ลูกค้าเปิดอ่านแล้ว (ตอบกลับเมื่อ ${formatTime(readAt)})`}>อ่านแล้ว</span>
            )}
            <time dateTime={createdAt}>{formatTime(createdAt)}</time>
          </>
        )}
      </div>
    </div>
  );
}

export function MessageBubble({ message }: { message: Message }) {
  return (
    <BubbleFrame direction={message.direction} createdAt={message.createdAt} readAt={message.readAt}>
      <MessageContent message={message} />
    </BubbleFrame>
  );
}

interface PendingBubbleProps {
  pending: PendingMessage;
  onRetry: (tempId: string) => void;
  onDiscard: (tempId: string) => void;
}

export function PendingBubble({ pending, onRetry, onDiscard }: PendingBubbleProps) {
  return (
    <BubbleFrame
      direction="outbound"
      createdAt={pending.createdAt}
      status={pending.status}
      footer={
        <span className={styles.failed}>
          ส่งไม่สำเร็จ ·{" "}
          <button onClick={() => onRetry(pending.tempId)}>ส่งอีกครั้ง</button> ·{" "}
          <button onClick={() => onDiscard(pending.tempId)}>ลบ</button>
        </span>
      }
    >
      {pending.text}
    </BubbleFrame>
  );
}
