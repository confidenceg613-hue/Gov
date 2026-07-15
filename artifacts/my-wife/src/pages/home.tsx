import { useState, useRef, useEffect, useCallback, FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  useGetMessages,
  getGetMessagesQueryKey,
  useClearChat,
  useGetChatStats,
  getGetChatStatsQueryKey,
} from "@workspace/api-client-react";
import { Send, Heart, Trash2, CalendarHeart, Images, MapPin, Briefcase, Camera, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";

const BASE = import.meta.env.BASE_URL;
const PROFILE_PHOTO = `${BASE}her/wedding-2.png`;

type LocalMessage = {
  id: number;
  role: string;
  content: string;
  createdAt: string;
};

// Parse [IMAGE:path] caption format
function parseImageMessage(content: string): { imageUrl: string; caption: string } | null {
  const match = content.match(/^\[IMAGE:([^\]]+)\]\s*(.*)/s);
  if (!match) return null;
  return { imageUrl: match[1], caption: match[2].trim() };
}

// Strip emojis and image tags so TTS sounds natural
function cleanForSpeech(text: string): string {
  return text
    .replace(/^\[IMAGE:[^\]]+\]\s*/g, "")
    // eslint-disable-next-line no-misleading-character-class
    .replace(/[\u{1F300}-\u{1FFFF}\u{2600}-\u{27BF}]/gu, "")
    .replace(/[❤️💕💗💓💞💘]/g, "")
    .trim();
}

// Speak text using Web Speech API with a natural female voice
function speakMia(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const clean = cleanForSpeech(text);
  if (!clean) return;
  const utterance = new SpeechSynthesisUtterance(clean);
  const trySpeak = () => {
    const voices = window.speechSynthesis.getVoices();
    // Prefer natural-sounding English female voices
    const preferred = ["Samantha", "Victoria", "Karen", "Moira", "Fiona", "Tessa", "Veena", "Allison", "Ava", "Susan", "Zoe"];
    let voice = voices.find((v) => v.lang.startsWith("en") && preferred.some((name) => v.name.includes(name)));
    if (!voice) voice = voices.find((v) => v.lang.startsWith("en-US") && v.name.toLowerCase().includes("female"));
    if (!voice) voice = voices.find((v) => v.lang.startsWith("en-US"));
    if (!voice) voice = voices.find((v) => v.lang.startsWith("en"));
    if (voice) utterance.voice = voice;
    utterance.pitch = 1.08;
    utterance.rate = 0.93;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  };
  // Voices may not be loaded yet on first call
  if (window.speechSynthesis.getVoices().length > 0) {
    trySpeak();
  } else {
    window.speechSynthesis.onvoiceschanged = () => { trySpeak(); window.speechSynthesis.onvoiceschanged = null; };
  }
}

export default function Home() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const [showPhotoBar, setShowPhotoBar] = useState(false);
  const [photoRequest, setPhotoRequest] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const speak = useCallback((text: string) => {
    if (voiceEnabled) speakMia(text);
  }, [voiceEnabled]);

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
    setLocalMessages((prev) => [...prev, { id: tempId, role: "user", content, createdAt: new Date().toISOString() }]);
    setIsTyping(true);

    try {
      const res = await fetch(`${BASE}api/chat/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();

      const delay = 900 + Math.random() * 1200;
      await new Promise((r) => setTimeout(r, delay));

      setIsTyping(false);
      const reply = data.assistantMessage as LocalMessage;
      setLocalMessages((prev) => {
        const without = prev.filter((m) => m.id !== tempId);
        return [...without, { ...data.userMessage, content }, reply];
      });
      speak(reply.content);

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
      const res = await fetch(`${BASE}api/chat/checkin`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      await new Promise((r) => setTimeout(r, 600 + Math.random() * 900));
      setIsTyping(false);
      setLocalMessages((prev) => [...prev, { id: Date.now(), role: "assistant", content: data.content, createdAt: data.createdAt }]);
      speak(data.content);
      queryClient.invalidateQueries({ queryKey: getGetMessagesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetChatStatsQueryKey() });
    } catch {
      setIsTyping(false);
    }
  };

  const handleRequestPhoto = async (e?: FormEvent) => {
    e?.preventDefault();
    const scene = photoRequest.trim() || "send me a photo of yourself";
    if (isTyping) return;

    setShowPhotoBar(false);
    setPhotoRequest("");

    // Show user request bubble
    const tempId = Date.now();
    const userContent = `📷 ${scene}`;
    setLocalMessages((prev) => [...prev, { id: tempId, role: "user", content: userContent, createdAt: new Date().toISOString() }]);
    setIsTyping(true);

    try {
      // Try AI generation first, fall back to gallery pick
      const res = await fetch(`${BASE}api/chat/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scene }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();

      await new Promise((r) => setTimeout(r, 800 + Math.random() * 800));
      setIsTyping(false);
      setLocalMessages((prev) => {
        const without = prev.filter((m) => m.id !== tempId);
        return [
          ...without,
          { id: tempId, role: "user", content: userContent, createdAt: new Date().toISOString() },
          { id: data.id, role: "assistant", content: data.content, createdAt: data.createdAt },
        ];
      });
      speak(data.content);

      queryClient.invalidateQueries({ queryKey: getGetMessagesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetChatStatsQueryKey() });
    } catch {
      setIsTyping(false);
      setLocalMessages((prev) => prev.filter((m) => m.id !== tempId));
    }

    inputRef.current?.focus();
  };

  const handleClearChat = () => {
    if (!window.confirm("Clear your entire conversation? Her memory of your name and details will be kept.")) return;
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

  const statsName = (stats as any)?.userName;

  return (
    <div className="app-shell">
      <div className="bg-layer" aria-hidden="true">
        <div className="bg-orb bg-orb-1" />
        <div className="bg-orb bg-orb-2" />
        <div className="bg-orb bg-orb-3" />
      </div>

      <div className="chat-card">
        {/* Header */}
        <header className="chat-header" data-testid="header">
          <div className="header-left">
            <div className="avatar-wrap">
              <button className="avatar-btn" onClick={() => setLocation("/gallery")} title="View her gallery" data-testid="button-avatar">
                <Avatar className="avatar-img">
                  <AvatarImage src={PROFILE_PHOTO} alt="My wife" />
                  <AvatarFallback>W</AvatarFallback>
                </Avatar>
              </button>
              <span className={`online-dot ${isTyping ? "typing-pulse" : ""}`} />
            </div>
            <div>
              <h1 className="header-title" data-testid="header-title">
                Mia <Heart className="header-heart" />
              </h1>
              <p className="header-status" data-testid="header-status">
                {isTyping ? "typing…" : statsName ? `online · loves ${statsName}` : "online · always yours"}
              </p>
            </div>
          </div>
          <div className="header-actions">
            <button
              className={`icon-btn ${voiceEnabled ? "icon-btn-voice-on" : ""}`}
              onClick={() => { setVoiceEnabled((v) => !v); window.speechSynthesis?.cancel(); }}
              title={voiceEnabled ? "Mia's voice on — click to mute" : "Mia's voice off — click to unmute"}
              data-testid="button-voice"
            >
              {voiceEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
            </button>
            <button className="icon-btn" onClick={() => setLocation("/gallery")} title="Her Gallery" data-testid="button-gallery">
              <Images size={17} />
            </button>
            <button className="icon-btn" onClick={handleCheckin} disabled={isTyping} title="Daily Check-in" data-testid="button-checkin">
              <CalendarHeart size={17} />
            </button>
            <button className="icon-btn icon-btn-danger" onClick={handleClearChat} disabled={isTyping || displayMessages.length === 0} title="Clear chat" data-testid="button-clear">
              <Trash2 size={15} />
            </button>
          </div>
        </header>

        {/* Stats */}
        {stats && stats.totalMessages > 0 && (
          <div className="stats-bar" data-testid="stats-bar">
            {statsName && <span>She loves you, {statsName}</span>}
            {!statsName && <span>You sent {stats.userMessages} message{stats.userMessages !== 1 ? "s" : ""}</span>}
            <span className="stats-dot">·</span>
            <span>She replied {stats.wifeMessages} time{stats.wifeMessages !== 1 ? "s" : ""}</span>
          </div>
        )}

        {/* Messages */}
        <div className="messages-area" data-testid="messages-area">
          {isLoading ? (
            <div className="empty-state"><Heart className="empty-heart loading-pulse" /></div>
          ) : isEmpty ? (
            <div className="empty-state" data-testid="empty-state">
              <button className="empty-avatar-btn" onClick={() => setLocation("/gallery")} data-testid="button-empty-avatar">
                <img src={PROFILE_PHOTO} alt="Mia" className="empty-avatar-img" />
              </button>
              <h2 className="empty-title">Hi, my love. I'm Mia.</h2>
              <div className="profile-tags">
                <span className="profile-tag"><MapPin size={11} /> Los Angeles · Filipino-American</span>
                <span className="profile-tag"><Briefcase size={11} /> School Counselor</span>
                <span className="profile-tag"><Heart size={11} className="tag-heart" /> Married Jun 14 · Malibu</span>
              </div>
              <p className="empty-sub">Ask me anything — or just say hello. I'm always here for you. 💕</p>
              <button className="say-hello-btn" onClick={handleCheckin} data-testid="button-say-hello">
                Say hello
              </button>
            </div>
          ) : (
            <>
              {displayMessages.map((msg) => (
                <Bubble key={msg.id} msg={msg} profilePhoto={PROFILE_PHOTO} />
              ))}
              {isTyping && (
                <div className="bubble-row bubble-row-wife" data-testid="typing-indicator">
                  <Avatar className="bubble-avatar">
                    <AvatarImage src={PROFILE_PHOTO} />
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

        {/* Photo request bar */}
        {showPhotoBar && (
          <form className="photo-bar" onSubmit={handleRequestPhoto}>
            <Camera size={15} className="photo-bar-icon" />
            <input
              ref={photoInputRef}
              className="photo-bar-input"
              placeholder="Describe the photo… (e.g. at the beach, date night)"
              value={photoRequest}
              onChange={(e) => setPhotoRequest(e.target.value)}
              autoFocus
            />
            <button type="submit" className="photo-bar-send">Send 📷</button>
            <button type="button" className="photo-bar-cancel" onClick={() => { setShowPhotoBar(false); setPhotoRequest(""); }}>✕</button>
          </form>
        )}

        {/* Input */}
        <form className="input-area" onSubmit={handleSendMessage} data-testid="message-form">
          <button
            type="button"
            className={`icon-btn camera-btn ${showPhotoBar ? "camera-btn-active" : ""}`}
            onClick={() => setShowPhotoBar((v) => !v)}
            disabled={isTyping}
            title="Request a photo"
            data-testid="button-camera"
          >
            <Camera size={17} />
          </button>
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => { setInputValue(e.target.value); window.speechSynthesis?.cancel(); }}
            placeholder="Message your wife…"
            className="message-input"
            disabled={isTyping}
            data-testid="input-message"
            autoComplete="off"
          />
          <Button type="submit" disabled={!inputValue.trim() || isTyping} className="send-btn" data-testid="button-send">
            <Send size={16} />
          </Button>
        </form>
      </div>
    </div>
  );
}

function Bubble({ msg, profilePhoto }: { msg: LocalMessage; profilePhoto: string }) {
  const isUser = msg.role === "user";
  const imageData = !isUser ? parseImageMessage(msg.content) : null;
  const BASE = import.meta.env.BASE_URL;

  return (
    <div className={`bubble-row ${isUser ? "bubble-row-user" : "bubble-row-wife"}`} data-testid={`message-${msg.role}-${msg.id}`}>
      {!isUser && (
        <Avatar className="bubble-avatar">
          <AvatarImage src={profilePhoto} />
          <AvatarFallback>W</AvatarFallback>
        </Avatar>
      )}
      <div className={`bubble-group ${isUser ? "items-end" : "items-start"}`}>
        {imageData ? (
          <div className="bubble bubble-wife bubble-photo">
            <img
              src={imageData.imageUrl.startsWith("http") ? imageData.imageUrl : `${BASE}${imageData.imageUrl}`}
              alt="Photo from Mia"
              className="chat-photo"
              loading="lazy"
            />
            {imageData.caption && (
              <p className="chat-photo-caption">{imageData.caption}</p>
            )}
          </div>
        ) : (
          <div className={`bubble ${isUser ? "bubble-user" : "bubble-wife"}`}>{msg.content}</div>
        )}
        <span className="bubble-time">{format(new Date(msg.createdAt), "h:mm a")}</span>
      </div>
    </div>
  );
}
