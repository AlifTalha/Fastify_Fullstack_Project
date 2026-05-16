import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  getChatUsers,
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
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
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
          {last?.content ||
            (last?.mediaType ? "?? Attachment" : "No messages yet")}
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
  const [showNewChat, setShowNewChat] = useState(false);
  const [chatUsers, setChatUsers] = useState([]);
  const [chatUsersLoading, setChatUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  const location = useLocation();
  const navigate = useNavigate();

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
      // Auto-select if redirected from feedback with a specific convId
      const targetConvId = location.state?.convId;
      if (targetConvId) {
        setActiveConvId(targetConvId);
        setMobileSidebar(false);
        // clear the state so refresh doesn't re-select
        navigate(location.pathname, { replace: true, state: {} });
      }
      setLoading(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setConversations((prev) => [
        conv,
        ...prev.filter((c) => c.id !== conv.id),
      ]);
      setActiveConvId(conv.id);
      setMobileSidebar(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to connect");
    } finally {
      setContacting(false);
    }
  };

  const handleOpenNewChat = async () => {
    setShowNewChat(true);
    setUserSearch("");
    if (chatUsers.length) return; // already loaded
    setChatUsersLoading(true);
    try {
      const { data } = await getChatUsers();
      setChatUsers(data.data || []);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setChatUsersLoading(false);
    }
  };

  const handleStartChatWith = async (receiverId) => {
    try {
      const { data } = await startOrGetConversation({ receiverId });
      const conv = data.data || data;
      setConversations((prev) => [
        conv,
        ...prev.filter((c) => c.id !== conv.id),
      ]);
      setActiveConvId(conv.id);
      setMobileSidebar(false);
      setShowNewChat(false);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to start conversation",
      );
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
        getOtherName(c, user?.id).toLowerCase().includes(search.toLowerCase()),
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

  if (loading) {
    return (
      <div className="flex h-[calc(100dvh-4rem)] items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  // ---- ADMIN LAYOUT ----
  // Rendered inside AdminLayout's <main class="flex flex-1 flex-col overflow-hidden">
  if (isAdmin) {
    return (
      <div className="flex h-full overflow-hidden">
        {/* Conversation sidebar — full-width on mobile when active, fixed w-72 on lg+ */}
        <aside
          className={`${
            mobileSidebar ? "flex" : "hidden"
          } w-full flex-col border-r border-gray-200 bg-white lg:flex lg:w-72 lg:shrink-0`}
        >
          <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
            <h2 className="flex-1 text-base font-bold text-gray-800">
              Support Inbox
            </h2>
            {totalUnread > 0 && (
              <span className="rounded-full bg-orange-500 px-2 py-0.5 text-xs font-bold text-white">
                {totalUnread}
              </span>
            )}
          </div>
          <div className="px-3 py-2">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-200"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredConvs.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-400">
                No conversations
              </p>
            ) : (
              filteredConvs.map((conv) => (
                <ConvItem
                  key={conv.id}
                  conv={conv}
                  myId={user?.id}
                  active={conv.id === activeConvId}
                  unread={unreadMap[conv.id] || 0}
                  onClick={() => handleSelectConv(conv.id)}
                />
              ))
            )}
          </div>
        </aside>

        {/* Chat pane — hidden on mobile when sidebar is open, flex-1 on lg+ */}
        <div
          className={`${
            !mobileSidebar ? "flex" : "hidden"
          } flex-1 flex-col overflow-hidden lg:flex`}
        >
          {activeConvId ? (
            <>
              {/* Header with back button on mobile */}
              <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
                <button
                  onClick={() => setMobileSidebar(true)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 lg:hidden"
                  aria-label="Back to conversations"
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
                <Avatar name={otherName} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-gray-800">
                    {otherName}
                  </p>
                  <p className="text-xs text-gray-400">User</p>
                </div>
              </div>
              {/* Messages */}
              <div
                ref={msgListRef}
                className="flex-1 space-y-3 overflow-y-auto bg-gray-50 px-4 py-4 sm:px-6"
              >
                {msgLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                  </div>
                ) : messageGroups.length === 0 ? (
                  <p className="py-8 text-center text-sm text-gray-400">
                    No messages yet
                  </p>
                ) : (
                  messageGroups.map((group) => (
                    <div key={group.dateKey}>
                      <DateSeparator label={group.label} />
                      <div className="space-y-2">
                        {group.msgs.map((msg, i) => (
                          <MessageBubble
                            key={msg.id}
                            msg={msg}
                            isMe={msg.senderId === user?.id}
                            showName={
                              i === 0 ||
                              group.msgs[i - 1]?.senderId !== msg.senderId
                            }
                          />
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
              {/* Input */}
              <form
                onSubmit={handleSend}
                className="flex items-end gap-2 border-t border-gray-200 bg-white px-4 py-3"
              >
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message…"
                  className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-200"
                />
                <button
                  type="submit"
                  disabled={sending || !text.trim()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white transition hover:bg-orange-600 disabled:opacity-50"
                >
                  {sending ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <svg
                      className="h-5 w-5 rotate-90"
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
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-gray-50 p-6 text-center">
              <p className="font-medium text-gray-500">
                No conversation selected
              </p>
              <button
                onClick={() => setMobileSidebar(true)}
                className="text-sm text-orange-500 underline-offset-2 hover:underline lg:hidden"
              >
                View all conversations
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---- USER LAYOUT ----
  // Same two-pane design as admin: sidebar + chat pane, mobile-toggled
  // Rendered inside MainLayout (sticky h-16 navbar) → available height = 100dvh - 4rem

  const filteredChatUsers = userSearch
    ? chatUsers.filter(
        (u) =>
          u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
          u.email?.toLowerCase().includes(userSearch.toLowerCase()),
      )
    : chatUsers;

  const otherParticipant = activeConv
    ? getOtherParticipant(activeConv, user?.id)
    : null;
  const otherIsAdmin = otherParticipant?.user?.role === "ADMIN";

  return (
    <div className="flex h-[calc(100dvh-4rem)] overflow-hidden">
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside
        className={`${
          mobileSidebar ? "flex" : "hidden"
        } w-full flex-col border-r border-gray-200 bg-white sm:flex sm:w-72 sm:shrink-0`}
      >
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
          <h2 className="flex-1 text-base font-bold text-gray-800">Messages</h2>
          {totalUnread > 0 && (
            <span className="rounded-full bg-orange-500 px-2 py-0.5 text-xs font-bold text-white">
              {totalUnread}
            </span>
          )}
          {/* New Chat button */}
          <button
            onClick={handleOpenNewChat}
            title="New conversation"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-orange-50 hover:text-orange-500"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-2">
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-200"
          />
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {filteredConvs.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
              <p className="text-sm text-gray-400">No conversations yet</p>
              <button
                onClick={handleOpenNewChat}
                className="rounded-lg bg-orange-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-orange-600"
              >
                Start a conversation
              </button>
            </div>
          ) : (
            filteredConvs.map((conv) => (
              <ConvItem
                key={conv.id}
                conv={conv}
                myId={user?.id}
                active={conv.id === activeConvId}
                unread={unreadMap[conv.id] || 0}
                onClick={() => handleSelectConv(conv.id)}
              />
            ))
          )}
        </div>

        {/* Chat with Support quick link */}
        <div className="border-t border-gray-100 px-3 py-2">
          <button
            onClick={handleContactAdmin}
            disabled={contacting}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500 transition hover:bg-orange-50 hover:text-orange-600 disabled:opacity-60"
          >
            <svg
              className="h-4 w-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            {contacting ? "Connecting…" : "Chat with Support"}
          </button>
        </div>
      </aside>

      {/* ── Chat Pane ───────────────────────────────────────────────────────── */}
      <div
        className={`${
          !mobileSidebar ? "flex" : "hidden"
        } flex-1 flex-col overflow-hidden sm:flex`}
      >
        {activeConvId ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
              <button
                onClick={() => setMobileSidebar(true)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 sm:hidden"
                aria-label="Back"
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
              <Avatar name={otherName} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-gray-800">
                  {otherName}
                  {otherIsAdmin && (
                    <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-600">
                      Support
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={msgListRef}
              className="flex-1 space-y-3 overflow-y-auto bg-gray-50 px-4 py-4 sm:px-5"
            >
              {msgLoading ? (
                <div className="flex justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                </div>
              ) : messageGroups.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">
                  No messages yet. Say hello!
                </p>
              ) : (
                messageGroups.map((group) => (
                  <div key={group.dateKey}>
                    <DateSeparator label={group.label} />
                    <div className="space-y-2">
                      {group.msgs.map((msg, i) => (
                        <MessageBubble
                          key={msg.id}
                          msg={msg}
                          isMe={msg.senderId === user?.id}
                          showName={
                            i === 0 ||
                            group.msgs[i - 1]?.senderId !== msg.senderId
                          }
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={handleSend}
              className="flex items-end gap-2 border-t border-gray-100 bg-white px-4 py-3 sm:px-5"
            >
              <textarea
                ref={inputRef}
                rows={1}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type a message…"
                className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-200"
              />
              <button
                type="submit"
                disabled={sending || !text.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white transition hover:bg-orange-600 disabled:opacity-50"
              >
                {sending ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <svg
                    className="h-5 w-5 rotate-90"
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
          </>
        ) : (
          /* No conversation selected — desktop empty state */
          <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-gray-50 p-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-orange-400">
              <svg
                className="h-8 w-8"
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
              <p className="font-semibold text-gray-700">
                Select a conversation
              </p>
              <p className="mt-1 text-sm text-gray-400">
                Or start a new one with someone
              </p>
            </div>
            <button
              onClick={handleOpenNewChat}
              className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              New Conversation
            </button>
          </div>
        )}
      </div>

      {/* ── New Chat Modal ───────────────────────────────────────────────────── */}
      {showNewChat && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4">
          <div className="flex w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h3 className="text-base font-bold text-gray-800">
                New Conversation
              </h3>
              <button
                onClick={() => setShowNewChat(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Search */}
            <div className="px-4 py-3">
              <input
                type="text"
                autoFocus
                placeholder="Search by name or email…"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-200"
              />
            </div>

            {/* User list */}
            <div className="max-h-72 overflow-y-auto pb-2">
              {chatUsersLoading ? (
                <div className="flex justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                </div>
              ) : filteredChatUsers.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">
                  No users found
                </p>
              ) : (
                filteredChatUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleStartChatWith(u.id)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-orange-50"
                  >
                    <Avatar name={u.name || u.email || "?"} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-800">
                        {u.name || "Unnamed"}
                        {u.role === "ADMIN" && (
                          <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-600">
                            Support
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-gray-400">
                        {u.email}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
