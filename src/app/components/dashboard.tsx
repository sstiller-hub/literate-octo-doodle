import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Activity, Heart, Moon, TrendingUp } from "lucide-react";

interface HealthData {
  steps?: Array<{ date: string; count: number }>;
  heartRate?: Array<{ date: string; bpm: number }>;
  sleep?: Array<{ date: string; hours: number; quality: string }>;
  workouts?: Array<{ date: string; type: string; duration: number; calories: number }>;
  activeEnergy?: Array<{ date: string; calories: number }>;
  weight?: Array<{ date: string; kg: number }>;
}

interface DashboardProps {
  data: HealthData;
}

export function Dashboard({ data }: DashboardProps) {
  // Calculate summary stats
  const totalSteps = data.steps?.reduce((sum, d) => sum + d.count, 0) || 0;
  const avgSteps = data.steps ? Math.round(totalSteps / data.steps.length) : 0;
  
  const avgHeartRate = data.heartRate 
    ? Math.round(data.heartRate.reduce((sum, d) => sum + d.bpm, 0) / data.heartRate.length)
    : 0;
  
  const avgSleep = data.sleep
    ? (data.sleep.reduce((sum, d) => sum + d.hours, 0) / data.sleep.length).toFixed(1)
    : '0';
  
  const totalWorkouts = data.workouts?.length || 0;

  return (
    <div className="space-y-4 pb-20">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1 text-xs">
              <Activity className="size-3" />
              Avg Steps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgSteps.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">per day</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1 text-xs">
              <Heart className="size-3" />
              Avg Heart Rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgHeartRate}</div>
            <p className="text-xs text-muted-foreground mt-1">bpm</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1 text-xs">
              <Moon className="size-3" />
              Avg Sleep
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgSleep}h</div>
            <p className="text-xs text-muted-foreground mt-1">per night</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1 text-xs">
              <TrendingUp className="size-3" />
              Workouts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWorkouts}</div>
            <p className="text-xs text-muted-foreground mt-1">this period</p>
          </CardContent>
        </Card>
      </div>

      {/* Steps Chart */}
      {data.steps && data.steps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily Steps</CardTitle>
            <CardDescription>Your walking activity over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200} minHeight={200}>
              <AreaChart data={data.steps}>
                <defs>
                  <linearGradient id="colorSteps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ fontSize: 12 }}
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="hsl(var(--primary))" 
                  fillOpacity={1} 
                  fill="url(#colorSteps)"
                  name="Steps"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Heart Rate Chart */}
      {data.heartRate && data.heartRate.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Heart Rate Trends</CardTitle>
            <CardDescription>Heart rate measurements over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200} minHeight={200}>
              <LineChart data={data.heartRate}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis tick={{ fontSize: 11 }} domain={['dataMin - 10', 'dataMax + 10']} />
                <Tooltip 
                  contentStyle={{ fontSize: 12 }}
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Line 
                  type="monotone" 
                  dataKey="bpm" 
                  stroke="hsl(var(--destructive))" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="BPM"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Sleep Chart */}
      {data.sleep && data.sleep.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sleep Duration</CardTitle>
            <CardDescription>Hours of sleep per night</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200} minHeight={200}>
              <BarChart data={data.sleep}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 12]} />
                <Tooltip 
                  contentStyle={{ fontSize: 12 }}
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Bar 
                  dataKey="hours" 
                  fill="hsl(var(--chart-1))"
                  radius={[4, 4, 0, 0]}
                  name="Hours"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Workouts Table */}
      {data.workouts && data.workouts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Workouts</CardTitle>
            <CardDescription>Your exercise activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.workouts.slice(0, 5).map((workout, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{workout.type}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(workout.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{workout.duration} min</div>
                    <div className="text-xs text-muted-foreground">{workout.calories} cal</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Energy Chart */}
      {data.activeEnergy && data.activeEnergy.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active Energy</CardTitle>
            <CardDescription>Calories burned through activity</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200} minHeight={200}>
              <AreaChart data={data.activeEnergy}>
                <defs>
                  <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ fontSize: 12 }}
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Area 
                  type="monotone" 
                  dataKey="calories" 
                  stroke="hsl(var(--chart-2))" 
                  fillOpacity={1} 
                  fill="url(#colorEnergy)"
                  name="Calories"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Weight Chart */}
      {data.weight && data.weight.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Weight Tracking</CardTitle>
            <CardDescription>Body weight over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200} minHeight={200}>
              <LineChart data={data.weight}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis 
                  tick={{ fontSize: 11 }} 
                  domain={['dataMin - 2', 'dataMax + 2']}
                />
                <Tooltip 
                  contentStyle={{ fontSize: 12 }}
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Line 
                  type="monotone" 
                  dataKey="kg" 
                  stroke="hsl(var(--chart-3))" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Weight (kg)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}