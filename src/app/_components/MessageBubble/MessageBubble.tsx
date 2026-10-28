"use client";

import type { Message, MessageDirection, PendingMessage } from "@/lib/chat-api";
import { TYPE_LABEL, formatTime } from "@/lib/chat-format";
import styles from "./MessageBubble.module.css";

function MessageContent({ message }: { message: Message }) {
  if (message.type === "text") return <>{message.text}</>;

  if ((message.type === "image" || message.type === "sticker") && message.contentUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        className={message.type === "sticker" ? styles.sticker : styles.image}
        src={message.contentUrl}
        alt={TYPE_LABEL[message.type]}
        loading="lazy"
      />
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
