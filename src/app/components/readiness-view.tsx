import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { ReadinessExplainer } from "@/app/components/readiness-explainer";
import { AIInsight } from "@/app/components/ai-insight";
import { CausalReinforcement } from "@/app/components/causal-reinforcement";
import { DataConfidence } from "@/app/components/data-confidence";
import { Moon, Activity as ActivityIcon, Heart } from "lucide-react";

interface DailyData {
  date: string;
  recovery: number;
  feeling: number;
  sleep: number;
  hrv: number;
  restingHR: number;
  activeMinutes: number;
  steps?: number;
  weight?: number;
}

interface ReadinessViewProps {
  data: DailyData[];
  viewMode: 'rolling' | 'daily';
  daysToShow?: 7 | 14 | 30 | 90 | 365;
  onExpandAIChat?: (context: string) => void;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const deriveReadiness = (
  sleep?: number,
  hrv?: number,
  restingHR?: number,
) => {
  if (!Number.isFinite(sleep) || !Number.isFinite(hrv) || !Number.isFinite(restingHR)) {
    return null;
  }

  const baseRecovery = 60;
  const recovery =
    baseRecovery +
    (hrv - 50) * 0.8 +
    (8 - restingHR / 10) * 2 +
    (sleep - 7) * 8;

  return Math.round(clamp(recovery, 20, 95));
};

const getReadinessValue = (d: DailyData) => {
  if (Number.isFinite(d.recovery)) return d.recovery;
  const derived = deriveReadiness(d.sleep, d.hrv, d.restingHR);
  return derived ?? NaN;
};

const average = (values: number[]) => {
  const nums = values.filter((v) => Number.isFinite(v));
  if (nums.length === 0) return NaN;
  return nums.reduce((sum, v) => sum + v, 0) / nums.length;
};

// Calculate 7-day rolling average
function calculateRollingAverage(data: DailyData[], days: number = 7) {
  if (data.length < days) return [];
  
  const result = [];
  for (let i = days - 1; i < data.length; i++) {
    const window = data.slice(i - days + 1, i + 1);
    
    result.push({
      date: data[i].date,
      readiness: average(window.map(getReadinessValue)),
      sleep: average(window.map((d) => d.sleep)),
      hrv: average(window.map((d) => d.hrv)),
      restingHR: average(window.map((d) => d.restingHR)),
      feeling: average(window.map((d) => d.feeling || 3)),
    });
  }
  
  return result;
}

export function ReadinessView({ data, viewMode, daysToShow = 30, onExpandAIChat }: ReadinessViewProps) {
  // Process data based on view mode
  const processedData = viewMode === 'rolling' 
    ? calculateRollingAverage(data, 7)
    : data.map(d => ({
        date: d.date,
        readiness: getReadinessValue(d),
        sleep: d.sleep,
        hrv: d.hrv,
        restingHR: d.restingHR,
        feeling: d.feeling || 3,
      }));

  // Filter by days to show
  const filteredData = processedData.slice(-daysToShow);
  
  if (filteredData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Readiness to Train</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const current = filteredData[filteredData.length - 1];
  const previous = filteredData.length > 1 ? filteredData[filteredData.length - 2] : null;
  const weekAgo = filteredData.length > 7 ? filteredData[filteredData.length - 8] : null;

  const readiness = Number.isFinite(current.readiness)
    ? Math.round(current.readiness)
    : null;
  const change =
    previous && readiness != null && Number.isFinite(previous.readiness)
      ? readiness - Math.round(previous.readiness)
      : 0;

  // Daily Takeaway - Decision surface, explicitly prescriptive
  const getDailyTakeaway = () => {
    if (!Number.isFinite(current.readiness)) {
      return "Readiness unavailable. Add sleep, HRV, and resting HR to generate recovery.";
    }

    const readiness = Math.round(current.readiness);
    const sleep = current.sleep;
    const hrv = Math.round(current.hrv);
    const rhr = Math.round(current.restingHR);

    let prefix = '';
    let action = '';

    // Core readiness bands
    if (readiness >= 75) {
      action = viewMode === 'daily'
        ? 'High-intensity training is supported.'
        : 'High-intensity training is supported by the trend.';
    } else if (readiness >= 55) {
      action = viewMode === 'daily'
        ? 'Moderate training recommended. Cap peak intensity.'
        : 'Moderate training recommended. Cap peak intensity for consistency.';
    } else {
      action = viewMode === 'daily'
        ? 'Prioritize recovery or light movement.'
        : 'Prioritize recovery or light movement until the trend improves.';
    }

    // Identify primary driver/limiter if not in top band
    if (readiness < 75) {
      // Calculate contributions (same logic as ReadinessExplainer)
      const sleepContribution = (sleep - 7) * 8;
      const hrvContribution = (hrv - 50) * 0.8;
      const rhrContribution = (60 - rhr) * 0.5;

      const contributions = [
        { name: 'Sleep', value: sleepContribution },
        { name: 'HRV', value: hrvContribution },
        { name: 'RHR', value: rhrContribution }
      ].sort((a, b) => a.value - b.value);

      const limiter = contributions[0];
      
      // If the limiter is significantly worse than others
      if (limiter.value < contributions[1].value - 3) {
        if (limiter.name === 'Sleep') {
          action += viewMode === 'daily'
            ? ' Sleep duration was the constraint.'
            : ' Sleep duration is the primary limiter.';
        } else if (limiter.name === 'HRV') {
          action += ' HRV indicates incomplete recovery.';
        } else {
          action += viewMode === 'daily'
            ? ' Elevated resting HR suggests fatigue.'
            : ' Elevated resting HR trend suggests accumulated fatigue.';
        }
      } else {
        action += ' Mixed signals across metrics.';
      }
    } else {
      // Top band - note what's supportive
      action += viewMode === 'daily'
        ? ' Sleep and HRV are supportive.'
        : ' Sleep and HRV trends are supportive.';
    }

    return action;
  };

  const dailyTakeaway = getDailyTakeaway();

  // AI Trigger Detection - Event-driven AI insights
  const getAITrigger = () => {
    // Helper to get primary limiter
    const getPrimaryLimiter = (sleep: number, hrv: number, rhr: number) => {
      const sleepContribution = (sleep - 7) * 8;
      const hrvContribution = (hrv - 50) * 0.8;
      const rhrContribution = (60 - rhr) * 0.5;

      const contributions = [
        { name: 'Sleep', value: sleepContribution },
        { name: 'HRV', value: hrvContribution },
        { name: 'RHR', value: rhrContribution }
      ].sort((a, b) => a.value - b.value);

      return contributions[0].name;
    };

    const comparisonPoint = viewMode === 'rolling' ? weekAgo : previous;
    if (!comparisonPoint) return null;

    if (!Number.isFinite(comparisonPoint.readiness) || readiness == null) return null;

    const comparisonReadiness = Math.round(comparisonPoint.readiness);
    const readinessChange = Math.abs(readiness - comparisonReadiness);
    const signedChange = readiness - comparisonReadiness;

    // Trigger A: Readiness Shift (±10% or more)
    if (readinessChange >= 10) {
      const direction = signedChange > 0 ? 'increased' : 'dropped';
      const sleepChange = current.sleep - comparisonPoint.sleep;
      const hrvChange = current.hrv - comparisonPoint.hrv;
      
      if (signedChange < 0) {
        // Decline
        if (sleepChange < -0.5) {
          return `Readiness ${direction} ${readinessChange}% vs ${viewMode === 'rolling' ? 'last week' : 'yesterday'}. Sleep consistency declined and recovery metrics softened.`;
        } else if (hrvChange < -5) {
          return `Readiness ${direction} ${readinessChange}% vs ${viewMode === 'rolling' ? 'last week' : 'yesterday'}. HRV dropped ${Math.abs(hrvChange).toFixed(0)}ms, indicating accumulated fatigue.`;
        } else {
          return `Readiness ${direction} ${readinessChange}% vs ${viewMode === 'rolling' ? 'last week' : 'yesterday'}. Mixed driver decline across sleep and recovery markers.`;
        }
      } else {
        // Improvement
        if (sleepChange > 0.5) {
          return `Readiness ${direction} ${readinessChange}% vs ${viewMode === 'rolling' ? 'last week' : 'yesterday'}. Sleep gains drove the recovery improvement.`;
        } else if (hrvChange > 5) {
          return `Readiness ${direction} ${readinessChange}% vs ${viewMode === 'rolling' ? 'last week' : 'yesterday'}. HRV increased ${hrvChange.toFixed(0)}ms, showing strong adaptation.`;
        } else {
          return `Readiness ${direction} ${readinessChange}% vs ${viewMode === 'rolling' ? 'last week' : 'yesterday'}. Broad improvement across recovery markers.`;
        }
      }
    }

    // Trigger B: Driver Constraint Change
    const currentLimiter = getPrimaryLimiter(current.sleep, current.hrv, current.restingHR);
    const previousLimiter = getPrimaryLimiter(comparisonPoint.sleep, comparisonPoint.hrv, comparisonPoint.restingHR);
    
    if (currentLimiter !== previousLimiter && readiness < 75) {
      return `Sleep improved, but ${currentLimiter} is now the limiting factor.`;
    }

    // Trigger C: Threshold Crossing
    const previousBand = comparisonReadiness >= 75 ? 'high' : comparisonReadiness >= 55 ? 'moderate' : 'low';
    const currentBand = readiness >= 75 ? 'high' : readiness >= 55 ? 'moderate' : 'low';
    
    if (previousBand !== currentBand) {
      if (currentBand === 'high') {
        return `You moved from ${previousBand} to high readiness. Training intensity can increase.`;
      } else if (currentBand === 'moderate' && previousBand === 'high') {
        return `Readiness dropped from high to moderate. Cap intensity but maintain training volume.`;
      } else if (currentBand === 'low') {
        return `Readiness crossed into low territory. Prioritize recovery before resuming high loads.`;
      } else if (currentBand === 'moderate' && previousBand === 'low') {
        return `Readiness recovered to moderate band. Light to moderate training is appropriate.`;
      }
    }

    // No trigger met - stay silent
    return null;
  };

  const aiTrigger = getAITrigger();

  // Causal Reinforcement Detection - Factual cause → effect acknowledgment
  const getCausalReinforcement = () => {
    // Require sufficient data - never show on first occurrence
    if (filteredData.length < 7) return null;

    // Only show one reinforcement at a time - prioritize recent windows
    // Look at last 7 days for behavior pattern and readiness response
    
    const last7Days = filteredData.slice(-7);
    const prior7Days = filteredData.length >= 14 ? filteredData.slice(-14, -7) : null;
    
    if (!prior7Days || prior7Days.length < 7) return null;

    // Calculate averages for comparison windows
    const recentAvgSleep = average(last7Days.map((d) => d.sleep));
    const priorAvgSleep = average(prior7Days.map((d) => d.sleep));
    
    const recentAvgHRV = average(last7Days.map((d) => d.hrv));
    const priorAvgHRV = average(prior7Days.map((d) => d.hrv));
    
    const recentAvgRHR = average(last7Days.map((d) => d.restingHR));
    const priorAvgRHR = average(prior7Days.map((d) => d.restingHR));
    
    const recentAvgReadiness = average(last7Days.map((d) => d.readiness));
    const priorAvgReadiness = average(prior7Days.map((d) => d.readiness));

    // Detect behavior changes (input)
    if (
      !Number.isFinite(recentAvgSleep) ||
      !Number.isFinite(priorAvgSleep) ||
      !Number.isFinite(recentAvgHRV) ||
      !Number.isFinite(priorAvgHRV) ||
      !Number.isFinite(recentAvgRHR) ||
      !Number.isFinite(priorAvgRHR) ||
      !Number.isFinite(recentAvgReadiness) ||
      !Number.isFinite(priorAvgReadiness)
    ) {
      return null;
    }

    const sleepChange = recentAvgSleep - priorAvgSleep;
    const hrvChange = recentAvgHRV - priorAvgHRV;
    const rhrChange = recentAvgRHR - priorAvgRHR;
    const readinessChange = recentAvgReadiness - priorAvgReadiness;

    // Calculate sleep consistency (standard deviation)
    const recentSleepStdDev = Math.sqrt(
      last7Days.reduce((sum, d) => sum + Math.pow(d.sleep - recentAvgSleep, 2), 0) / 7
    );
    const priorSleepStdDev = Math.sqrt(
      prior7Days.reduce((sum, d) => sum + Math.pow(d.sleep - priorAvgSleep, 2), 0) / 7
    );
    const consistencyImproved = recentSleepStdDev < priorSleepStdDev - 0.3;
    const consistencyDeclined = recentSleepStdDev > priorSleepStdDev + 0.3;

    // POSITIVE REINFORCEMENT
    // Pattern 1: Improved sleep consistency → higher readiness
    if (consistencyImproved && readinessChange >= 5) {
      return "Improved sleep consistency this week corresponded with higher readiness.";
    }

    // Pattern 2: Increased sleep duration → readiness recovery
    if (sleepChange >= 0.5 && readinessChange >= 5) {
      if (last7Days.filter(d => d.sleep >= 7.5).length >= 3) {
        return "Readiness recovered after three nights of longer sleep.";
      }
    }

    // Pattern 3: HRV stabilization following behavior change
    if (hrvChange >= 5 && readinessChange >= 5) {
      // Check if RHR also stabilized (decreased)
      if (rhrChange <= -2) {
        return "Reduced training load preceded HRV stabilization.";
      }
    }

    // Pattern 4: Sleep duration improvement → readiness improvement
    if (sleepChange >= 0.7 && readinessChange >= 6) {
      return "Extended sleep duration this week corresponded with readiness gains.";
    }

    // NEGATIVE REINFORCEMENT
    // Pattern 5: Short sleep → declining readiness
    if (sleepChange <= -0.5 && readinessChange <= -5) {
      return "Short sleep duration this week coincided with declining readiness.";
    }

    // Pattern 6: Inconsistent sleep → readiness decline
    if (consistencyDeclined && readinessChange <= -5) {
      return "Inconsistent sleep timing this week preceded readiness decline.";
    }

    // Pattern 7: Elevated RHR → readiness drop
    if (rhrChange >= 3 && readinessChange <= -5) {
      return "Increased load preceded elevated resting heart rate.";
    }

    // Pattern 8: HRV decline → readiness decline
    if (hrvChange <= -8 && readinessChange <= -5) {
      return "Declining HRV over the week preceded reduced readiness.";
    }

    // No clear causality - stay silent
    return null;
  };

  const causalReinforcement = getCausalReinforcement();

  // Data Confidence Model - Trust signal based on data quality
  const getDataConfidence = (): { level: 'high' | 'moderate' | 'low'; reason?: string } => {
    // Get raw data for today (not processed/averaged)
    const todayRaw = data[data.length - 1];
    const yesterdayRaw = data.length > 1 ? data[data.length - 2] : null;
    
    if (!todayRaw) {
      return { level: 'low', reason: 'No data available for today.' };
    }

    let issues: string[] = [];
    let score = 0; // Internal scoring: 0-2 = low, 3-4 = moderate, 5+ = high

    // A. Data Presence - Check all key inputs
    const hasSleep = todayRaw.sleep > 0;
    const hasHRV = todayRaw.hrv > 0;
    const hasRHR = todayRaw.restingHR > 0;

    if (hasSleep) score++;
    else issues.push('Sleep data missing');

    if (hasHRV) score++;
    else issues.push('HRV data missing');

    if (hasRHR) score++;
    else issues.push('Resting heart rate missing');

    // B. Data Recency - Check if today's date matches actual today
    const todayDate = new Date(todayRaw.date);
    const actualToday = new Date();
    const daysDiff = Math.floor((actualToday.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) {
      score += 2; // Fresh data gets bonus points
    } else if (daysDiff === 1) {
      score += 1;
      issues.push('Data is from yesterday');
    } else if (daysDiff > 1) {
      issues.push(`Data is ${daysDiff} days old`);
    }

    // C. Consistency - Check for erratic values in recent window
    if (filteredData.length >= 3) {
      const last3 = filteredData.slice(-3);
      
      // Check sleep variability (standard deviation)
      const sleepAvg = last3.reduce((sum, d) => sum + d.sleep, 0) / 3;
      const sleepStdDev = Math.sqrt(
        last3.reduce((sum, d) => sum + Math.pow(d.sleep - sleepAvg, 2), 0) / 3
      );
      
      // Check HRV variability (coefficient of variation)
      const hrvAvg = last3.reduce((sum, d) => sum + d.hrv, 0) / 3;
      const hrvStdDev = Math.sqrt(
        last3.reduce((sum, d) => sum + Math.pow(d.hrv - hrvAvg, 2), 0) / 3
      );
      const hrvCV = hrvStdDev / hrvAvg;

      // Penalize high variability
      if (sleepStdDev > 2) {
        score -= 1;
        issues.push('Sleep data is erratic');
      } else {
        score += 1; // Bonus for consistency
      }

      if (hrvCV > 0.25) {
        score -= 1;
        issues.push('HRV data shows high variability');
      }
    }

    // Check for sparse rolling window (if in rolling mode)
    if (viewMode === 'rolling' && filteredData.length < 7) {
      score -= 1;
      issues.push('Insufficient data for 7-day average');
    }

    // Conservative scoring - when in doubt, downgrade
    let level: 'high' | 'moderate' | 'low';
    if (score >= 5) {
      level = 'high';
    } else if (score >= 3) {
      level = 'moderate';
    } else {
      level = 'low';
    }

    // Build reason string if confidence is not high
    const reason = level !== 'high' && issues.length > 0
      ? issues[0] // Show only the primary issue
      : undefined;

    return { level, reason };
  };

  const dataConfidence = getDataConfidence();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatXAxis = (dateStr: string) => {
    const date = new Date(dateStr);
    if (daysToShow && daysToShow <= 14) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Calculate average readiness for the period
  const avgReadiness = average(filteredData.map((d) => d.readiness));

  // Find highest and lowest points
  const sorted = filteredData
    .filter((d) => Number.isFinite(d.readiness))
    .slice()
    .sort((a, b) => a.readiness - b.readiness);
  const lowest = sorted[0];
  const highest = sorted[sorted.length - 1];

  // Determine insight based on trend
  const getInsight = () => {
    if (!weekAgo || readiness == null || !Number.isFinite(weekAgo.readiness)) return null;
    
    const weekChange = readiness - Math.round(weekAgo.readiness);
    const sleepChange = current.sleep - weekAgo.sleep;
    
    if (weekChange > 8) {
      return `Readiness improving. ${sleepChange > 0.5 ? 'Sleep gains driving recovery.' : 'HRV and RHR showing positive adaptation.'}`;
    } else if (weekChange < -8) {
      if (sleepChange < -0.5) {
        return `Sleep was the bottleneck this week. Keep training volume moderate.`;
      }
      return `Readiness declining. Consider a recovery day or reduced intensity.`;
    } else {
      if (!Number.isFinite(avgReadiness)) return `Readiness stable. Maintain current training load.`;
      return `Readiness stable around ${Math.round(avgReadiness)}%. Maintain current training load.`;
    }
  };

  const insight = getInsight();

  // Calculate baselines (exclude-recent: days 8-37)
  // This shows "how different is this week vs my established baseline?"
  const calculateBaseline = (metric: 'sleep' | 'hrv' | 'restingHR') => {
    // Need at least 14 days total (7 recent + 7 for baseline)
    if (processedData.length < 14) return null;
    
    // Use days 8-37 from the END of the full dataset (exclude last 7 days)
    const endIndex = processedData.length - 7;
    const startIndex = Math.max(0, endIndex - 30);
    const baselineWindow = processedData.slice(startIndex, endIndex);
    
    if (baselineWindow.length < 7) return null;

    const values = baselineWindow
      .map((d) => d[metric])
      .filter((v) => Number.isFinite(v)) as number[];
    if (values.length === 0) return null;

    const sum = values.reduce((acc, v) => acc + v, 0);
    return sum / values.length;
  };

  const sleepBaseline = calculateBaseline('sleep');
  const hrvBaseline = calculateBaseline('hrv');
  const rhrBaseline = calculateBaseline('restingHR');

  const safeSleep = Number.isFinite(current.sleep) ? current.sleep : null;
  const safeHrv = Number.isFinite(current.hrv) ? current.hrv : null;
  const safeRhr = Number.isFinite(current.restingHR) ? current.restingHR : null;

  // Get last 7 days for mini trend charts
  const last7Days = filteredData.slice(-7);

  return (
    <div className="space-y-4">
      {/* Readiness Summary - Small and understated */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Readiness</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-semibold">
                      {readiness != null ? `${readiness}%` : "--"}
                    </span>
                    {readiness != null && change !== 0 && (
                      <span className={`text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {change > 0 ? '+' : ''}{change}%
                      </span>
                    )}
                  </div>
                </div>
                {readiness != null && (
                  <ReadinessExplainer
                    readiness={readiness}
                    sleep={current.sleep}
                    hrv={Math.round(current.hrv)}
                    restingHR={Math.round(current.restingHR)}
                    previousReadiness={
                      previous && Number.isFinite(previous.readiness)
                        ? Math.round(previous.readiness)
                        : undefined
                    }
                  />
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {readiness == null
                  ? "Readiness unavailable"
                  : readiness >= 67
                  ? "Ready for high-intensity training"
                  : readiness >= 34
                  ? "Moderate training recommended"
                  : "Focus on recovery"}
              </p>
            </div>

            {/* Key contributing metrics */}
            <div className="flex gap-4 text-sm">
              <div className="text-right">
                <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
                  <Moon className="size-3" />
                  <span className="text-xs">Sleep</span>
                </div>
                <p className="text-2xl font-semibold">
                  {safeSleep != null ? safeSleep.toFixed(1) : "--"}
                  <span className="text-sm font-normal text-muted-foreground">h</span>
                </p>
                {Number.isFinite(sleepBaseline) && safeSleep != null && (
                  <div className="mt-1">
                    <div className="w-16 h-6 ml-auto">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={last7Days}>
                          <Line 
                            type="monotone" 
                            dataKey="sleep" 
                            stroke={safeSleep >= sleepBaseline ? "hsl(142 76% 36%)" : "hsl(25 95% 53%)"}
                            strokeWidth={1.5}
                            dot={false}
                          />
                          <ReferenceLine 
                            y={sleepBaseline} 
                            stroke="hsl(var(--muted-foreground))" 
                            strokeDasharray="2 2"
                            opacity={0.4}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <p className={`text-[9px] mt-0.5 ${safeSleep >= sleepBaseline ? 'text-green-600' : 'text-orange-600'}`}>
                      {safeSleep >= sleepBaseline ? '+' : ''}{(safeSleep - sleepBaseline).toFixed(1)}h
                    </p>
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
                  <Heart className="size-3" />
                  <span className="text-xs">HRV</span>
                </div>
                <p className="text-2xl font-semibold">
                  {safeHrv != null ? Math.round(safeHrv) : "--"}
                  <span className="text-sm font-normal text-muted-foreground">ms</span>
                </p>
                {Number.isFinite(hrvBaseline) && safeHrv != null && (
                  <div className="mt-1">
                    <div className="w-16 h-6 ml-auto">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={last7Days}>
                          <Line 
                            type="monotone" 
                            dataKey="hrv" 
                            stroke={safeHrv >= hrvBaseline ? "hsl(142 76% 36%)" : "hsl(25 95% 53%)"}
                            strokeWidth={1.5}
                            dot={false}
                          />
                          <ReferenceLine 
                            y={hrvBaseline} 
                            stroke="hsl(var(--muted-foreground))" 
                            strokeDasharray="2 2"
                            opacity={0.4}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <p className={`text-[9px] mt-0.5 ${safeHrv >= hrvBaseline ? 'text-green-600' : 'text-orange-600'}`}>
                      {safeHrv >= hrvBaseline ? '+' : ''}{Math.round(safeHrv - hrvBaseline)}ms
                    </p>
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
                  <ActivityIcon className="size-3" />
                  <span className="text-xs">RHR</span>
                </div>
                <p className="text-2xl font-semibold">
                  {safeRhr != null ? Math.round(safeRhr) : "--"}
                  <span className="text-sm font-normal text-muted-foreground">bpm</span>
                </p>
                {Number.isFinite(rhrBaseline) && safeRhr != null && (
                  <div className="mt-1">
                    <div className="w-16 h-6 ml-auto">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={last7Days}>
                          <Line 
                            type="monotone" 
                            dataKey="restingHR" 
                            stroke={safeRhr <= rhrBaseline ? "hsl(142 76% 36%)" : "hsl(25 95% 53%)"}
                            strokeWidth={1.5}
                            dot={false}
                          />
                          <ReferenceLine 
                            y={rhrBaseline} 
                            stroke="hsl(var(--muted-foreground))" 
                            strokeDasharray="2 2"
                            opacity={0.4}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <p className={`text-[9px] mt-0.5 ${safeRhr <= rhrBaseline ? 'text-green-600' : 'text-orange-600'}`}>
                      {safeRhr <= rhrBaseline ? '' : '+'}{Math.round(safeRhr - rhrBaseline)}bpm
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Takeaway - Decision surface */}
      <div className="px-1 space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70">
            {viewMode === 'daily' ? 'Today' : '7-Day Trend'}
          </p>
          <DataConfidence level={dataConfidence.level} reason={dataConfidence.reason} />
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {dailyTakeaway}
        </p>
      </div>

      {/* AI Insight - Event-driven, appears only when triggered */}
      {aiTrigger && (
        <AIInsight 
          insight={aiTrigger} 
          onExpand={onExpandAIChat ? () => onExpandAIChat(aiTrigger) : undefined}
        />
      )}

      {/* Causal Reinforcement - Factual cause → effect acknowledgment */}
      {causalReinforcement && (
        <CausalReinforcement message={causalReinforcement} />
      )}

      {/* Readiness Trend - Primary chart */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-base">
                {viewMode === 'rolling' ? 'Recent Trend (7-Day Avg)' : 'Recent Readiness Trend'}
              </CardTitle>
              {insight && (
                <CardDescription className="mt-1.5 font-medium">{insight}</CardDescription>
              )}
            </div>
            <div className="text-right text-sm">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground/60">Context</p>
              <p className="font-semibold">
                {Number.isFinite(avgReadiness) ? `${Math.round(avgReadiness)}%` : "--"}
              </p>
              <p className="text-[9px] text-muted-foreground/60">period avg</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={filteredData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatXAxis}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                domain={[0, 100]}
                ticks={[0, 100]}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
                labelFormatter={formatDate}
                formatter={(value: number) => [`${Math.round(value)}%`, 'Readiness']}
              />
              <ReferenceLine 
                y={67} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="3 3" 
                opacity={0.3}
                label={{ value: 'High', position: 'right', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              />
              <ReferenceLine 
                y={34} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="3 3" 
                opacity={0.3}
                label={{ value: 'Low', position: 'right', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              />
              <Line 
                type="monotone" 
                dataKey="readiness" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={viewMode === 'daily' ? { fill: 'hsl(var(--primary))', r: 3 } : false}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Sleep Trend - Secondary chart explaining readiness */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Sleep History</CardTitle>
          <CardDescription>
            Primary recovery driver • Target: 7-9 hours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={filteredData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatXAxis}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                domain={[5, 10]}
                ticks={[5, 10]}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
                labelFormatter={formatDate}
                formatter={(value: number) => [`${value.toFixed(1)}h`, 'Sleep']}
              />
              <ReferenceLine 
                y={7} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="3 3" 
                opacity={0.3}
              />
              <Line 
                type="monotone" 
                dataKey="sleep" 
                stroke="hsl(142 76% 36%)" 
                strokeWidth={2}
                dot={viewMode === 'daily' ? { fill: 'hsl(142 76% 36%)', r: 3 } : false}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
