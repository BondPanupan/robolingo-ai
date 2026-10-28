"use client";

import { Fragment, useLayoutEffect, useRef } from "react";
import type { Conversation, Message, PendingMessage } from "@/lib/chat-api";
import { dayKey, formatDayDivider } from "@/lib/chat-format";
import { Avatar } from "@/components/ui/Avatar";
import { Composer } from "../Composer";
import { MessageBubble, PendingBubble } from "../MessageBubble";
import styles from "./ChatPanel.module.css";

const STICK_THRESHOLD_PX = 80;

interface ChatPanelProps {
  conversation: Conversation | undefined;
  messages: Message[] | undefined;
  pending: PendingMessage[];
  error: Error | null;
  isLoading: boolean;
  onSend: (text: string) => void;
  onRetrySend: (tempId: string) => void;
  onDiscard: (tempId: string) => void;
  onRetryLoad: () => void;
  onBack: () => void;
}

export function ChatPanel({
  conversation,
  messages,
  pending,
  error,
  isLoading,
  onSend,
  onRetrySend,
  onDiscard,
  onRetryLoad,
  onBack,
}: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const userId = conversation?.lineUserId;

  // Opening another chat always starts at the latest message.
  useLayoutEffect(() => {
    stickToBottom.current = true;
  }, [userId]);

  // Follow new messages only if the admin is already reading the bottom.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages?.length, pending.length, userId]);

  const handleSend = (text: string) => {
    stickToBottom.current = true;
    onSend(text);
  };

  return (
    <section className={styles.panel} aria-label="ห้องแชท">
      <header className={styles.header}>
        <button className={styles.back} onClick={onBack} aria-label="กลับไปรายการแชท">
          ‹
        </button>
        {conversation && (
          <>
            <Avatar name={conversation.displayName} src={conversation.pictureUrl} size={36} />
            <div className={styles.headerText}>
              <h2 className={styles.name}>{conversation.displayName}</h2>
              <span className={styles.sub}>
                <span className={styles.lineTag}>LINE</span> แชท 1:1
              </span>
            </div>
          </>
        )}
      </header>

      <div
        ref={scrollRef}
        className={styles.scroll}
        onScroll={(e) => {
          const el = e.currentTarget;
          stickToBottom.current =
            el.scrollHeight - el.scrollTop - el.clientHeight < STICK_THRESHOLD_PX;
        }}
        aria-live="polite"
        aria-busy={isLoading}
      >
        {isLoading && !messages ? (
          <div className={styles.state}>
            <span className={styles.spinner} aria-hidden />
            กำลังโหลดข้อความ…
          </div>
        ) : error && !messages ? (
          <div className={styles.state} role="alert">
            <p className={styles.stateTitle}>โหลดข้อความไม่สำเร็จ</p>
            <p>{error.message}</p>
            <button className={styles.retry} onClick={onRetryLoad}>
              ลองใหม่
            </button>
          </div>
        ) : messages?.length === 0 && pending.length === 0 ? (
          <div className={styles.state}>
            <p className={styles.stateTitle}>ยังไม่มีข้อความในห้องนี้</p>
            <p>เริ่มทักทายลูกค้าได้เลย</p>
          </div>
        ) : (
          <div className={styles.messages}>
            {messages?.map((m, i) => {
              const showDivider = i === 0 || dayKey(messages[i - 1].createdAt) !== dayKey(m.createdAt);
              return (
                <Fragment key={m.id}>
                  {showDivider && (
                    <div className={styles.divider}>
                      <span>{formatDayDivider(m.createdAt)}</span>
                    </div>
                  )}
                  <MessageBubble message={m} />
                </Fragment>
              );
            })}
            {pending.map((p) => (
              <PendingBubble key={p.tempId} pending={p} onRetry={onRetrySend} onDiscard={onDiscard} />
            ))}
          </div>
        )}
      </div>

      {error && messages && (
        <div className={styles.inlineError} role="alert">
          การเชื่อมต่อขัดข้อง ข้อความใหม่อาจยังไม่ขึ้น
        </div>
      )}

      <Composer onSend={handleSend} disabled={!conversation} />
    </section>
  );
}

export function ChatPlaceholder() {
  return (
    <section className={`${styles.panel} ${styles.placeholder}`}>
      <div className={styles.state}>
        <p className={styles.placeholderIcon} aria-hidden>
          💬
        </p>
        <p className={styles.stateTitle}>เลือกแชทเพื่อเริ่มคุย</p>
        <p>ข้อความจาก LINE OA จะเข้ามาที่ Inbox นี้แบบ realtime</p>
      </div>
    </section>
  );
}
