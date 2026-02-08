import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ComposedChart, ReferenceLine } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Badge } from "@/app/components/ui/badge";
import { Activity, Heart, Battery, Zap, TrendingUp, TrendingDown } from "lucide-react";

interface PerformanceData {
  weekly: Array<{
    week: string;
    recovery: number;
    strain: number;
    sleep: number;
    hrv: number;
    restingHR: number;
    activeMinutes: number;
  }>;
  daily?: Array<{
    date: string;
    recovery: number;
    strain: number;
    sleep: number;
  }>;
}

interface PerformanceDashboardProps {
  data: PerformanceData;
  timeHorizon: 'week' | 'month' | 'quarter';
  onTimeHorizonChange: (value: 'week' | 'month' | 'quarter') => void;
}

export function PerformanceDashboard({ data, timeHorizon, onTimeHorizonChange }: PerformanceDashboardProps) {
  // Calculate current week stats
  const currentWeek = data.weekly[data.weekly.length - 1];
  const previousWeek = data.weekly[data.weekly.length - 2];
  
  const recoveryChange = currentWeek && previousWeek 
    ? ((currentWeek.recovery - previousWeek.recovery) / previousWeek.recovery * 100).toFixed(0)
    : '0';
  
  const strainChange = currentWeek && previousWeek
    ? ((currentWeek.strain - previousWeek.strain) / previousWeek.strain * 100).toFixed(0)
    : '0';

  const getReadinessColor = (recovery: number) => {
    if (recovery >= 67) return 'text-green-500';
    if (recovery >= 34) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getReadinessStatus = (recovery: number) => {
    if (recovery >= 67) return 'Ready to Perform';
    if (recovery >= 34) return 'Moderate Readiness';
    return 'Recovery Needed';
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Time Horizon Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Performance Overview</h2>
        <Select value={timeHorizon} onValueChange={(value: any) => onTimeHorizonChange(value)}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">4 Weeks</SelectItem>
            <SelectItem value="month">3 Months</SelectItem>
            <SelectItem value="quarter">6 Months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Current Status Cards */}
      {currentWeek && (
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1 text-xs">
                <Battery className="size-3" />
                Recovery
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getReadinessColor(currentWeek.recovery)}`}>
                {currentWeek.recovery}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {Number(recoveryChange) > 0 ? '↑' : '↓'} {Math.abs(Number(recoveryChange))}% vs last week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1 text-xs">
                <Zap className="size-3" />
                Strain
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentWeek.strain.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {Number(strainChange) > 0 ? '↑' : '↓'} {Math.abs(Number(strainChange))}% vs last week
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Readiness Status */}
      {currentWeek && (
        <Card className={`border-2 ${currentWeek.recovery >= 67 ? 'border-green-500/20' : currentWeek.recovery >= 34 ? 'border-yellow-500/20' : 'border-red-500/20'}`}>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <div className={`text-4xl font-bold ${getReadinessColor(currentWeek.recovery)}`}>
                {getReadinessStatus(currentWeek.recovery)}
              </div>
              <p className="text-sm text-muted-foreground">
                Based on your recovery, sleep, and HRV trends
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recovery vs Strain Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recovery & Strain Balance</CardTitle>
          <CardDescription>Track your training load and recovery</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240} minHeight={240}>
            <ComposedChart data={data.weekly}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="week" 
                tick={{ fontSize: 11 }}
              />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} domain={[0, 100]} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} domain={[0, 21]} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="recovery"
                fill="hsl(var(--chart-1))"
                fillOpacity={0.2}
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                name="Recovery %"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="strain"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Strain"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* HRV Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Heart Rate Variability (HRV)</CardTitle>
          <CardDescription>Recovery indicator - higher is better</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200} minHeight={200}>
            <AreaChart data={data.weekly}>
              <defs>
                <linearGradient id="colorHRV" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="week" 
                tick={{ fontSize: 11 }}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Area 
                type="monotone" 
                dataKey="hrv" 
                stroke="hsl(var(--chart-2))" 
                fillOpacity={1} 
                fill="url(#colorHRV)"
                name="HRV (ms)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Sleep Consistency */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sleep Duration</CardTitle>
          <CardDescription>Weekly average sleep hours</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200} minHeight={200}>
            <BarChart data={data.weekly}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="week" 
                tick={{ fontSize: 11 }}
              />
              <YAxis tick={{ fontSize: 11 }} domain={[0, 10]} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar 
                dataKey="sleep" 
                fill="hsl(var(--chart-3))"
                radius={[4, 4, 0, 0]}
                name="Hours"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Resting Heart Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resting Heart Rate</CardTitle>
          <CardDescription>Lower trends indicate improved fitness</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200} minHeight={200}>
            <LineChart data={data.weekly}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="week" 
                tick={{ fontSize: 11 }}
              />
              <YAxis 
                tick={{ fontSize: 11 }} 
                domain={['dataMin - 5', 'dataMax + 5']}
              />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Line 
                type="monotone" 
                dataKey="restingHR" 
                stroke="hsl(var(--destructive))" 
                strokeWidth={2}
                dot={{ r: 3 }}
                name="RHR (bpm)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Training Volume */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Training Volume</CardTitle>
          <CardDescription>Weekly active minutes</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200} minHeight={200}>
            <BarChart data={data.weekly}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="week" 
                tick={{ fontSize: 11 }}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12 }} />
              <Bar 
                dataKey="activeMinutes" 
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                name="Minutes"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}