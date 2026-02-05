import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Info, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Progress } from "@/app/components/ui/progress";

interface ReadinessExplainerProps {
  readiness: number;
  sleep: number;
  hrv: number;
  restingHR: number;
  previousReadiness?: number;
  trigger?: React.ReactNode;
}

// Calculation weights matching demo-data.ts
const WEIGHTS = {
  hrv: 0.40,      // 40% - Each +1ms HRV adds ~0.8%
  sleep: 0.35,    // 35% - Each hour matters
  restingHR: 0.25 // 25% - Lower is better
};

export function ReadinessExplainer({ 
  readiness, 
  sleep, 
  hrv, 
  restingHR,
  previousReadiness,
  trigger 
}: ReadinessExplainerProps) {
  const safeSleep = Number.isFinite(sleep) ? sleep : null;
  const safeHrv = Number.isFinite(hrv) ? hrv : null;
  const safeRhr = Number.isFinite(restingHR) ? restingHR : null;

  // Calculate individual contributions
  const sleepContribution = (safeSleep != null ? (safeSleep - 7) * 8 : 0).toFixed(1);
  const hrvContribution = (safeHrv != null ? (safeHrv - 50) * 0.8 : 0).toFixed(1);
  const rhrContribution = (safeRhr != null ? (60 - safeRhr) * 0.5 : 0).toFixed(1);

  const change = previousReadiness 
    ? readiness - previousReadiness 
    : 0;

  const getTrendIcon = (value: number) => {
    if (value > 2) return <TrendingUp className="size-3 text-green-500" />;
    if (value < -2) return <TrendingDown className="size-3 text-red-500" />;
    return <Minus className="size-3 text-muted-foreground" />;
  };

  const getContributionColor = (value: number) => {
    const num = parseFloat(value.toString());
    if (num > 5) return "text-green-600";
    if (num < -5) return "text-red-600";
    return "text-muted-foreground";
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <button className="inline-flex items-center justify-center hover:opacity-70 transition-opacity">
            <Info className="size-4 text-muted-foreground" />
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">Readiness Breakdown</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Understand the factors contributing to your readiness for training.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current Readiness */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Current Readiness</span>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-semibold">{readiness}%</span>
                {previousReadiness && (
                  <span className={`text-sm ${change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                    {change > 0 ? '+' : ''}{change.toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
            <Progress value={readiness} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {readiness >= 67 ? "Ready for high-intensity training" : 
               readiness >= 34 ? "Moderate training recommended" : 
               "Focus on recovery"}
            </p>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-4">Contributing Factors</h4>
            
            <div className="space-y-4">
              {/* Sleep */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Sleep</span>
                    <span className="text-xs text-muted-foreground">{(WEIGHTS.sleep * 100).toFixed(0)}% weight</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(parseFloat(sleepContribution))}
                    <span className="text-sm font-medium">
                      {safeSleep != null ? `${safeSleep.toFixed(1)}h` : "--"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={safeSleep != null ? Math.min(100, (safeSleep / 9) * 100) : 0} className="h-1.5 flex-1" />
                  <span className={`text-xs font-medium w-12 text-right ${getContributionColor(sleepContribution)}`}>
                    {parseFloat(sleepContribution) > 0 ? '+' : ''}{sleepContribution}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Target: 7-9 hours
                </p>
              </div>

              {/* HRV */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">HRV</span>
                    <span className="text-xs text-muted-foreground">{(WEIGHTS.hrv * 100).toFixed(0)}% weight</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(parseFloat(hrvContribution))}
                    <span className="text-sm font-medium">
                      {safeHrv != null ? `${safeHrv}ms` : "--"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={safeHrv != null ? Math.min(100, (safeHrv / 75) * 100) : 0} className="h-1.5 flex-1" />
                  <span className={`text-xs font-medium w-12 text-right ${getContributionColor(hrvContribution)}`}>
                    {parseFloat(hrvContribution) > 0 ? '+' : ''}{hrvContribution}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Higher values indicate better recovery
                </p>
              </div>

              {/* Resting HR */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Resting HR</span>
                    <span className="text-xs text-muted-foreground">{(WEIGHTS.restingHR * 100).toFixed(0)}% weight</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(parseFloat(rhrContribution))}
                    <span className="text-sm font-medium">
                      {safeRhr != null ? `${safeRhr} bpm` : "--"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={safeRhr != null ? Math.min(100, ((75 - safeRhr) / 25) * 100) : 0} className="h-1.5 flex-1" />
                  <span className={`text-xs font-medium w-12 text-right ${getContributionColor(rhrContribution)}`}>
                    {parseFloat(rhrContribution) > 0 ? '+' : ''}{rhrContribution}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Lower values indicate better fitness
                </p>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-xs text-muted-foreground">
              <strong>How it works:</strong> Readiness combines sleep duration, heart rate variability, and resting heart rate to assess your body's preparedness for training. Higher readiness = better capacity for high-intensity work.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
