import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ComposedChart } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Badge } from "@/app/components/ui/badge";
import { Battery, Moon, Footprints, Weight as WeightIcon, Smile } from "lucide-react";

interface DailyData {
  date: string;
  recovery: number;
  feeling: number; // 1-5 subjective scale
  sleep: number;
  hrv: number;
  restingHR: number;
  activeMinutes: number;
  steps?: number;
  weight?: number;
  activeEnergy?: number;
}

interface RollingAverageData {
  date: string;
  recovery: number;
  feeling: number;
  sleep: number;
  hrv: number;
  restingHR: number;
  activeMinutes: number;
  steps: number;
  weight: number;
}

interface RollingAverageDashboardProps {
  data: DailyData[];
  timeHorizon: 'month' | 'quarter' | 'year';
  onTimeHorizonChange: (value: 'month' | 'quarter' | 'year') => void;
}

// Calculate 7-day rolling average
function calculateRollingAverage(data: DailyData[], days: number = 7): RollingAverageData[] {
  if (data.length < days) return [];
  
  const result: RollingAverageData[] = [];
  
  for (let i = days - 1; i < data.length; i++) {
    const window = data.slice(i - days + 1, i + 1);
    
    result.push({
      date: data[i].date,
      recovery: window.reduce((sum, d) => sum + d.recovery, 0) / days,
      feeling: window.reduce((sum, d) => sum + (d.feeling || 3), 0) / days,
      sleep: window.reduce((sum, d) => sum + d.sleep, 0) / days,
      hrv: window.reduce((sum, d) => sum + d.hrv, 0) / days,
      restingHR: window.reduce((sum, d) => sum + d.restingHR, 0) / days,
      activeMinutes: window.reduce((sum, d) => sum + d.activeMinutes, 0) / days,
      steps: window.reduce((sum, d) => sum + (d.steps || 0), 0) / days,
      weight: window.reduce((sum, d) => sum + (d.weight || 0), 0) / days,
    });
  }
  
  return result;
}

export function RollingAverageDashboard({ data, timeHorizon, onTimeHorizonChange }: RollingAverageDashboardProps) {
  // Calculate 7-day rolling averages
  const rollingData = calculateRollingAverage(data, 7);
  
  // Filter based on time horizon
  let filteredData = rollingData;
  if (timeHorizon === 'month' && rollingData.length > 30) {
    filteredData = rollingData.slice(-30);
  } else if (timeHorizon === 'quarter' && rollingData.length > 90) {
    filteredData = rollingData.slice(-90);
  } else if (timeHorizon === 'year' && rollingData.length > 365) {
    filteredData = rollingData.slice(-365);
  }

  // Current vs 7 days ago comparison
  const current = rollingData[rollingData.length - 1];
  const weekAgo = rollingData.length > 7 ? rollingData[rollingData.length - 8] : null;
  
  const recoveryChange = current && weekAgo 
    ? ((current.recovery - weekAgo.recovery) / weekAgo.recovery * 100).toFixed(0)
    : '0';

  const getRecoveryColor = (recovery: number) => {
    if (recovery >= 67) return 'text-green-500';
    if (recovery >= 34) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getReadinessStatus = (recovery: number) => {
    if (recovery >= 67) return 'Ready to Perform';
    if (recovery >= 34) return 'Moderate Readiness';
    return 'Recovery Needed';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Format x-axis based on time horizon
  const getTickFormatter = () => {
    if (timeHorizon === 'year') {
      return (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short' });
      };
    }
    return formatDate;
  };

  // Determine tick interval
  const getTickInterval = () => {
    if (timeHorizon === 'year') return Math.floor(filteredData.length / 12);
    if (timeHorizon === 'quarter') return Math.floor(filteredData.length / 12);
    return Math.floor(filteredData.length / 10);
  };

  if (!current) {
    return (
      <div className="space-y-4 pb-20">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              Need at least 7 days of data to calculate rolling averages
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Time Horizon Selector - moved to inline with cards */}
      
      {/* Current Status Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1 text-xs">
              <Smile className="size-3" />
              How You Feel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {current.feeling.toFixed(1)}/5
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              7-day average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1 text-xs">
              <Moon className="size-3" />
              Sleep
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{current.sleep.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground mt-1">
              per night avg
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1 text-xs">
              <Footprints className="size-3" />
              Steps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(current.steps / 1000).toFixed(1)}k</div>
            <p className="text-xs text-muted-foreground mt-1">
              daily avg
            </p>
          </CardContent>
        </Card>

        {current.weight > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1 text-xs">
                <WeightIcon className="size-3" />
                Weight
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{current.weight.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                lbs avg
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Readiness Status */}
      <Card className={`border-2 ${current.recovery >= 67 ? 'border-green-500/20' : current.recovery >= 34 ? 'border-yellow-500/20' : 'border-red-500/20'}`}>
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <div className={`text-3xl font-bold ${getRecoveryColor(current.recovery)}`}>
              {getReadinessStatus(current.recovery)}
            </div>
            <p className="text-sm text-muted-foreground">
              Based on your 7-day rolling average
            </p>
            <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t">
              <div>
                <div className="text-[10px] text-muted-foreground">Sleep</div>
                <div className="text-sm font-semibold">{current.sleep.toFixed(1)}h</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">HRV</div>
                <div className="text-sm font-semibold">{current.hrv.toFixed(0)} ms</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">RHR</div>
                <div className="text-sm font-semibold">{current.restingHR.toFixed(0)} bpm</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground">Active</div>
                <div className="text-sm font-semibold">{current.activeMinutes.toFixed(0)}m</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recovery vs Strain Balance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">How You're Feeling</CardTitle>
          <CardDescription>7-day rolling average - subjective wellness (1-5 scale)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240} minHeight={240}>
            <LineChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }}
                tickFormatter={getTickFormatter()}
                interval={getTickInterval()}
              />
              <YAxis tick={{ fontSize: 11 }} domain={[1, 5]} />
              <Tooltip 
                contentStyle={{ fontSize: 11 }}
                labelFormatter={(value) => formatDate(value)}
                formatter={(value: number) => value.toFixed(1)}
              />
              <Line
                type="monotone"
                dataKey="feeling"
                stroke="hsl(var(--chart-1))"
                strokeWidth={3}
                dot={{ r: 4 }}
                name="Feeling"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Steps Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily Steps</CardTitle>
          <CardDescription>7-day rolling average</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200} minHeight={200}>
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="colorSteps" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }}
                tickFormatter={getTickFormatter()}
                interval={getTickInterval()}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ fontSize: 11 }}
                labelFormatter={(value) => formatDate(value)}
                formatter={(value: number) => Math.round(value).toLocaleString()}
              />
              <Area 
                type="monotone" 
                dataKey="steps" 
                stroke="hsl(var(--chart-4))" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorSteps)"
                name="Steps"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Weight Trend */}
      {filteredData.some(d => d.weight > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Weight Trend</CardTitle>
            <CardDescription>7-day rolling average</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200} minHeight={200}>
              <LineChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }}
                  tickFormatter={getTickFormatter()}
                  interval={getTickInterval()}
                />
                <YAxis 
                  tick={{ fontSize: 11 }}
                  domain={['dataMin - 2', 'dataMax + 2']}
                />
                <Tooltip 
                  contentStyle={{ fontSize: 11 }}
                  labelFormatter={(value) => formatDate(value)}
                  formatter={(value: number) => value.toFixed(1)}
                />
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="hsl(var(--chart-5))" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Weight (lbs)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* HRV Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Heart Rate Variability</CardTitle>
          <CardDescription>7-day rolling average - higher is better</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200} minHeight={200}>
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="colorHRV" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }}
                tickFormatter={getTickFormatter()}
                interval={getTickInterval()}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ fontSize: 11 }}
                labelFormatter={(value) => formatDate(value)}
                formatter={(value: number) => value.toFixed(1)}
              />
              <Area 
                type="monotone" 
                dataKey="hrv" 
                stroke="hsl(var(--chart-2))" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorHRV)"
                name="HRV (ms)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Sleep Consistency */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sleep Duration</CardTitle>
          <CardDescription>7-day rolling average</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200} minHeight={200}>
            <LineChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }}
                tickFormatter={getTickFormatter()}
                interval={getTickInterval()}
              />
              <YAxis tick={{ fontSize: 11 }} domain={[5, 10]} />
              <Tooltip 
                contentStyle={{ fontSize: 11 }}
                labelFormatter={(value) => formatDate(value)}
                formatter={(value: number) => value.toFixed(1)}
              />
              <Line 
                type="monotone" 
                dataKey="sleep" 
                stroke="hsl(var(--chart-3))" 
                strokeWidth={2}
                dot={false}
                name="Hours"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Resting Heart Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resting Heart Rate</CardTitle>
          <CardDescription>7-day rolling average - lower trends = better fitness</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200} minHeight={200}>
            <LineChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }}
                tickFormatter={getTickFormatter()}
                interval={getTickInterval()}
              />
              <YAxis 
                tick={{ fontSize: 11 }} 
                domain={['dataMin - 3', 'dataMax + 3']}
              />
              <Tooltip 
                contentStyle={{ fontSize: 11 }}
                labelFormatter={(value) => formatDate(value)}
                formatter={(value: number) => value.toFixed(1)}
              />
              <Line 
                type="monotone" 
                dataKey="restingHR" 
                stroke="hsl(var(--destructive))" 
                strokeWidth={2}
                dot={false}
                name="RHR (bpm)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Training Load */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily Training Volume</CardTitle>
          <CardDescription>7-day rolling average active minutes</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200} minHeight={200}>
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }}
                tickFormatter={getTickFormatter()}
                interval={getTickInterval()}
              />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip 
                contentStyle={{ fontSize: 11 }}
                labelFormatter={(value) => formatDate(value)}
                formatter={(value: number) => value.toFixed(0)}
              />
              <Area 
                type="monotone" 
                dataKey="activeMinutes" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorActive)"
                name="Minutes"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}