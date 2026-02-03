import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

interface DailyCheckInProps {
  onSave: (feeling: number, note: string, date: string) => void;
  onLoadExisting: (date: string) => Promise<{ feeling?: number; note?: string } | null>;
}

export function DailyCheckIn({ onSave, onLoadExisting }: DailyCheckInProps) {
  const today = new Date().toISOString().split('T')[0];
  const currentHour = new Date().getHours();
  
  // Time-aware: de-emphasize after 11am
  const isMorning = currentHour < 11;
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedFeeling, setSelectedFeeling] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);

  const feelings = [
    { value: 1, emoji: "1", label: "Poor" },
    { value: 2, emoji: "2", label: "Low" },
    { value: 3, emoji: "3", label: "Fair" },
    { value: 4, emoji: "4", label: "Good" },
    { value: 5, emoji: "5", label: "High" },
  ];

  // Load existing data for today
  useEffect(() => {
    const loadExistingData = async () => {
      const existing = await onLoadExisting(today);
      if (existing && existing.feeling) {
        setSelectedFeeling(existing.feeling);
        setNote(existing.note || "");
        setHasCheckedIn(true);
      } else {
        setSelectedFeeling(null);
        setNote("");
        setHasCheckedIn(false);
      }
    };
    
    loadExistingData();
  }, [today, onLoadExisting]);

  const handleSave = () => {
    if (selectedFeeling) {
      onSave(selectedFeeling, note, today);
      setSaved(true);
      setHasCheckedIn(true);
      setTimeout(() => {
        setSaved(false);
        setIsExpanded(false); // Collapse after save
      }, 1500);
    }
  };

  const getPromptText = () => {
    if (hasCheckedIn && selectedFeeling) {
      const feeling = feelings.find(f => f.value === selectedFeeling);
      return `Feeling: ${feeling?.emoji} ${feeling?.label}`;
    }
    return isMorning ? "How are you feeling today?" : "Anything worth noting?";
  };

  // Collapsed state
  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/50"
      >
        <span className="flex items-center gap-2">
          {getPromptText()}
          {hasCheckedIn && <Check className="size-3 text-green-600" />}
        </span>
        <ChevronDown className="size-3" />
      </button>
    );
  }

  // Expanded state
  return (
    <div className="border border-border rounded-lg p-3 space-y-3 bg-muted/20">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {hasCheckedIn ? "Update how you're feeling" : "Add context (optional)"}
        </p>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronUp className="size-4" />
        </button>
      </div>

      {/* Feeling Selection - Compact */}
      <div className="grid grid-cols-5 gap-1.5">
        {feelings.map((feeling) => (
          <button
            key={feeling.value}
            onClick={() => setSelectedFeeling(feeling.value)}
            className={`
              flex flex-col items-center justify-center p-2 rounded-md border transition-all
              ${selectedFeeling === feeling.value 
                ? 'border-primary bg-primary/10' 
                : 'border-border hover:border-primary/50 hover:bg-muted'
              }
            `}
          >
            <span className="text-xl">{feeling.emoji}</span>
            <span className="text-[9px] font-medium text-center mt-0.5">{feeling.label}</span>
          </button>
        ))}
      </div>

      {/* Optional Note */}
      {selectedFeeling && (
        <div className="space-y-1.5">
          <Textarea
            placeholder="Any context? Sleep, stress, energy..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="text-xs resize-none"
          />
        </div>
      )}

      {/* Save Button */}
      {selectedFeeling && (
        <Button 
          onClick={handleSave} 
          size="sm"
          className="w-full h-8 text-xs"
          variant={saved ? "outline" : "default"}
        >
          {saved ? (
            <>
              <Check className="size-3 mr-1.5" />
              Logged
            </>
          ) : hasCheckedIn ? (
            'Update'
          ) : (
            'Log'
          )}
        </Button>
      )}
    </div>
  );
}