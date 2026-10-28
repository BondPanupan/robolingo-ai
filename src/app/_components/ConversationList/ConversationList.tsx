"use client";

import { useDeferredValue, useState } from "react";
import type { Conversation } from "@/lib/chat-api";
import { formatListStamp, previewText } from "@/lib/chat-format";
import { chatHref } from "@/lib/chat-url";
import { Avatar } from "@/components/ui/Avatar";
import { VIEW_LABEL, type InboxView } from "../InboxViews";
import styles from "./ConversationList.module.css";

interface ConversationListProps {
  conversations: Conversation[] | undefined;
  error: Error | null;
  isLoading: boolean;
  selectedId: string | null;
  view: InboxView;
  onViewChange: (view: InboxView) => void;
  onSelect: (id: string) => void;
  onRetry: () => void;
}

export function ConversationList({
  conversations,
  error,
  isLoading,
  selectedId,
  view,
  onViewChange,
  onSelect,
  onRetry,
}: ConversationListProps) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const visible = (conversations ?? []).filter(
    (c) =>
      (view === "all" || c.unreadCount > 0) &&
      (!deferredQuery || c.displayName.toLowerCase().includes(deferredQuery)),
  );

  return (
    <section className={styles.column} aria-label="รายการแชท">
      <header className={styles.header}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>{VIEW_LABEL[view]}</h2>
          {conversations && <span className={styles.count}>{visible.length} แชท</span>}
        </div>
        {/* Compact view switcher for widths where the views sidebar is hidden. */}
        <div className={styles.tabs} role="tablist">
          {(Object.keys(VIEW_LABEL) as InboxView[]).map((v) => (
            <button
              key={v}
              role="tab"
              aria-selected={view === v}
              className={styles.tab}
              onClick={() => onViewChange(v)}
            >
              {VIEW_LABEL[v]}
            </button>
          ))}
        </div>
        <input
          className={styles.search}
          type="search"
          placeholder="ค้นหาชื่อผู้ติดต่อ"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="ค้นหาชื่อผู้ติดต่อ"
        />
      </header>

      {error && conversations && (
        <div className={styles.inlineError} role="alert">
          เชื่อมต่อไม่ได้ กำลังลองใหม่…
        </div>
      )}

      <ul className={styles.list} aria-busy={isLoading}>
        {isLoading && !conversations ? (
          Array.from({ length: 6 }, (_, i) => (
            <li key={i} className={styles.skeleton} aria-hidden>
              <span className={styles.skelAvatar} />
              <span className={styles.skelLines}>
                <span />
                <span />
              </span>
            </li>
          ))
        ) : error && !conversations ? (
          <li className={styles.state}>
            <p className={styles.stateTitle}>โหลดรายการแชทไม่สำเร็จ</p>
            <p>{error.message}</p>
            <button className={styles.retry} onClick={onRetry}>
              ลองใหม่
            </button>
          </li>
        ) : visible.length === 0 ? (
          <li className={styles.state}>
            {conversations?.length === 0 ? (
              <>
                <p className={styles.stateTitle}>ยังไม่มีใครทักเข้ามา</p>
                <p>เมื่อผู้ใช้ส่งข้อความหา LINE OA จะขึ้นที่นี่อัตโนมัติ</p>
              </>
            ) : (
              <p className={styles.stateTitle}>ไม่พบแชทที่ตรงกับเงื่อนไข</p>
            )}
          </li>
        ) : (
          visible.map((c) => (
            <li key={c.lineUserId}>
              {/* A real link so right-click → open in new tab focuses this contact. */}
              <a
                href={chatHref(c.lineUserId)}
                className={styles.item}
                aria-current={c.lineUserId === selectedId ? "page" : undefined}
                data-unread={c.unreadCount > 0 || undefined}
                onClick={(e) => {
                  // Let the browser handle new-tab/window gestures; plain clicks switch in place.
                  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                  e.preventDefault();
                  onSelect(c.lineUserId);
                }}
              >
                <Avatar name={c.displayName} src={c.pictureUrl} size={40} />
                <span className={styles.body}>
                  <span className={styles.row}>
                    <span className={styles.name}>{c.displayName}</span>
                    {c.lastMessage && (
                      <time className={styles.stamp} dateTime={c.lastMessageAt}>
                        {formatListStamp(c.lastMessageAt)}
                      </time>
                    )}
                  </span>
                  <span className={styles.row}>
                    <span className={styles.preview}>{previewText(c.lastMessage)}</span>
                    {c.unreadCount > 0 && (
                      <span className={styles.badge} aria-label={`ยังไม่อ่าน ${c.unreadCount}`}>
                        {c.unreadCount > 99 ? "99+" : c.unreadCount}
                      </span>
                    )}
                  </span>
                </span>
              </a>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
