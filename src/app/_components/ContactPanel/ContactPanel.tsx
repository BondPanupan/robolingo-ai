"use client";

import { useState } from "react";
import type { Conversation } from "@/lib/chat-api";
import { formatDayDivider, formatTime } from "@/lib/chat-format";
import { Avatar } from "@/components/ui/Avatar";
import styles from "./ContactPanel.module.css";

export function ContactPanel({ conversation }: { conversation: Conversation | undefined }) {
  const [copied, setCopied] = useState(false);

  if (!conversation) return <aside className={styles.panel} />;

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(conversation.lineUserId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked (insecure context); the ID is still selectable
    }
  };

  return (
    <aside className={styles.panel} aria-label="ข้อมูลผู้ติดต่อ">
      <div className={styles.profile}>
        <Avatar name={conversation.displayName} src={conversation.pictureUrl} size={72} />
        <h2 className={styles.name}>{conversation.displayName}</h2>
        <span className={styles.channelTag}>LINE</span>
      </div>

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>ข้อมูลผู้ติดต่อ</h3>
        <dl className={styles.props}>
          <dt>LINE User ID</dt>
          <dd className={styles.idRow}>
            <code className={styles.id}>{conversation.lineUserId}</code>
            <button className={styles.copy} onClick={copyId}>
              {copied ? "คัดลอกแล้ว" : "คัดลอก"}
            </button>
          </dd>

          <dt>ข้อความล่าสุด</dt>
          <dd>
            {conversation.lastMessage
              ? `${formatDayDivider(conversation.lastMessageAt)} ${formatTime(conversation.lastMessageAt)}`
              : "—"}
          </dd>

          <dt>สถานะ</dt>
          <dd>{conversation.unreadCount > 0 ? `ยังไม่อ่าน ${conversation.unreadCount}` : "อ่านแล้ว"}</dd>
        </dl>
      </section>
    </aside>
  );
}
