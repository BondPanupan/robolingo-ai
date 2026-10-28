"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { chatApi, type Conversation, type Message, type PendingMessage } from "@/lib/chat-api";
import { chatHref, readChatParam } from "@/lib/chat-url";
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

  const conversations = usePolling<Conversation[]>("conversations", (signal) =>
    chatApi.getConversations(signal),
  );
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
    async (tempId: string, userId: string, text: string) => {
      try {
        const sent = await chatApi.sendMessage(userId, text);
        setPending((list) => list.filter((p) => p.tempId !== tempId));
        if (userId === selectedIdRef.current) {
          mutateMessages((list) =>
            list && !list.some((m) => m.id === sent.id) ? [...list, sent] : list,
          );
        }
        refreshConversations();
      } catch {
        setPending((list) =>
          list.map((p) => (p.tempId === tempId ? { ...p, status: "failed" } : p)),
        );
      }
    },
    [mutateMessages, refreshConversations],
  );

  const send = (text: string) => {
    if (!selectedId) return;
    tempCounter += 1;
    const item: PendingMessage = {
      tempId: `temp-${tempCounter}`,
      lineUserId: selectedId,
      text,
      createdAt: new Date().toISOString(),
      status: "sending",
    };
    setPending((list) => [...list, item]);
    void deliver(item.tempId, item.lineUserId, item.text);
  };

  const retrySend = (tempId: string) => {
    const item = pending.find((p) => p.tempId === tempId);
    if (!item) return;
    setPending((list) => list.map((p) => (p.tempId === tempId ? { ...p, status: "sending" } : p)));
    void deliver(item.tempId, item.lineUserId, item.text);
  };

  const discard = (tempId: string) =>
    setPending((list) => list.filter((p) => p.tempId !== tempId));

  const counts = {
    all: conversations.data?.length ?? 0,
    unread: conversations.data?.filter((c) => c.unreadCount > 0).length ?? 0,
  };

  return (
    <div className={styles.app}>
      <TopBar online={!conversations.error} />
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
          onRetry={conversations.refresh}
        />
        {selectedId ? (
          <ChatPanel
            conversation={selected}
            messages={messages.data}
            pending={pending.filter((p) => p.lineUserId === selectedId)}
            error={messages.error}
            isLoading={messages.isLoading}
            onSend={send}
            onRetrySend={retrySend}
            onDiscard={discard}
            onRetryLoad={messages.refresh}
            onBack={() => selectChat(null)}
          />
        ) : (
          <ChatPlaceholder />
        )}
        <ContactPanel conversation={selected} />
      </div>
    </div>
  );
}
