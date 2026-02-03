import { useState } from "react";
import { Info } from "lucide-react";

interface DataConfidenceProps {
  level: 'high' | 'moderate' | 'low';
  reason?: string;
}

export function DataConfidence({ level, reason }: DataConfidenceProps) {
  const [showReason, setShowReason] = useState(false);

  const getLabelText = () => {
    switch (level) {
      case 'high':
        return 'High';
      case 'moderate':
        return 'Moderate';
      case 'low':
        return 'Low';
    }
  };

  const getOpacity = () => {
    switch (level) {
      case 'high':
        return 'text-muted-foreground/60';
      case 'moderate':
        return 'text-muted-foreground/70';
      case 'low':
        return 'text-muted-foreground/80';
    }
  };

  return (
    <div className="inline-flex flex-col gap-1">
      <button
        onClick={() => reason && setShowReason(!showReason)}
        className={`inline-flex items-center gap-1 text-[9px] tracking-wide ${getOpacity()} ${reason ? 'hover:text-muted-foreground transition-colors' : 'cursor-default'}`}
      >
        <span>Confidence: {getLabelText().toLowerCase()}</span>
        {reason && <Info className="size-2" />}
      </button>
      {showReason && reason && (
        <div className="text-[9px] text-muted-foreground/70 leading-relaxed space-y-1">
          <p>{reason}</p>
          <p className="italic opacity-60">
            Confidence reflects data quality, not performance outcomes.
          </p>
        </div>
      )}
    </div>
  );
}