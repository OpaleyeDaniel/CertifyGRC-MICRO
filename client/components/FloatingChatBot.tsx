import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, X, Bot } from "lucide-react";

interface ChatMessage {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
}

export function FloatingChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      text: "Hello! I'm your NIST CSF 2.0 Assistant. I can help you with compliance guidance, risk assessment questions, and framework recommendations. How can I assist you today?",
      sender: "ai",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponses = [
        "That's a great question. Could you provide more details about your specific compliance needs?",
        "Based on NIST CSF 2.0, I recommend reviewing the Governance and Risk Management functions. Would you like more information?",
        "I can help with that. The NIST Cybersecurity Framework focuses on six core functions. Which area interests you most?",
        "That's important for your compliance posture. Let me provide some guidance on best practices for this scenario.",
        "I understand. For cybersecurity compliance, you should consider implementing controls across all six NIST functions.",
      ];

      const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: randomResponse,
        sender: "ai",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 w-96 max-w-[calc(100vw-2rem)] z-50">
          <Card className="h-[600px] flex flex-col shadow-2xl border-primary/10 bg-white">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-primary/80 text-white rounded-t-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 p-2 rounded-lg">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">NIST CSF 2.0 Assistant</h3>
                  <p className="text-xs text-white/70">Compliance & Security Guidance</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-white/20 text-white"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-3 rounded-lg ${
                        message.sender === "user"
                          ? "bg-primary text-white rounded-br-none shadow-md"
                          : "bg-muted text-foreground rounded-bl-none border border-border shadow-sm"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.text}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.sender === "user" ? "text-white/70" : "text-muted-foreground"
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted text-foreground rounded-lg rounded-bl-none px-4 py-3 border border-border shadow-sm">
                      <div className="flex gap-2">
                        <div className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse" />
                        <div className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse delay-100" />
                        <div className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse delay-200" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t border-border p-4 bg-white rounded-b-lg">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask about NIST CSF 2.0..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  className="bg-muted/50 border-border focus:ring-primary focus:ring-1"
                />
                <Button
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputValue.trim()}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Press Enter to send • Powered by NIST CSF 2.0
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Floating Trigger Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          size="icon"
          className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
          title="Open NIST CSF 2.0 Assistant"
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <>
              <MessageCircle className="h-6 w-6" />
              {/* Notification badge - optional */}
              <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
            </>
          )}
        </Button>
      </div>
    </>
  );
}
