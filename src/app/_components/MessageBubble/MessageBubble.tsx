"use client";

import { useState } from "react";
import { ImageModal } from "@/components/ui/ImageModal";
import type { Message, MessageDirection, PendingMessage } from "@/lib/chat-api";
import { TYPE_LABEL, formatDayDivider, formatTime } from "@/lib/chat-format";
import styles from "./MessageBubble.module.css";

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
  if (message.type === "text") return <>{message.text}</>;

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
  status?: PendingMessage["status"];
  children: React.ReactNode;
  footer?: React.ReactNode;
}

function BubbleFrame({ direction, createdAt, status, children, footer }: BubbleFrameProps) {
  return (
    <div className={styles.row} data-direction={direction} data-status={status}>
      <div className={styles.bubble}>{children}</div>
      <div className={styles.meta}>
        {status === "sending" ? (
          <span>กำลังส่ง…</span>
        ) : status === "failed" ? (
          footer
        ) : (
          <time dateTime={createdAt}>{formatTime(createdAt)}</time>
        )}
      </div>
    </div>
  );
}

export function MessageBubble({ message }: { message: Message }) {
  return (
    <BubbleFrame direction={message.direction} createdAt={message.createdAt}>
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
