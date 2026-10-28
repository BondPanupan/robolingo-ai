"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, chatApi, type Conversation, type Message, type PendingMessage } from "@/lib/chat-api";
import { resizeImage } from "@/lib/resize-image";
import { chatHref, openChatPopout, readChatParam, readIsPopout } from "@/lib/chat-url";
import { useNewMessageSound, useSoundEnabled } from "@/lib/useNotificationSound";
import { usePolling } from "@/lib/usePolling";
import { ChatPanel, ChatPlaceholder } from "../ChatPanel";
import { ContactPanel } from "../ContactPanel";
import { ConversationList } from "../ConversationList";
import { InboxViews, type InboxView } from "../InboxViews";
import { TopBar } from "@/components/layout/TopBar";
import styles from "./Inbox.module.css";

let tempCounter = 0;

export function Inbox() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingMessage[]>([]);
  const [view, setView] = useState<InboxView>("all");
  const [isPopout, setIsPopout] = useState(false);
  const [soundEnabled, setSoundEnabled] = useSoundEnabled();
  // หน้าต่าง pop-out ไม่เล่นเสียง — หน้า Inbox หลักเล่นอยู่แล้ว ไม่งั้นดังซ้ำ
  const playsSound = soundEnabled && !isPopout;

  const conversations = usePolling<Conversation[]>(
    "conversations",
    (signal) => chatApi.getConversations(signal),
    // เปิดเสียงไว้ = ต้องรู้ว่ามีข้อความใหม่แม้อยู่แท็บอื่น
    { whileHidden: playsSound },
  );
  useNewMessageSound(conversations.data, playsSound);
  const messages = usePolling<Message[]>(selectedId, (signal) =>
    chatApi.getMessages(selectedId!, signal),
  );

  const selected = conversations.data?.find((c) => c.lineUserId === selectedId);
  const { mutate: mutateConversations, refresh: refreshConversations } = conversations;
  const { mutate: mutateMessages } = messages;

  // The URL owns the selection so a chat can be opened in its own tab. Read it after
  // mount (the page is prerendered without search params) and on back/forward.
  useEffect(() => {
    const sync = () => setSelectedId(readChatParam());
    sync();
    setIsPopout(readIsPopout());
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const selectChat = useCallback((id: string | null) => {
    setSelectedId(id);
    if (readChatParam() !== id) window.history.pushState(null, "", chatHref(id));
  }, []);

  // Name the tab after the contact so several focused chats are easy to tell apart.
  const selectedName = selected?.displayName;
  useEffect(() => {
    document.title = selectedName ? `${selectedName} · LINE OA Webchat` : "LINE OA Webchat";
  }, [selectedName]);

  // Sends resolve after the admin may have switched chats; read the latest selection.
  const selectedIdRef = useRef(selectedId);
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  // Keep the open chat read: clear its badge locally and tell the server.
  const selectedUnread = selected?.unreadCount ?? 0;
  useEffect(() => {
    if (!selectedId || selectedUnread === 0) return;
    mutateConversations((list) =>
      list?.map((c) => (c.lineUserId === selectedId ? { ...c, unreadCount: 0 } : c)),
    );
    chatApi.markAsRead(selectedId).catch(() => {
      // next poll will show the badge again; nothing else to do
    });
  }, [selectedId, selectedUnread, mutateConversations]);

  const deliver = useCallback(
    async (item: PendingMessage) => {
      try {
        const sent = item.image
          ? await chatApi.sendImage(item.lineUserId, item.image.full, item.image.preview)
          : await chatApi.sendMessage(item.lineUserId, item.text);
        if (item.image) URL.revokeObjectURL(item.image.objectUrl);
        setPending((list) => list.filter((p) => p.tempId !== item.tempId));
        if (item.lineUserId === selectedIdRef.current) {
          mutateMessages((list) =>
            list && !list.some((m) => m.id === sent.id) ? [...list, sent] : list,
          );
        }
        refreshConversations();
      } catch (err) {
        const error = err instanceof ApiError ? err.message : undefined;
        setPending((list) =>
          list.map((p) => (p.tempId === item.tempId ? { ...p, status: "failed", error } : p)),
        );
      }
    },
    [mutateMessages, refreshConversations],
  );

  // ส่งทีละรายการตามลำดับที่กด — รูปอัปโหลดนานกว่าข้อความ ถ้ายิงพร้อมกันข้อความจะถึง LINE ก่อนรูปที่ส่งก่อนหน้า
  // deliver จับ error เองทุกกรณี คิวจึงไม่หยุดเมื่อรายการหนึ่งล้มเหลว
  const sendQueueRef = useRef<Promise<void>>(Promise.resolve());
  const deliverInOrder = useCallback(
    (item: PendingMessage) => {
      sendQueueRef.current = sendQueueRef.current.then(() => deliver(item));
    },
    [deliver],
  );

  const enqueue = (fields: Pick<PendingMessage, "text" | "image">) => {
    if (!selectedId) return;
    tempCounter += 1;
    const item: PendingMessage = {
      tempId: `temp-${tempCounter}`,
      lineUserId: selectedId,
      createdAt: new Date().toISOString(),
      status: "sending",
      ...fields,
    };
    setPending((list) => [...list, item]);
    deliverInOrder(item);
  };

  const send = (text: string) => enqueue({ text });

  /** ย่อรูปก่อนแล้วค่อยขึ้น bubble — เปิดไฟล์ไม่ได้ให้ Composer แจ้งแอดมิน (throw ต่อ) */
  const sendImage = async (file: File) => {
    const { image, preview } = await resizeImage(file);
    enqueue({ text: "", image: { full: image, preview, objectUrl: URL.createObjectURL(preview) } });
  };

  const retrySend = (tempId: string) => {
    const item = pending.find((p) => p.tempId === tempId);
    if (!item) return;
    setPending((list) =>
      list.map((p) => (p.tempId === tempId ? { ...p, status: "sending", error: undefined } : p)),
    );
    deliverInOrder(item);
  };

  const discard = (tempId: string) =>
    setPending((list) =>
      list.filter((p) => {
        if (p.tempId === tempId && p.image) URL.revokeObjectURL(p.image.objectUrl);
        return p.tempId !== tempId;
      }),
    );

  const counts = {
    all: conversations.data?.length ?? 0,
    unread: conversations.data?.filter((c) => c.unreadCount > 0).length ?? 0,
  };

  const chatPanelProps = {
    conversation: selected,
    messages: messages.data,
    pending: pending.filter((p) => p.lineUserId === selectedId),
    error: messages.error,
    isLoading: messages.isLoading,
    onSend: send,
    onSendImage: sendImage,
    onRetrySend: retrySend,
    onDiscard: discard,
    onRetryLoad: messages.refresh,
  };

  // Pop-out window: just this contact's thread, no inbox chrome.
  if (isPopout && selectedId) {
    return (
      <div className={styles.popout}>
        <ChatPanel {...chatPanelProps} />
      </div>
    );
  }

  return (
    <div className={styles.app}>
      <TopBar online={!conversations.error} soundEnabled={soundEnabled} onSoundChange={setSoundEnabled} />
      <div className={styles.inbox} data-view={selectedId ? "chat" : "list"}>
        <InboxViews view={view} counts={counts} onChange={setView} />
        <ConversationList
          conversations={conversations.data}
          error={conversations.error}
          isLoading={conversations.isLoading}
          selectedId={selectedId}
          view={view}
          onViewChange={setView}
          onSelect={selectChat}
          onPopout={openChatPopout}
          onRetry={conversations.refresh}
        />
        {selectedId ? (
          <ChatPanel
            {...chatPanelProps}
            onBack={() => selectChat(null)}
            onPopout={() => openChatPopout(selectedId)}
          />
        ) : (
          <ChatPlaceholder />
        )}
        <ContactPanel conversation={selected} />
      </div>
    </div>
  );
}
