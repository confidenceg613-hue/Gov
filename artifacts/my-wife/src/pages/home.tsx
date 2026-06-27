import { useState, useRef, useEffect, FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetMessages,
  getGetMessagesQueryKey,
  useClearChat,
  useGetChatStats,
  getGetChatStatsQueryKey,
} from "@workspace/api-client-react";
import { Send, Heart, Trash2, CalendarHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";

type LocalMessage = {
  id: number;
  role: string;
  content: string;
  createdAt: string;
};

export default function Home() {
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);

  const { data: serverMessages = [], isLoading } = useGetMessages();
  const { data: stats } = useGetChatStats();
  const clearChatMutation = useClearChat();

  useEffect(() => {
    if (serverMessages.length > 0) {
      setLocalMessages(serverMessages as LocalMessage[]);
    }
  }, [serverMessages]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [localMessages, isTyping]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    const content = inputValue.trim();
    if (!content || isTyping) return;

    setInputValue("");

    const tempId = Date.now();
    const tempUserMsg: LocalMessage = {
      id: tempId,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    setLocalMessages((prev) => [...prev, tempUserMsg]);

    setIsTyping(true);
    scrollToBottom();

    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) throw new Error("Request failed");

      const data = await res.json();

      await new Promise((r) => setTimeout(r, 600 + Math.random() * 800));

      setIsTyping(false);

      setLocalMessages((prev) => {
        const without = prev.filter((m) => m.id !== tempId);
        return [
          ...without,
          { ...data.userMessage, role: "user", content },
          data.assistantMessage,
        ];
      });

      queryClient.invalidateQueries({ queryKey: getGetChatStatsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetMessagesQueryKey() });
    } catch {
      setIsTyping(false);
      setLocalMessages((prev) => prev.filter((m) => m.id !== tempId));
    }

    inputRef.current?.focus();
  };

  const handleCheckin = async () => {
    if (isTyping) return;
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat/checkin", { method: "POST" });
      if (!res.ok) throw new Error("Checkin failed");
      const data = await res.json();

      await new Promise((r) => setTimeout(r, 700 + Math.random() * 600));

      setIsTyping(false);

      const msg: LocalMessage = {
        id: Date.now(),
        role: "assistant",
        content: data.content,
        createdAt: data.createdAt,
      };
      setLocalMessages((prev) => [...prev, msg]);

      queryClient.invalidateQueries({ queryKey: getGetMessagesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetChatStatsQueryKey() });
    } catch {
      setIsTyping(false);
    }
  };

  const handleClearChat = () => {
    if (!window.confirm("Clear your entire conversation?")) return;
    clearChatMutation.mutate(undefined, {
      onSuccess: () => {
        setLocalMessages([]);
        queryClient.invalidateQueries({ queryKey: getGetMessagesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetChatStatsQueryKey() });
      },
    });
  };

  const displayMessages = localMessages.length > 0 ? localMessages : (serverMessages as LocalMessage[]);
  const isEmpty = !isLoading && displayMessages.length === 0 && !isTyping;

  return (
    <div className="app-shell">
      {/* Romantic background */}
      <div className="bg-layer" aria-hidden="true">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />
      </div>

      {/* Chat card */}
      <div className="chat-card">
        {/* Header */}
        <header className="chat-header" data-testid="header">
          <div className="header-left">
            <div className="avatar-wrap">
              <Avatar className="avatar-img">
                <AvatarImage src="https://picsum.photos/id/1011/300/300" alt="Wife" />
                <AvatarFallback>W</AvatarFallback>
              </Avatar>
              <span className={`online-dot ${isTyping ? "typing-pulse" : ""}`} />
            </div>
            <div>
              <h1 className="header-title" data-testid="header-title">
                My Wife <Heart className="header-heart" />
              </h1>
              <p className="header-status" data-testid="header-status">
                {isTyping ? "typing…" : "online"}
              </p>
            </div>
          </div>
          <div className="header-actions">
            <button
              className="icon-btn"
              onClick={handleCheckin}
              disabled={isTyping}
              title="Daily Check-in"
              data-testid="button-checkin"
            >
              <CalendarHeart size={18} />
            </button>
            <button
              className="icon-btn icon-btn-danger"
              onClick={handleClearChat}
              disabled={isTyping || displayMessages.length === 0}
              title="Clear chat"
              data-testid="button-clear"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </header>

        {/* Stats */}
        {stats && stats.totalMessages > 0 && (
          <div className="stats-bar" data-testid="stats-bar">
            <span>You sent {stats.userMessages} message{stats.userMessages !== 1 ? "s" : ""}</span>
            <span className="stats-dot">·</span>
            <span>She replied {stats.wifeMessages} time{stats.wifeMessages !== 1 ? "s" : ""}</span>
          </div>
        )}

        {/* Messages */}
        <div className="messages-area" data-testid="messages-area">
          {isLoading ? (
            <div className="empty-state">
              <Heart className="empty-heart loading-pulse" />
            </div>
          ) : isEmpty ? (
            <div className="empty-state" data-testid="empty-state">
              <Avatar className="empty-avatar">
                <AvatarImage src="https://picsum.photos/id/1011/300/300" />
              </Avatar>
              <h2 className="empty-title">Good morning, my love.</h2>
              <p className="empty-sub">I've been waiting for you. Say something…</p>
              <button className="say-hello-btn" onClick={handleCheckin} data-testid="button-say-hello">
                Say hello
              </button>
            </div>
          ) : (
            <>
              {displayMessages.map((msg) => (
                <Bubble key={msg.id} msg={msg} />
              ))}

              {isTyping && (
                <div className="bubble-row bubble-row-wife" data-testid="typing-indicator">
                  <Avatar className="bubble-avatar">
                    <AvatarImage src="https://picsum.photos/id/1011/300/300" />
                  </Avatar>
                  <div className="bubble bubble-wife typing-bubble">
                    <span className="dot" style={{ animationDelay: "0ms" }} />
                    <span className="dot" style={{ animationDelay: "180ms" }} />
                    <span className="dot" style={{ animationDelay: "360ms" }} />
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input */}
        <form className="input-area" onSubmit={handleSendMessage} data-testid="message-form">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Message your wife…"
            className="message-input"
            disabled={isTyping}
            data-testid="input-message"
            autoComplete="off"
          />
          <Button
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            className="send-btn"
            data-testid="button-send"
          >
            <Send size={16} />
          </Button>
        </form>
      </div>
    </div>
  );
}

function Bubble({ msg }: { msg: LocalMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={`bubble-row ${isUser ? "bubble-row-user" : "bubble-row-wife"}`} data-testid={`message-${msg.role}-${msg.id}`}>
      {!isUser && (
        <Avatar className="bubble-avatar">
          <AvatarImage src="https://picsum.photos/id/1011/300/300" />
          <AvatarFallback>W</AvatarFallback>
        </Avatar>
      )}
      <div className={`bubble-group ${isUser ? "items-end" : "items-start"}`}>
        <div className={`bubble ${isUser ? "bubble-user" : "bubble-wife"}`}>{msg.content}</div>
        <span className="bubble-time">{format(new Date(msg.createdAt), "h:mm a")}</span>
      </div>
    </div>
  );
}
