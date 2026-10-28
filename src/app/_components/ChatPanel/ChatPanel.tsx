"use client";

import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Conversation, Message, PendingMessage } from "@/lib/chat-api";
import { dayKey, formatDayDivider } from "@/lib/chat-format";
import { Avatar } from "@/components/ui/Avatar";
import { PopoutIcon } from "@/components/ui/PopoutIcon";
import { Composer, type Attachment } from "../Composer";
import { MessageBubble, PendingBubble } from "../MessageBubble";
import styles from "./ChatPanel.module.css";

const STICK_THRESHOLD_PX = 80;
const MAX_IMAGES_PER_SEND = 10;

let attachmentCounter = 0;

interface ChatPanelProps {
  conversation: Conversation | undefined;
  messages: Message[] | undefined;
  pending: PendingMessage[];
  error: Error | null;
  isLoading: boolean;
  onSend: (text: string) => void;
  /** One image (dropped, picked or pasted); rejects when the file can't be opened. */
  onSendImage: (file: File) => Promise<void>;
  onRetrySend: (tempId: string) => void;
  onDiscard: (tempId: string) => void;
  onRetryLoad: () => void;
  /** Omitted in the pop-out window, which has no list to go back to. */
  onBack?: () => void;
  /** Omitted in the pop-out window itself. */
  onPopout?: () => void;
}

export function ChatPanel({
  conversation,
  messages,
  pending,
  error,
  isLoading,
  onSend,
  onSendImage,
  onRetrySend,
  onDiscard,
  onRetryLoad,
  onBack,
  onPopout,
}: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const userId = conversation?.lineUserId;
  // รูปที่ลากวาง/เลือก/วางจาก clipboard รอส่ง (ดู addAttachments) — ประกาศก่อนเพราะความสูงช่องพิมพ์เปลี่ยนตามจำนวนรูป
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const attachmentCount = attachments.length;

  // Opening another chat always starts at the latest message.
  useLayoutEffect(() => {
    stickToBottom.current = true;
  }, [userId]);

  // Follow new messages only if the admin is already reading the bottom. A pending message
  // turning "failed" adds a retry line under it, so its status counts as a change too.
  const pendingStatuses = pending.map((p) => p.status).join();
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages?.length, pendingStatuses, userId, attachmentCount]);

  // รูปโหลดเสร็จทีหลัง ความสูงเพิ่มหลังเลื่อนลงไปแล้ว — เลื่อนตามอีกรอบถ้ายังดูข้อความล่าสุดอยู่
  // (load ไม่ bubble แต่ดักที่ capture phase ของกล่องแชตได้)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onLoad = (event: Event) => {
      if (event.target instanceof HTMLImageElement && stickToBottom.current) el.scrollTop = el.scrollHeight;
    };
    el.addEventListener("load", onLoad, true);
    return () => el.removeEventListener("load", onLoad, true);
  }, []);

  // รูปที่ลากวาง/เลือก/วางจาก clipboard พักไว้เหนือช่องพิมพ์ก่อน — แอดมินดู ลบ หรือพิมพ์ข้อความเพิ่ม แล้วค่อยกดส่ง
  const [isPreparingImage, setIsPreparingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // ย้ายแชต = ทิ้งรูปที่พักไว้ (ไม่ส่งผิดคน) และคืนหน่วยความจำของ object URL
  const attachmentsRef = useRef(attachments);
  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);
  useEffect(() => {
    return () => {
      attachmentsRef.current.forEach((a) => URL.revokeObjectURL(a.url));
      setAttachments([]);
      setImageError(null);
    };
  }, [userId]);

  const addAttachments = (files: File[]) => {
    if (!conversation) return;
    const images = files.filter((f) => f.type.startsWith("image/"));
    const room = MAX_IMAGES_PER_SEND - attachments.length;
    const accepted = images.slice(0, Math.max(0, room));
    const skippedNonImages = files.length - images.length;
    setImageError(
      images.length === 0
        ? "ส่งได้เฉพาะไฟล์รูปภาพ"
        : images.length > accepted.length
          ? `ส่งได้ครั้งละ ${MAX_IMAGES_PER_SEND} รูป`
          : skippedNonImages > 0
            ? `ข้ามไฟล์ที่ไม่ใช่รูป ${skippedNonImages} ไฟล์`
            : null,
    );
    if (accepted.length === 0) return;
    setAttachments((list) => [
      ...list,
      ...accepted.map((file) => ({ id: `${Date.now()}-${++attachmentCounter}`, file, url: URL.createObjectURL(file) })),
    ]);
  };

  const removeAttachment = (id: string) =>
    setAttachments((list) =>
      list.filter((a) => {
        if (a.id === id) URL.revokeObjectURL(a.url);
        return a.id !== id;
      }),
    );

  /** ส่งรูปที่พักไว้ทีละรูปตามลำดับ แล้วตามด้วยข้อความ (ถ้ามี) — LINE แยกเป็นคนละข้อความอยู่แล้ว */
  const handleSend = async (text: string) => {
    stickToBottom.current = true;
    const toSend = attachments;
    if (toSend.length > 0) {
      setAttachments([]);
      setImageError(null);
      setIsPreparingImage(true);
      for (const a of toSend) {
        try {
          await onSendImage(a.file);
        } catch {
          setImageError(`เปิดไฟล์ "${a.file.name}" ไม่ได้ ลองใช้ไฟล์ JPG หรือ PNG`);
        }
        URL.revokeObjectURL(a.url);
      }
      setIsPreparingImage(false);
    }
    if (text) onSend(text);
  };

  // ลากไฟล์เข้ามาในห้องแชต — dragenter/leave ยิงทุกครั้งที่เข้า/ออก element ลูก จึงนับความลึกแทน boolean
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const dragDepth = useRef(0);
  const hasFiles = (e: React.DragEvent) => e.dataTransfer.types.includes("Files");
  const dropHandlers = conversation
    ? {
        onDragEnter: (e: React.DragEvent) => {
          if (!hasFiles(e)) return;
          e.preventDefault();
          dragDepth.current += 1;
          setIsDraggingFile(true);
        },
        onDragOver: (e: React.DragEvent) => {
          if (!hasFiles(e)) return;
          e.preventDefault(); // จำเป็น ไม่งั้นเบราว์เซอร์ไม่ยิง drop และเปิดไฟล์ในแท็บแทน
          e.dataTransfer.dropEffect = "copy";
        },
        onDragLeave: (e: React.DragEvent) => {
          if (!hasFiles(e)) return;
          dragDepth.current = Math.max(0, dragDepth.current - 1);
          if (dragDepth.current === 0) setIsDraggingFile(false);
        },
        onDrop: (e: React.DragEvent) => {
          if (!hasFiles(e)) return;
          e.preventDefault();
          dragDepth.current = 0;
          setIsDraggingFile(false);
          addAttachments([...e.dataTransfer.files]);
        },
      }
    : {};

  return (
    <section className={styles.panel} aria-label="ห้องแชท" {...dropHandlers}>
      {isDraggingFile && (
        <div className={styles.dropOverlay} aria-hidden>
          <span>วางรูปที่นี่ — ดูตัวอย่างและพิมพ์ข้อความได้ก่อนกดส่ง</span>
        </div>
      )}
      <header className={styles.header}>
        {onBack && (
          <button className={styles.back} onClick={onBack} aria-label="กลับไปรายการแชท">
            ‹
          </button>
        )}
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
        {onPopout && (
          <button
            className={styles.popout}
            onClick={onPopout}
            title="เปิดในหน้าต่างแยก"
            aria-label="เปิดแชทนี้ในหน้าต่างแยก"
          >
            <PopoutIcon />
          </button>
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

      <Composer
        onSend={handleSend}
        onPickImages={addAttachments}
        attachments={attachments}
        onRemoveAttachment={removeAttachment}
        isPreparingImage={isPreparingImage}
        imageError={imageError}
        disabled={!conversation}
      />
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
