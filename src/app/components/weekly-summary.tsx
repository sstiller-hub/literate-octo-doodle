import { Card, CardContent } from "@/app/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Moon, Activity, Weight as WeightIcon } from "lucide-react";

interface WeeklySummaryProps {
  summary: {
    weekNumber: number;
    dateRange: string;
    avgRecovery: number;
    avgSleep: number;
    avgStepsPerDay: number;
    avgWeight?: number;
    avgHRV: number;
    avgRestingHR: number;
    avgFeeling: number; // 1-5 scale
    trends: {
      feeling: number; // % change
      sleep: number;
      steps: number;
      weight: number;
      recovery: number;
    };
  };
  dailyData?: Array<{
    date: string;
    recovery: number;
  }>;
}

export function WeeklySummaryCard({ summary, dailyData }: WeeklySummaryProps) {
  const getRecoveryColor = (recovery: number) => {
    if (recovery >= 67) return 'bg-foreground/80';
    if (recovery >= 34) return 'bg-foreground/60';
    return 'bg-foreground/40';
  };

  const getFeelingText = (feeling: number) => {
    return feeling.toFixed(1);
  };

  const TrendIndicator = ({ value }: { value: number }) => {
    if (Math.abs(value) < 1) {
      return <Minus className="size-3 text-muted-foreground" />;
    }
    if (value > 0) {
      return (
        <div className="flex items-center gap-0.5 text-green-600">
          <TrendingUp className="size-3" />
          <span className="text-[10px] font-medium">+{value.toFixed(0)}%</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-0.5 text-red-600">
        <TrendingDown className="size-3" />
        <span className="text-[10px] font-medium">{value.toFixed(0)}%</span>
      </div>
    );
  };

  // Provide default trends if not available
  const trends = summary.trends || {
    feeling: 0,
    sleep: 0,
    steps: 0,
    weight: 0,
    recovery: 0
  };

  // Calculate weekly reliability signal
  const getReliabilitySignal = () => {
    if (!dailyData || dailyData.length < 7) return null;

    // Get last 7 days
    const lastWeek = dailyData.slice(-7);
    let alignedDays = 0;

    for (let i = 1; i < lastWeek.length; i++) {
      const today = lastWeek[i];
      const yesterday = lastWeek[i - 1];
      
      const readiness = Math.round(today.recovery);
      const prevReadiness = Math.round(yesterday.recovery);
      
      // Determine recommendation based on readiness
      const getRecommendation = (r: number) => {
        if (r >= 75) return 'high';
        if (r >= 55) return 'moderate';
        return 'recovery';
      };
      
      const recommendation = getRecommendation(prevReadiness);
      const readinessChange = readiness - prevReadiness;
      
      // Check if outcome aligned with recommendation
      // High intensity: expect stable or improving if recovery was good
      // Moderate: expect stable
      // Recovery: expect improvement
      const aligned = 
        (recommendation === 'high' && readinessChange >= -5) ||
        (recommendation === 'moderate' && readinessChange >= -8) ||
        (recommendation === 'recovery' && readinessChange >= -3);
      
      if (aligned) alignedDays++;
    }

    const daysChecked = lastWeek.length - 1; // We check day-to-day pairs
    
    if (alignedDays >= 5) {
      return `System recommendations matched observed trends most days this week.`;
    } else if (alignedDays >= 4) {
      return `Recommendations aligned with readiness trends on ${alignedDays} of ${daysChecked} days.`;
    } else {
      return `Recommendations aligned with readiness trends on ${alignedDays} of ${daysChecked} days.`;
    }
  };

  const reliabilitySignal = getReliabilitySignal();

  return (
    <Card className="border-2">
      <CardContent className="pt-6">
        <div className="flex items-center justify-end mb-4">
          <p className="text-sm text-muted-foreground">{summary.dateRange}</p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* How You Feel */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                Feeling
              </div>
              <TrendIndicator value={trends.feeling} />
            </div>
            <div className="text-xl font-bold">
              {summary.avgFeeling.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">
              /5 scale avg
            </div>
          </div>

          {/* Sleep */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Moon className="size-3" />
                Sleep
              </div>
              <TrendIndicator value={trends.sleep} />
            </div>
            <div className="text-xl font-bold">
              {summary.avgSleep.toFixed(1)}h
            </div>
            <div className="text-xs text-muted-foreground">
              per night avg
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Activity className="size-3" />
                Steps
              </div>
              <TrendIndicator value={trends.steps} />
            </div>
            <div className="text-xl font-bold">
              {(summary.avgStepsPerDay / 1000).toFixed(1)}k
            </div>
            <div className="text-xs text-muted-foreground">
              per day avg
            </div>
          </div>

          {/* Weight */}
          {summary.avgWeight && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <WeightIcon className="size-3" />
                  Weight
                </div>
                <TrendIndicator value={trends.weight} />
              </div>
              <div className="text-xl font-bold">
                {summary.avgWeight.toFixed(1)} lbs
              </div>
              <div className="text-xs text-muted-foreground">
                weekly avg
              </div>
            </div>
          )}
        </div>

        {/* Recovery Bar */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Recovery Score</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{summary.avgRecovery}%</span>
              <TrendIndicator value={trends.recovery} />
            </div>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full ${getRecoveryColor(summary.avgRecovery)} transition-all`}
              style={{ width: `${summary.avgRecovery}%` }}
            />
          </div>
        </div>

        {/* Reliability Signal */}
        {reliabilitySignal && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground/80">
              {reliabilitySignal}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}