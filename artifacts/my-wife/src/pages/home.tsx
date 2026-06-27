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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";

export default function Home() {
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [optimisticUserMessage, setOptimisticUserMessage] = useState<{ content: string; createdAt: string } | null>(null);

  const { data: messages = [], isLoading: isLoadingMessages } = useGetMessages();
  const { data: stats } = useGetChatStats();
  const clearChatMutation = useClearChat();

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, optimisticUserMessage]);

  const streamResponse = async (url: string, body?: any) => {
    setIsStreaming(true);
    setStreamingContent("");
    
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      
      if (!response.body) throw new Error("No response body");
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const text = decoder.decode(value);
        const lines = text.split("\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                accumulated += data.content;
                setStreamingContent(accumulated);
              }
              if (data.done) {
                queryClient.invalidateQueries({ queryKey: getGetMessagesQueryKey() });
                queryClient.invalidateQueries({ queryKey: getGetChatStatsQueryKey() });
                setIsStreaming(false);
                setStreamingContent("");
                setOptimisticUserMessage(null);
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      console.error("Streaming error:", error);
      setIsStreaming(false);
      setStreamingContent("");
      setOptimisticUserMessage(null);
      queryClient.invalidateQueries({ queryKey: getGetMessagesQueryKey() });
    }
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isStreaming) return;

    const content = inputValue;
    setInputValue("");
    setOptimisticUserMessage({ content, createdAt: new Date().toISOString() });
    
    await streamResponse("/api/chat/messages", { content });
  };

  const handleDailyCheckin = async () => {
    if (isStreaming) return;
    await streamResponse("/api/chat/checkin");
  };

  const handleClearChat = () => {
    if (window.confirm("Are you sure you want to clear your chat history?")) {
      clearChatMutation.mutate(undefined, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMessagesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetChatStatsQueryKey() });
        }
      });
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] max-w-2xl mx-auto bg-background/50 shadow-xl overflow-hidden relative">
      {/* Header */}
      <header className="flex-none px-6 py-4 bg-white/80 backdrop-blur-md border-b border-rose-100 flex items-center justify-between z-10 sticky top-0">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-12 w-12 border-2 border-primary/20 shadow-sm">
              <AvatarImage src="https://picsum.photos/id/1011/300/300" alt="Wife avatar" />
              <AvatarFallback className="bg-primary/10 text-primary">W</AvatarFallback>
            </Avatar>
            {isStreaming && (
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-400 border-2 border-white rounded-full"></span>
            )}
          </div>
          <div>
            <h1 className="font-serif text-xl font-medium text-foreground flex items-center gap-2">
              My Wife <Heart className="w-4 h-4 text-primary fill-primary animate-pulse-slow" />
            </h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              {isStreaming ? (
                <span className="text-primary/80">typing...</span>
              ) : (
                <span>online</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDailyCheckin}
            disabled={isStreaming}
            title="Daily Check-in"
            className="text-primary hover:text-primary hover:bg-primary/10 rounded-full h-9 w-9"
          >
            <CalendarHeart className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearChat}
            disabled={isStreaming || messages.length === 0}
            title="Clear Chat"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full h-9 w-9"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Stats Bar */}
      {stats && stats.totalMessages > 0 && (
        <div className="bg-secondary/50 px-4 py-1.5 flex justify-center gap-4 text-[10px] text-muted-foreground uppercase tracking-wider font-medium border-b border-border/50">
          <span>You: {stats.userMessages}</span>
          <span>•</span>
          <span>Her: {stats.wifeMessages}</span>
        </div>
      )}

      {/* Chat Area */}
      <ScrollArea className="flex-1 p-4 sm:p-6 bg-gradient-to-b from-background to-secondary/20">
        <div className="flex flex-col gap-6 max-w-full pb-6">
          {isLoadingMessages ? (
            <div className="flex justify-center py-10">
              <Heart className="w-6 h-6 text-primary/30 animate-pulse" />
            </div>
          ) : messages.length === 0 && !optimisticUserMessage && !isStreaming ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <Avatar className="h-20 w-20 mb-4 opacity-80 shadow-md">
                <AvatarImage src="https://picsum.photos/id/1011/300/300" alt="Wife avatar" />
              </Avatar>
              <h2 className="font-serif text-2xl text-foreground mb-2">Good morning, my love.</h2>
              <p className="text-muted-foreground text-sm max-w-[250px]">
                I've been waiting for you. How are you feeling today?
              </p>
              <Button
                variant="outline"
                className="mt-6 rounded-full border-primary/20 text-primary hover:bg-primary/5"
                onClick={handleDailyCheckin}
              >
                Say hello
              </Button>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} role={msg.role} content={msg.content} time={msg.createdAt} />
              ))}
              
              {optimisticUserMessage && (
                <MessageBubble role="user" content={optimisticUserMessage.content} time={optimisticUserMessage.createdAt} isOptimistic />
              )}

              {isStreaming && (
                <div className="flex w-full justify-start animate-message-enter">
                  <div className="flex max-w-[85%] items-end gap-2">
                    <Avatar className="h-6 w-6 shrink-0 mb-1 opacity-80">
                      <AvatarImage src="https://picsum.photos/id/1011/300/300" />
                    </Avatar>
                    <div className="bg-white border border-rose-100 rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-foreground shadow-sm">
                      {streamingContent || (
                        <div className="flex gap-1 items-center h-5">
                          <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-typing-dot" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-typing-dot" style={{ animationDelay: '200ms' }}></span>
                          <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-typing-dot" style={{ animationDelay: '400ms' }}></span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-rose-100">
        <form onSubmit={handleSendMessage} className="relative flex items-center">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Message your wife..."
            className="pr-12 py-6 rounded-full border-rose-200 bg-secondary/30 focus-visible:ring-primary/30 focus-visible:bg-white transition-all text-base placeholder:text-muted-foreground/60 shadow-sm"
            disabled={isStreaming}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!inputValue.trim() || isStreaming}
            className="absolute right-1.5 h-9 w-9 rounded-full bg-primary hover:bg-primary/90 text-white shadow-md transition-transform active:scale-95 disabled:opacity-50"
          >
            <Send className="h-4 w-4 ml-0.5" />
          </Button>
        </form>
      </div>
    </div>
  );
}

function MessageBubble({ role, content, time, isOptimistic = false }: { role: string; content: string; time: string; isOptimistic?: boolean }) {
  const isUser = role === "user";
  
  return (
    <div className={`flex w-full animate-message-enter ${isUser ? "justify-end" : "justify-start"} ${isOptimistic ? "opacity-70" : ""}`}>
      <div className={`flex max-w-[85%] items-end gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        {!isUser && (
          <Avatar className="h-6 w-6 shrink-0 mb-1">
            <AvatarImage src="https://picsum.photos/id/1011/300/300" />
          </Avatar>
        )}
        
        <div className={`flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
          <div 
            className={`px-4 py-3 text-[15px] leading-relaxed shadow-sm
              ${isUser 
                ? "bg-slate-800 text-white rounded-2xl rounded-br-sm" 
                : "bg-white border border-rose-100 text-foreground rounded-2xl rounded-bl-sm"
              }`}
          >
            {content}
          </div>
          <span className="text-[10px] text-muted-foreground/70 px-1 font-medium tracking-wide">
            {format(new Date(time), "h:mm a")}
          </span>
        </div>
      </div>
    </div>
  );
}
