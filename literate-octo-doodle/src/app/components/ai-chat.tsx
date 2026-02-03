import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Send, Loader2, Bot, User, Sparkles } from "lucide-react";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatProps {
  onSendMessage: (message: string) => Promise<string>;
  hasHealthData: boolean;
  initialPrompt?: string | null;
}

export function AIChat({ onSendMessage, hasHealthData, initialPrompt }: AIChatProps) {
  const getInitialMessage = () => {
    if (!hasHealthData) {
      return `👋 **Welcome to your performance tracker!**

I'm here to help you understand readiness to train.

**🎯 Quick Start:**

**1. Upload Your Data**
• Settings → Upload Data
• Or start with daily "How You Feel" check-in

**2. Track Daily**
• Daily check-in (1-5 rating)
• App calculates 7-day rolling averages
• View trends in Rolling or Daily mode

**3. Understand Readiness**
• Tap readiness % to see why it changed
• Sleep, HRV, and RHR drive the score
• Focus on trends, not single days

**💬 Ask me:**
• \"How do I export Apple Health data?\"
• \"What is readiness based on?\"
• \"How do rolling averages work?\"

Ready to get started?`;
    }
    
    return null; // No initial message when user has data - show idle state
  };

  const initialMsg = getInitialMessage();
  const [messages, setMessages] = useState<Message[]>(
    initialMsg ? [{ role: 'assistant', content: initialMsg }] : []
  );
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Handle initialPrompt from "Tell me more" button
  useEffect(() => {
    if (initialPrompt) {
      setInput(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await onSendMessage(userMessage);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="flex flex-col h-[500px]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Bot className="size-4" />
          AI Health Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-3 p-4 pt-0">
        <ScrollArea className="flex-1 pr-3">
          <div className="space-y-4">
            {messages.length === 0 && hasHealthData && (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center px-4">
                <Sparkles className="size-8 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground/70">
                  AI insights appear when something meaningful changes.
                </p>
              </div>
            )}
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="size-3 text-primary" />
                  </div>
                )}
                <div
                  className={`rounded-lg px-3 py-2 max-w-[85%] text-sm ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {message.content}
                </div>
                {message.role === 'user' && (
                  <div className="size-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="size-3 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2">
                <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="size-3 text-primary" />
                </div>
                <div className="rounded-lg px-3 py-2 bg-muted">
                  <Loader2 className="size-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
        
        <div className="flex gap-2">
          <Input
            placeholder="Ask about your health data..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={handleSend} 
            disabled={isLoading || !input.trim()}
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}