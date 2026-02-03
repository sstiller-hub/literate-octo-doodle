import { useState } from "react";
import { Bot, X, MessageCircle } from "lucide-react";
import { Button } from "@/app/components/ui/button";

interface AIInsightProps {
  insight: string;
  onExpand?: () => void;
  onDismiss?: () => void;
}

export function AIInsight({ insight, onExpand, onDismiss }: AIInsightProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <div className="px-1 py-2 border-l-2 border-primary/30 bg-primary/5 rounded-sm">
      <div className="flex items-start gap-2">
        <Bot className="size-3.5 text-primary mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-foreground leading-relaxed">
            {insight}
          </p>
          {onExpand && (
            <button
              onClick={onExpand}
              className="text-[10px] text-primary hover:underline mt-1.5 inline-flex items-center gap-1"
            >
              <MessageCircle className="size-2.5" />
              Tell me more
            </button>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          aria-label="Dismiss"
        >
          <X className="size-3" />
        </button>
      </div>
    </div>
  );
}
