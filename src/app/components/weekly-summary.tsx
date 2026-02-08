import { Card, CardContent } from "@/app/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Moon, Activity, Weight as WeightIcon } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";

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
    feeling?: number;
    sleep?: number;
    steps?: number;
    weight?: number;
    hrv?: number;
    restingHR?: number;
  }>;
}

export function WeeklySummaryCard({ summary, dailyData }: WeeklySummaryProps) {
  const [trendDetailOpen, setTrendDetailOpen] = useState(false);
  const [recoveryBreakdownOpen, setRecoveryBreakdownOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<{
    name: string;
    currentValue: number;
    previousValue: number;
    change: number;
    percentChange: number;
    unit: string;
  } | null>(null);
  
  const [recoveryBreakdown, setRecoveryBreakdown] = useState<{
    current: { hrv: number; sleep: number; rhr: number; total: number };
    previous: { hrv: number; sleep: number; rhr: number; total: number };
    changes: { hrv: number; sleep: number; rhr: number };
  } | null>(null);

  const getRecoveryColor = (recovery: number) => {
    if (recovery >= 67) return 'bg-foreground/80';
    if (recovery >= 34) return 'bg-foreground/60';
    return 'bg-foreground/40';
  };

  const getFeelingText = (feeling: number) => {
    return feeling.toFixed(1);
  };

  const TrendIndicator = ({ value, showDecimal = false, minThreshold = 1 }: { value: number; showDecimal?: boolean; minThreshold?: number }) => {
    if (Math.abs(value) < minThreshold) {
      return <Minus className="size-3 text-muted-foreground" />;
    }
    if (value > 0) {
      return (
        <div className="flex items-center gap-0.5 text-green-600">
          <TrendingUp className="size-3" />
          <span className="text-[10px] font-medium">
            +{showDecimal ? value.toFixed(1) : value.toFixed(0)}%
          </span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-0.5 text-red-600">
        <TrendingDown className="size-3" />
        <span className="text-[10px] font-medium">
          {showDecimal ? value.toFixed(1) : value.toFixed(0)}%
        </span>
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

  // Check if we have sufficient data for trends (need 14+ days)
  const hasTrendData = dailyData && dailyData.length >= 14;

  // For weight, always show trend if available (more sensitive)
  const hasWeightTrend = hasTrendData && Math.abs(trends.weight) >= 0.1;

  // Calculate previous week values for trend details
  const getPreviousWeekValue = (metric: 'feeling' | 'sleep' | 'steps' | 'weight' | 'recovery') => {
    if (!dailyData || dailyData.length < 14) return null;
    
    const last7Days = dailyData.slice(-7);
    const previous7Days = dailyData.slice(-14, -7);
    
    if (previous7Days.length !== 7) return null;
    
    let currentValue = 0;
    let previousValue = 0;
    
    switch (metric) {
      case 'feeling':
        currentValue = last7Days.reduce((sum, d) => sum + (d.feeling || 0), 0) / 7;
        previousValue = previous7Days.reduce((sum, d) => sum + (d.feeling || 0), 0) / 7;
        break;
      case 'sleep':
        currentValue = last7Days.reduce((sum, d) => sum + (d.sleep || 0), 0) / 7;
        previousValue = previous7Days.reduce((sum, d) => sum + (d.sleep || 0), 0) / 7;
        break;
      case 'steps':
        currentValue = last7Days.reduce((sum, d) => sum + (d.steps || 0), 0) / 7;
        previousValue = previous7Days.reduce((sum, d) => sum + (d.steps || 0), 0) / 7;
        break;
      case 'weight':
        currentValue = last7Days.reduce((sum, d) => sum + (d.weight || 0), 0) / 7;
        previousValue = previous7Days.reduce((sum, d) => sum + (d.weight || 0), 0) / 7;
        break;
      case 'recovery':
        currentValue = last7Days.reduce((sum, d) => sum + (d.recovery || 0), 0) / 7;
        previousValue = previous7Days.reduce((sum, d) => sum + (d.recovery || 0), 0) / 7;
        break;
    }
    
    return { currentValue, previousValue };
  };

  // Handle trend click to show details
  const handleTrendClick = (metric: 'feeling' | 'sleep' | 'steps' | 'weight' | 'recovery') => {
    // Special handling for recovery - show breakdown instead
    if (metric === 'recovery') {
      handleRecoveryClick();
      return;
    }
    
    const values = getPreviousWeekValue(metric);
    if (!values) return;
    
    const { currentValue, previousValue } = values;
    const change = currentValue - previousValue;
    const percentChange = trends[metric];
    
    const metricConfig: Record<typeof metric, { name: string; unit: string; decimals: number }> = {
      feeling: { name: 'Feeling', unit: '/5', decimals: 1 },
      sleep: { name: 'Sleep', unit: 'h', decimals: 1 },
      steps: { name: 'Steps', unit: '', decimals: 0 },
      weight: { name: 'Weight', unit: 'lbs', decimals: 1 },
      recovery: { name: 'Recovery', unit: '%', decimals: 0 },
    };
    
    const config = metricConfig[metric];
    
    setSelectedMetric({
      name: config.name,
      currentValue: metric === 'steps' ? Math.round(currentValue) : Number(currentValue.toFixed(config.decimals)),
      previousValue: metric === 'steps' ? Math.round(previousValue) : Number(previousValue.toFixed(config.decimals)),
      change: metric === 'steps' ? Math.round(change) : Number(change.toFixed(config.decimals)),
      percentChange,
      unit: config.unit,
    });
    setTrendDetailOpen(true);
  };

  // Handle recovery click to show breakdown of contributing factors
  const handleRecoveryClick = () => {
    if (!dailyData || dailyData.length < 14) return;
    
    const last7Days = dailyData.slice(-7);
    const previous7Days = dailyData.slice(-14, -7);
    
    if (previous7Days.length !== 7) return;
    
    // Calculate averages for current week
    const currentHRV = last7Days.reduce((sum, d) => sum + (d.hrv || 0), 0) / 7;
    const currentSleep = last7Days.reduce((sum, d) => sum + (d.sleep || 0), 0) / 7;
    const currentRHR = last7Days.reduce((sum, d) => sum + (d.restingHR || 0), 0) / 7;
    
    // Calculate averages for previous week
    const previousHRV = previous7Days.reduce((sum, d) => sum + (d.hrv || 0), 0) / 7;
    const previousSleep = previous7Days.reduce((sum, d) => sum + (d.sleep || 0), 0) / 7;
    const previousRHR = previous7Days.reduce((sum, d) => sum + (d.restingHR || 0), 0) / 7;
    
    // Calculate percentage changes
    const hrvChange = previousHRV > 0 ? ((currentHRV - previousHRV) / previousHRV) * 100 : 0;
    const sleepChange = previousSleep > 0 ? ((currentSleep - previousSleep) / previousSleep) * 100 : 0;
    const rhrChange = previousRHR > 0 ? ((currentRHR - previousRHR) / previousRHR) * 100 : 0;
    
    setRecoveryBreakdown({
      current: {
        hrv: Math.round(currentHRV),
        sleep: Number(currentSleep.toFixed(1)),
        rhr: Math.round(currentRHR),
        total: summary.avgRecovery
      },
      previous: {
        hrv: Math.round(previousHRV),
        sleep: Number(previousSleep.toFixed(1)),
        rhr: Math.round(previousRHR),
        total: Math.round(previous7Days.reduce((sum, d) => sum + d.recovery, 0) / 7)
      },
      changes: {
        hrv: Number(hrvChange.toFixed(1)),
        sleep: Number(sleepChange.toFixed(1)),
        rhr: Number(rhrChange.toFixed(1))
      }
    });
    setRecoveryBreakdownOpen(true);
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
    <>
      {/* Trend Detail Modal */}
      <Dialog open={trendDetailOpen} onOpenChange={setTrendDetailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedMetric?.name} Trend</DialogTitle>
            <DialogDescription>Week-over-week comparison</DialogDescription>
          </DialogHeader>
          {selectedMetric && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Previous Week</p>
                  <p className="text-2xl font-bold">
                    {selectedMetric.unit === '' 
                      ? selectedMetric.previousValue.toLocaleString()
                      : `${selectedMetric.previousValue}${selectedMetric.unit}`}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">This Week</p>
                  <p className="text-2xl font-bold">
                    {selectedMetric.unit === '' 
                      ? selectedMetric.currentValue.toLocaleString()
                      : `${selectedMetric.currentValue}${selectedMetric.unit}`}
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Change</span>
                  <span className={`text-lg font-semibold ${selectedMetric.change > 0 ? 'text-green-600' : selectedMetric.change < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                    {selectedMetric.change > 0 ? '+' : ''}{selectedMetric.unit === '' 
                      ? selectedMetric.change.toLocaleString()
                      : `${selectedMetric.change}${selectedMetric.unit}`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Percentage</span>
                  <span className={`text-lg font-semibold ${selectedMetric.percentChange > 0 ? 'text-green-600' : selectedMetric.percentChange < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                    {selectedMetric.percentChange > 0 ? '+' : ''}{selectedMetric.name === 'Weight' ? selectedMetric.percentChange.toFixed(1) : selectedMetric.percentChange.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Recovery Breakdown Modal */}
      <Dialog open={recoveryBreakdownOpen} onOpenChange={setRecoveryBreakdownOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Recovery Score Breakdown</DialogTitle>
            <DialogDescription>Contributing factors (HRV 35% · Sleep 35% · Resting HR 30%)</DialogDescription>
          </DialogHeader>
          {recoveryBreakdown && (
            <div className="space-y-4">
              {/* Overall Recovery */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Previous Week</p>
                  <p className="text-3xl font-bold">
                    {recoveryBreakdown.previous.total}%
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">This Week</p>
                  <p className="text-3xl font-bold">
                    {recoveryBreakdown.current.total}%
                  </p>
                </div>
              </div>
              
              {/* Contributing Factors */}
              <div className="pt-4 border-t space-y-4">
                <p className="text-sm font-medium">What Changed:</p>
                
                {/* HRV */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Heart Rate Variability</span>
                    <span className={`text-sm font-semibold ${recoveryBreakdown.changes.hrv > 0 ? 'text-green-600' : recoveryBreakdown.changes.hrv < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                      {recoveryBreakdown.changes.hrv > 0 ? '+' : ''}{recoveryBreakdown.changes.hrv.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{recoveryBreakdown.previous.hrv}ms → {recoveryBreakdown.current.hrv}ms</span>
                    <span className="text-xs">(35% weight) • higher is better</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed italic">
                    HRV measures variation between heartbeats. Higher = better autonomic nervous system balance, lower stress, better recovery state.
                  </p>
                </div>

                {/* Sleep */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Sleep Duration</span>
                    <span className={`text-sm font-semibold ${recoveryBreakdown.changes.sleep > 0 ? 'text-green-600' : recoveryBreakdown.changes.sleep < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                      {recoveryBreakdown.changes.sleep > 0 ? '+' : ''}{recoveryBreakdown.changes.sleep.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{recoveryBreakdown.previous.sleep}h → {recoveryBreakdown.current.sleep}h</span>
                    <span className="text-xs">(35% weight)</span>
                  </div>
                </div>

                {/* Resting HR */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Resting Heart Rate</span>
                    <span className={`text-sm font-semibold ${recoveryBreakdown.changes.rhr < 0 ? 'text-green-600' : recoveryBreakdown.changes.rhr > 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                      {recoveryBreakdown.changes.rhr > 0 ? '+' : ''}{recoveryBreakdown.changes.rhr.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{recoveryBreakdown.previous.rhr}bpm → {recoveryBreakdown.current.rhr}bpm</span>
                    <span className="text-xs">(30% weight) • lower is better</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed italic">
                    Elevated RHR suggests stress, fatigue, or incomplete recovery from training.
                  </p>
                </div>
              </div>

              {/* Explanation */}
              <div className="pt-4 border-t bg-muted/30 rounded-md p-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong>Note:</strong> Recovery score is calculated from HRV, Sleep, and Resting HR only. 
                  Other metrics like Feeling, Steps, and Weight are shown for context but don't directly affect your recovery score.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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
                {hasTrendData && (
                  <button 
                    type="button"
                    onClick={() => handleTrendClick('feeling')} 
                    className="cursor-pointer hover:opacity-70 transition-opacity active:scale-95 touch-manipulation"
                  >
                    <TrendIndicator value={trends.feeling} />
                  </button>
                )}
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
                {hasTrendData && (
                  <button 
                    type="button"
                    onClick={() => handleTrendClick('sleep')} 
                    className="cursor-pointer hover:opacity-70 transition-opacity active:scale-95 touch-manipulation"
                  >
                    <TrendIndicator value={trends.sleep} />
                  </button>
                )}
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
                {hasTrendData && (
                  <button 
                    type="button"
                    onClick={() => handleTrendClick('steps')} 
                    className="cursor-pointer hover:opacity-70 transition-opacity active:scale-95 touch-manipulation"
                  >
                    <TrendIndicator value={trends.steps} />
                  </button>
                )}
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
                  {hasWeightTrend && (
                    <button 
                      type="button"
                      onClick={() => handleTrendClick('weight')} 
                      className="cursor-pointer hover:opacity-70 transition-opacity active:scale-95 touch-manipulation"
                    >
                      <TrendIndicator value={trends.weight} showDecimal={true} minThreshold={0.1} />
                    </button>
                  )}
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
                {hasTrendData && (
                  <button 
                    type="button"
                    onClick={() => handleTrendClick('recovery')} 
                    className="cursor-pointer hover:opacity-70 transition-opacity active:scale-95 touch-manipulation"
                  >
                    <TrendIndicator value={trends.recovery} />
                  </button>
                )}
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
    </>
  );
}