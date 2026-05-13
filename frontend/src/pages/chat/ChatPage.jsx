import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import {
  getConversations,
  getConversationMessages,
  sendMessage,
  markAsRead,
  startOrGetConversation,
} from "../../api/chat";
import useAuthStore from "../../store/authStore";

const WS_URL =
  import.meta.env.VITE_WS_URL || "ws://localhost:3000/api/v1/chat/ws";

export default function ChatPage() {
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const wsRef = useRef(null);
  const bottomRef = useRef(null);

  // Load conversations
  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await getConversations();
        setConversations(data.conversations || data.data || []);
      } catch {
        toast.error("Failed to load conversations");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // Connect WebSocket
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    const ws = new WebSocket(`${WS_URL}?token=${token}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.conversationId === activeConvId) {
          setMessages((prev) => [...prev, msg]);
        }
      } catch {
        // ignore non-json frames
      }
    };

    ws.onerror = () => toast.error("WebSocket error");

    return () => ws.close();
  }, [activeConvId]);

  // Load messages when conversation changes
  useEffect(() => {
    if (!activeConvId) return;
    const fetch = async () => {
      try {
        const { data } = await getConversationMessages(activeConvId);
        setMessages(data.messages || data.data || []);
        await markAsRead(activeConvId);
      } catch {
        toast.error("Failed to load messages");
      }
    };
    fetch();
  }, [activeConvId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeConvId) return;
    try {
      await sendMessage(activeConvId, { content: text });
      setText("");
    } catch {
      toast.error("Failed to send message");
    }
  };

  const handleNewConversation = async () => {
    const recipientId = window.prompt("Enter user ID to chat with:");
    if (!recipientId) return;
    try {
      const { data } = await startOrGetConversation({ recipientId });
      const conv = data.conversation || data;
      setConversations((c) => [conv, ...c.filter((x) => x.id !== conv.id)]);
      setActiveConvId(conv.id);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    }
  };

  if (loading) return <div className="page-loader">Loading chat...</div>;

  const activeConv = conversations.find((c) => c.id === activeConvId);

  return (
    <div className="chat-layout">
      {/* Sidebar */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h3>Conversations</h3>
          <button onClick={handleNewConversation} className="btn-icon">
            +
          </button>
        </div>
        <div className="conversation-list">
          {conversations.map((conv) => {
            const other = conv.participants?.find((p) => p.id !== user?.id);
            return (
              <div
                key={conv.id}
                className={`conversation-item ${conv.id === activeConvId ? "active" : ""}`}
                onClick={() => setActiveConvId(conv.id)}
              >
                <strong>{other?.name || "Unknown"}</strong>
                <span className="last-message">
                  {conv.lastMessage?.content?.slice(0, 30) || "No messages"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat area */}
      <div className="chat-main">
        {activeConvId ? (
          <>
            <div className="chat-header">
              <h3>
                {activeConv?.participants?.find((p) => p.id !== user?.id)
                  ?.name || "Chat"}
              </h3>
            </div>

            <div className="message-list">
              {messages.map((msg, i) => (
                <div
                  key={msg.id || i}
                  className={`message ${msg.senderId === user?.id ? "message-mine" : "message-theirs"}`}
                >
                  {msg.mediaUrl && (
                    <img
                      src={`${import.meta.env.VITE_API_URL?.replace("/api/v1", "") || "http://localhost:3000"}${msg.mediaUrl}`}
                      alt="media"
                    />
                  )}
                  {msg.content && <p>{msg.content}</p>}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSend} className="message-form">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a message..."
              />
              <button type="submit" className="btn-primary">
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="chat-empty">
            <p>Select a conversation or start a new one</p>
          </div>
        )}
      </div>
    </div>
  );
}
