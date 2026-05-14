import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import useAuthStore from "../../store/authStore";
import {
  getAdminUser,
  getAdminConversations,
  getConversations,
  getConversationMessages,
  sendMessage,
  markAsRead,
  startOrGetConversation,
} from "../../api/chat";

const WS_URL =
  import.meta.env.VITE_WS_URL || "ws://localhost:5000/api/v1/chat/ws";
const BASE =
  import.meta.env.VITE_API_URL?.replace("/api/v1", "") ||
  "http://localhost:5000";

// -- Helpers -------------------------------------------------------------------

function getOtherParticipant(conv, myId) {
  if (!conv?.participants) return null;
  return conv.participants.find((p) => {
    const uid = p.userId ?? p.user?.id ?? p.id;
    return uid !== myId;
  });
}

function getOtherName(conv, myId) {
  const other = getOtherParticipant(conv, myId);
  return other?.user?.name ?? other?.name ?? "Unknown";
}

function getLastMsg(conv) {
  const msgs = conv?.messages;
  if (!msgs?.length) return null;
  return msgs[0];
}

function fmtTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function fmtDateLabel(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

const AVATAR_PALETTES = [
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
  "bg-teal-100 text-teal-700",
  "bg-sky-100 text-sky-700",
  "bg-fuchsia-100 text-fuchsia-700",
  "bg-emerald-100 text-emerald-700",
  "bg-orange-100 text-orange-700",
];

function nameToColorCls(name = "?") {
  let h = 0;
  for (let i = 0; i < name.length; i++)
    h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_PALETTES[Math.abs(h) % AVATAR_PALETTES.length];
}

// -- Sub-components ------------------------------------------------------------

function Avatar({ name = "?", online, size = "md" }) {
  const letter = name.charAt(0).toUpperCase();
  const sz =
    size === "lg"
      ? "h-10 w-10 text-sm"
      : size === "sm"
        ? "h-7 w-7 text-xs"
        : "h-9 w-9 text-xs";
  const colorCls = nameToColorCls(name);
  return (
    <div className="relative shrink-0">
      <div
        className={`${sz} flex items-center justify-center rounded-full font-bold ${colorCls}`}
      >
        {letter}
      </div>
      {online !== undefined && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${
            online ? "bg-emerald-400" : "bg-gray-300"
          }`}
        />
      )}
    </div>
  );
}

function ConvItem({ conv, myId, active, onClick, unread }) {
  const name = getOtherName(conv, myId);
  const last = getLastMsg(conv);
  return (
    <button
      onClick={onClick}
      className={`group relative flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
        active ? "bg-orange-50" : "hover:bg-gray-50"
      }`}
    >
      {active && (
        <span className="absolute inset-y-1 left-0 w-0.75 rounded-r-full bg-orange-500" />
      )}
      <Avatar name={name} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <p
            className={`truncate text-sm font-semibold ${
              active ? "text-orange-700" : "text-gray-800"
            }`}
          >
            {name}
          </p>
          <span
            className={`shrink-0 text-[10px] ${
              active ? "text-orange-400" : "text-gray-400"
            }`}
          >
            {fmtTime(last?.createdAt)}
          </span>
        </div>
        <p
          className={`mt-0.5 truncate text-xs ${
            unread > 0 ? "font-medium text-gray-600" : "text-gray-400"
          }`}
        >
          {last?.content || (last?.mediaType ? "?? Attachment" : "No messages yet")}
        </p>
      </div>
      {unread > 0 && (
        <span className="ml-1 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-orange-500 px-1.5 text-[10px] font-bold text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </button>
  );
}

function MessageBubble({ msg, isMe, showName }) {
  const isImage = msg.mediaType === "image";
  return (
    <div className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
      {!isMe && (
        <div className="mb-1 shrink-0">
          <Avatar name={msg.sender?.name || "?"} size="sm" />
        </div>
      )}
      <div
        className={`flex max-w-[72%] flex-col ${isMe ? "items-end" : "items-start"}`}
      >
        {showName && !isMe && (
          <p className="mb-1 text-xs font-semibold text-gray-500">
            {msg.sender?.name || "Unknown"}
          </p>
        )}
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm ${
            isMe
              ? "rounded-br-sm bg-orange-500 text-white shadow-sm"
              : "rounded-bl-sm border border-gray-200 bg-white text-gray-800 shadow-sm"
          }`}
        >
          {msg.mediaUrl && isImage && (
            <img
              src={`${BASE}${msg.mediaUrl}`}
              alt="media"
              className="mb-1 max-h-60 rounded-xl object-cover"
            />
          )}
          {msg.mediaUrl && !isImage && (
            <a
              href={`${BASE}${msg.mediaUrl}`}
              target="_blank"
              rel="noreferrer"
              className={`text-xs underline ${
                isMe ? "text-orange-100" : "text-orange-600"
              }`}
            >
              ?? Attachment
            </a>
          )}
          {msg.content && <p className="leading-relaxed">{msg.content}</p>}
        </div>
        <time className="mt-1 flex items-center gap-1 text-[10px] text-gray-400">
          {fmtTime(msg.createdAt)}
          {isMe &&
            (msg.isRead ? (
              <span className="text-orange-400">??</span>
            ) : (
              <span className="text-gray-300">?</span>
            ))}
        </time>
      </div>
    </div>
  );
}

function DateSeparator({ label }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex-1 border-t border-gray-200" />
      <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-400">
        {label}
      </span>
      <div className="flex-1 border-t border-gray-200" />
    </div>
  );
}

// -- Main component ------------------------------------------------------------

export default function ChatPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "ADMIN";

  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [contacting, setContacting] = useState(false);
  const [unreadMap, setUnreadMap] = useState({});
  const [mobileSidebar, setMobileSidebar] = useState(true);
  const [search, setSearch] = useState("");

  const wsRef = useRef(null);
  const msgListRef = useRef(null);
  const inputRef = useRef(null);
  const activeConvIdRef = useRef(activeConvId);

  useEffect(() => {
    activeConvIdRef.current = activeConvId;
  }, [activeConvId]);

  const loadConversations = useCallback(async () => {
    try {
      const fn = isAdmin ? getAdminConversations : getConversations;
      const { data } = await fn();
      const list = data.data || data.conversations || [];
      setConversations(list);
      return list;
    } catch {
      toast.error("Failed to load conversations");
      return [];
    }
  }, [isAdmin]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const list = await loadConversations();
      if (!isAdmin && list.length > 0) setActiveConvId(list[0].id);
      setLoading(false);
    };
    init();
  }, [isAdmin, loadConversations]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;
    ws.onopen = () => {
      ws.send(JSON.stringify({ event: "auth", token }));
    };
    ws.onmessage = (event) => {
      try {
        const frame = JSON.parse(event.data);
        if (frame.event === "authenticated") return;
        if (frame.event === "message") {
          const msg = frame.data;
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            if (msg.conversationId !== activeConvIdRef.current) return prev;
            return [...prev, msg];
          });
          setConversations((prev) =>
            prev.map((c) =>
              c.id === msg.conversationId
                ? { ...c, messages: [msg], updatedAt: msg.createdAt }
                : c,
            ),
          );
          if (
            msg.conversationId !== activeConvIdRef.current &&
            msg.senderId !== user?.id
          ) {
            setUnreadMap((m) => ({
              ...m,
              [msg.conversationId]: (m[msg.conversationId] || 0) + 1,
            }));
          }
        }
      } catch {
        // ignore malformed frames
      }
    };
    return () => {
      ws.close();
      wsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeConvId) return;
    let cancelled = false;
    setMsgLoading(true);
    setMessages([]);
    getConversationMessages(activeConvId)
      .then(({ data }) => {
        if (cancelled) return;
        setMessages(data.data?.messages || data.data || data.messages || []);
        setUnreadMap((m) => ({ ...m, [activeConvId]: 0 }));
        markAsRead(activeConvId).catch(() => {});
      })
      .catch(() => toast.error("Failed to load messages"))
      .finally(() => {
        if (!cancelled) setMsgLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeConvId]);

  useEffect(() => {
    const el = msgListRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const handleContactAdmin = async () => {
    setContacting(true);
    try {
      const { data: adminData } = await getAdminUser();
      const admin = adminData.data || adminData;
      const { data: convData } = await startOrGetConversation({
        receiverId: admin.id,
      });
      const conv = convData.data || convData;
      setConversations((prev) => [conv, ...prev.filter((c) => c.id !== conv.id)]);
      setActiveConvId(conv.id);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to connect");
    } finally {
      setContacting(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const content = text.trim();
    if (!content || !activeConvId) return;
    setSending(true);
    setText("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    try {
      const { data } = await sendMessage(activeConvId, { content });
      const msg = data.data || data;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      inputRef.current?.focus();
    } catch {
      toast.error("Failed to send");
      setText(content);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const handleSelectConv = (id) => {
    setActiveConvId(id);
    setUnreadMap((m) => ({ ...m, [id]: 0 }));
    setMobileSidebar(false);
  };

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const otherName = activeConv ? getOtherName(activeConv, user?.id) : "";

  const filteredConvs = search
    ? conversations.filter((c) =>
        getOtherName(c, user?.id)
          .toLowerCase()
          .includes(search.toLowerCase()),
      )
    : conversations;

  const totalUnread = Object.values(unreadMap).reduce((a, b) => a + b, 0);

  const messageGroups = messages.reduce((groups, msg) => {
    const dateKey = new Date(msg.createdAt).toDateString();
    const last = groups[groups.length - 1];
    if (!last || last.dateKey !== dateKey) {
      groups.push({ dateKey, label: fmtDateLabel(msg.createdAt), msgs: [msg] });
    } else {
      last.msgs.push(msg);
    }
    return groups;
  }, []);

  // -- Render ------------------------------------------------------------------

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <span className="h-7 w-7 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
            <p className="text-xs">Loading…</p>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* -- Admin sidebar ------------------------------------------------ */}
          {isAdmin && (
            <aside
              className={`flex shrink-0 flex-col border-r border-gray-200 bg-white w-full sm:w-72 ${mobileSidebar ? "flex" : "hidden"} sm:flex`}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-100">
                    <svg
                      className="h-5 w-5 text-orange-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Inbox</p>
                    <p className="text-[11px] text-gray-400">
                      {conversations.length} conversation
                      {conversations.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                {totalUnread > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1.5 text-[10px] font-bold text-white">
                    {totalUnread > 99 ? "99+" : totalUnread}
                  </span>
                )}
              </div>

              {/* Search */}
              <div className="px-3 py-2.5">
                <label className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 ring-1 ring-gray-200 transition focus-within:ring-orange-400">
                  <svg
                    className="h-3.5 w-3.5 shrink-0 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search conversations…"
                    className="flex-1 bg-transparent text-xs text-gray-700 outline-none placeholder:text-gray-400"
                  />
                </label>
              </div>

              {/* Conversation list */}
              <div className="flex-1 overflow-y-auto">
                {filteredConvs.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </div>
                    <p className="text-xs font-medium text-gray-500">
                      No conversations
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {search
                        ? "No results for your search"
                        : "Users will appear here when they reach out"}
                    </p>
                  </div>
                ) : (
                  <div className="py-1">
                    {filteredConvs.map((conv) => (
                      <ConvItem
                        key={conv.id}
                        conv={conv}
                        myId={user?.id}
                        active={conv.id === activeConvId}
                        unread={unreadMap[conv.id] || 0}
                        onClick={() => handleSelectConv(conv.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </aside>
          )}

          {/* -- Chat pane ---------------------------------------------------- */}
          <div
            className={`flex flex-1 flex-col overflow-hidden bg-gray-50 ${
              isAdmin && mobileSidebar ? "hidden sm:flex" : "flex"
            }`}
          >
            {activeConvId ? (
              <>
                {/* Chat header */}
                <div className="flex shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
                  {isAdmin && (
                    <button
                      onClick={() => setMobileSidebar(true)}
                      aria-label="Back to inbox"
                      className="-ml-1 mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-gray-500 transition hover:bg-gray-100 sm:hidden"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>
                  )}
                  <Avatar name={otherName} online size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-gray-900">
                      {otherName}
                    </p>
                    <p className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Active now
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div
                  ref={msgListRef}
                  className="flex-1 overflow-y-auto px-4 py-4"
                >
                  {msgLoading ? (
                    <div className="flex h-full items-center justify-center">
                      <span className="h-6 w-6 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                        <svg
                          className="h-6 w-6 text-gray-300"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                          />
                        </svg>
                      </div>
                      <p className="text-xs text-gray-400">
                        No messages yet — say hello! ??
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {messageGroups.map((group) => (
                        <div key={group.dateKey}>
                          <DateSeparator label={group.label} />
                          <div className="flex flex-col gap-2.5">
                            {group.msgs.map((msg, i) => {
                              const globalIdx = messages.indexOf(msg);
                              const isMe = msg.senderId === user?.id;
                              const prevMsg = messages[globalIdx - 1];
                              const showName =
                                isAdmin &&
                                !isMe &&
                                (globalIdx === 0 ||
                                  prevMsg?.senderId !== msg.senderId);
                              return (
                                <MessageBubble
                                  key={msg.id || i}
                                  msg={msg}
                                  isMe={isMe}
                                  showName={showName}
                                />
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Input bar */}
                <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-3">
                  <form onSubmit={handleSend} className="flex items-end gap-2">
                    <label className="flex flex-1 items-end rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 transition focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100">
                      <textarea
                        ref={inputRef}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message…"
                        rows={1}
                        className="flex-1 resize-none bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
                        style={{ maxHeight: "100px", overflowY: "auto" }}
                        onInput={(e) => {
                          e.target.style.height = "auto";
                          e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
                        }}
                      />
                    </label>
                    <button
                      type="submit"
                      disabled={!text.trim() || sending}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-sm shadow-orange-200 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {sending ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      ) : (
                        <svg
                          className="h-4 w-4 translate-x-px"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                          />
                        </svg>
                      )}
                    </button>
                  </form>
                  <p className="mt-1.5 text-center text-[10px] text-gray-300">
                    Enter to send · Shift+Enter for new line
                  </p>
                </div>
              </>
            ) : isAdmin ? (
              /* Admin: no conversation selected */
              <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50">
                  <svg
                    className="h-8 w-8 text-orange-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-base font-bold text-gray-800">
                    Select a conversation
                  </p>
                  <p className="mt-1 text-sm text-gray-400">
                    Choose a user from the inbox to view their messages
                  </p>
                </div>
              </div>
            ) : (
              /* User: contact support */
              <div className="flex h-full flex-col items-center justify-center gap-5 p-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
                  <svg
                    className="h-8 w-8 text-indigo-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-800">
                    Need help?
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Our support team is online and ready to assist you.
                  </p>
                </div>
                <button
                  onClick={handleContactAdmin}
                  disabled={contacting}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  {contacting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Connecting…
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      Start Chat with Support
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
