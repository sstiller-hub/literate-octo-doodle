import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Badge } from "@/app/components/ui/badge";
import { Calendar } from "lucide-react";

interface DailyData {
  date: string;
  recovery: number;
  strain: number;
  sleep: number;
  hrv: number;
  restingHR: number;
  activeMinutes: number;
  steps?: number;
  activeEnergy?: number;
  workouts?: Array<{ type: string; duration: number; calories: number }>;
}

interface DailyDashboardProps {
  data: DailyData[];
  daysToShow: number;
}

export function DailyDashboard({ data, daysToShow }: DailyDashboardProps) {
  // Get the last N days
  const recentDays = data.slice(-daysToShow);
  const today = recentDays[recentDays.length - 1];
  const yesterday = recentDays[recentDays.length - 2];

  const getRecoveryColor = (score: number) => {
    if (score >= 67) return 'text-green-500';
    if (score >= 34) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getRecoveryStatus = (score: number) => {
    if (score >= 67) return 'High Recovery';
    if (score >= 34) return 'Moderate';
    return 'Low Recovery';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Today's Status */}
      {today && (
        <>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Today's Performance</h2>
            <Badge variant="outline" className="text-xs">
              <Calendar className="size-3 mr-1" />
              {formatDate(today.date)}
            </Badge>
          </div>

          {/* Today's Key Metrics */}
          <div className="grid grid-cols-3 gap-2">
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="text-xs text-muted-foreground mb-1">Recovery</div>
                <div className={`text-xl font-bold ${getRecoveryColor(today.recovery)}`}>
                  {today.recovery}%
                </div>
                {yesterday && (
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {today.recovery > yesterday.recovery ? '↑' : '↓'} 
                    {Math.abs(today.recovery - yesterday.recovery).toFixed(0)} vs yesterday
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="text-xs text-muted-foreground mb-1">Strain</div>
                <div className="text-xl font-bold">{today.strain.toFixed(1)}</div>
                {yesterday && (
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {today.strain > yesterday.strain ? '↑' : '↓'} 
                    {Math.abs(today.strain - yesterday.strain).toFixed(1)} vs yesterday
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="text-xs text-muted-foreground mb-1">Sleep</div>
                <div className="text-xl font-bold">{today.sleep.toFixed(1)}h</div>
                {yesterday && (
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {today.sleep > yesterday.sleep ? '↑' : '↓'} 
                    {Math.abs(today.sleep - yesterday.sleep).toFixed(1)}h
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Today's Status Message */}
          <Card className={`border-2 ${today.recovery >= 67 ? 'border-green-500/20 bg-green-500/5' : today.recovery >= 34 ? 'border-yellow-500/20 bg-yellow-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
            <CardContent className="pt-4">
              <div className={`text-sm font-semibold ${getRecoveryColor(today.recovery)}`}>
                {getRecoveryStatus(today.recovery)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {today.recovery >= 67 
                  ? "Your body is well-recovered. Great day for high-intensity training or competition."
                  : today.recovery >= 34
                  ? "You're moderately recovered. Consider moderate training intensity today."
                  : "Your body needs more recovery. Light activity or rest is recommended today."}
              </p>
            </CardContent>
          </Card>

          {/* Additional Today's Stats */}
          <div className="grid grid-cols-4 gap-2">
            <Card>
              <CardContent className="pt-3 pb-2">
                <div className="text-[10px] text-muted-foreground">HRV</div>
                <div className="text-sm font-bold">{today.hrv} ms</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-3 pb-2">
                <div className="text-[10px] text-muted-foreground">RHR</div>
                <div className="text-sm font-bold">{today.restingHR} bpm</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-3 pb-2">
                <div className="text-[10px] text-muted-foreground">Active</div>
                <div className="text-sm font-bold">{today.activeMinutes}m</div>
              </CardContent>
            </Card>
            {today.steps && (
              <Card>
                <CardContent className="pt-3 pb-2">
                  <div className="text-[10px] text-muted-foreground">Steps</div>
                  <div className="text-sm font-bold">{(today.steps / 1000).toFixed(1)}k</div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}

      {/* Daily Recovery Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily Recovery</CardTitle>
          <CardDescription>Last {daysToShow} days</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200} minHeight={200}>
            <AreaChart data={recentDays}>
              <defs>
                <linearGradient id="colorRecovery" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }}
                tickFormatter={formatDate}
              />
              <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ fontSize: 11 }}
                labelFormatter={(value) => formatDate(value)}
              />
              <Area 
                type="monotone" 
                dataKey="recovery" 
                stroke="hsl(var(--chart-1))" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorRecovery)"
                name="Recovery %"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Daily Strain */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily Strain</CardTitle>
          <CardDescription>Training load per day</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200} minHeight={200}>
            <BarChart data={recentDays}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }}
                tickFormatter={formatDate}
              />
              <YAxis tick={{ fontSize: 10 }} domain={[0, 21]} />
              <Tooltip 
                contentStyle={{ fontSize: 11 }}
                labelFormatter={(value) => formatDate(value)}
              />
              <Bar 
                dataKey="strain" 
                fill="hsl(var(--destructive))"
                radius={[4, 4, 0, 0]}
                name="Strain"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Sleep Pattern */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sleep Duration</CardTitle>
          <CardDescription>Daily sleep hours</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200} minHeight={200}>
            <BarChart data={recentDays}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }}
                tickFormatter={formatDate}
              />
              <YAxis tick={{ fontSize: 10 }} domain={[0, 10]} />
              <Tooltip 
                contentStyle={{ fontSize: 11 }}
                labelFormatter={(value) => formatDate(value)}
              />
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

      {/* HRV Daily */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">HRV Trend</CardTitle>
          <CardDescription>Daily heart rate variability</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180} minHeight={180}>
            <LineChart data={recentDays}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }}
                tickFormatter={formatDate}
              />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip 
                contentStyle={{ fontSize: 11 }}
                labelFormatter={(value) => formatDate(value)}
              />
              <Line 
                type="monotone" 
                dataKey="hrv" 
                stroke="hsl(var(--chart-2))" 
                strokeWidth={2}
                dot={{ r: 3 }}
                name="HRV (ms)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Resting HR Daily */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resting Heart Rate</CardTitle>
          <CardDescription>Daily resting HR</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={180} minHeight={180}>
            <LineChart data={recentDays}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }}
                tickFormatter={formatDate}
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                domain={['dataMin - 3', 'dataMax + 3']}
              />
              <Tooltip 
                contentStyle={{ fontSize: 11 }}
                labelFormatter={(value) => formatDate(value)}
              />
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

      {/* Activity Minutes */}
      {recentDays.some(d => d.activeMinutes) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active Minutes</CardTitle>
            <CardDescription>Daily activity duration</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180} minHeight={180}>
              <BarChart data={recentDays}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }}
                  tickFormatter={formatDate}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ fontSize: 11 }}
                  labelFormatter={(value) => formatDate(value)}
                />
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
      )}

      {/* Steps */}
      {recentDays.some(d => d.steps) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily Steps</CardTitle>
            <CardDescription>Step count per day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180} minHeight={180}>
              <BarChart data={recentDays}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }}
                  tickFormatter={formatDate}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ fontSize: 11 }}
                  labelFormatter={(value) => formatDate(value)}
                />
                <Bar 
                  dataKey="steps" 
                  fill="hsl(var(--chart-4))"
                  radius={[4, 4, 0, 0]}
                  name="Steps"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}