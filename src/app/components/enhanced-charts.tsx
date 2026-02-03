import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ComposedChart } from "recharts";

// Custom Tooltip Component
export function CustomTooltip({ active, payload, label, unit = "" }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
        <p className="text-xs font-semibold mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: <span className="font-bold">{entry.value}{unit}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
}

// Enhanced Area Chart with Gradient
interface EnhancedAreaChartProps {
  data: any[];
  dataKey: string;
  name: string;
  color: string;
  height?: number;
  showAverage?: boolean;
  unit?: string;
}

export function EnhancedAreaChart({ 
  data, 
  dataKey, 
  name, 
  color, 
  height = 200,
  showAverage = true,
  unit = ""
}: EnhancedAreaChartProps) {
  const average = data.reduce((sum, item) => sum + item[dataKey], 0) / data.length;
  
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.4}/>
            <stop offset="95%" stopColor={color} stopOpacity={0.05}/>
          </linearGradient>
          <filter id={`shadow-${dataKey}`} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={color} floodOpacity="0.3"/>
          </filter>
        </defs>
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} stroke="hsl(var(--muted-foreground))" />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          tickFormatter={(value) => {
            const date = new Date(value);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          }}
        />
        <YAxis 
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
        />
        <Tooltip content={<CustomTooltip unit={unit} />} />
        {showAverage && (
          <ReferenceLine 
            y={average} 
            stroke={color} 
            strokeDasharray="5 5" 
            strokeOpacity={0.5}
            label={{ 
              value: `Avg: ${average.toFixed(1)}${unit}`, 
              fontSize: 10, 
              fill: color,
              position: "right"
            }}
          />
        )}
        <Area 
          type="monotone" 
          dataKey={dataKey} 
          stroke={color} 
          strokeWidth={3}
          fill={`url(#gradient-${dataKey})`}
          filter={`url(#shadow-${dataKey})`}
          name={name}
          animationDuration={800}
          dot={{ r: 4, fill: color, strokeWidth: 2, stroke: "hsl(var(--background))" }}
          activeDot={{ r: 6, strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// Enhanced Bar Chart with Gradients
interface EnhancedBarChartProps {
  data: any[];
  dataKey: string;
  name: string;
  color: string;
  height?: number;
  showGoal?: number;
  unit?: string;
}

export function EnhancedBarChart({ 
  data, 
  dataKey, 
  name, 
  color, 
  height = 200,
  showGoal,
  unit = ""
}: EnhancedBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <defs>
          <linearGradient id={`barGradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.9}/>
            <stop offset="100%" stopColor={color} stopOpacity={0.6}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} stroke="hsl(var(--muted-foreground))" />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          tickFormatter={(value) => {
            const date = new Date(value);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          }}
        />
        <YAxis 
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
        />
        <Tooltip content={<CustomTooltip unit={unit} />} />
        {showGoal && (
          <ReferenceLine 
            y={showGoal} 
            stroke={color} 
            strokeDasharray="5 5" 
            strokeOpacity={0.7}
            label={{ 
              value: `Goal: ${showGoal}${unit}`, 
              fontSize: 10, 
              fill: color,
              position: "right"
            }}
          />
        )}
        <Bar 
          dataKey={dataKey} 
          fill={`url(#barGradient-${dataKey})`}
          radius={[6, 6, 0, 0]}
          name={name}
          animationDuration={800}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Enhanced Multi-Line Chart
interface EnhancedMultiLineChartProps {
  data: any[];
  lines: Array<{
    dataKey: string;
    name: string;
    color: string;
  }>;
  height?: number;
  unit?: string;
}

export function EnhancedMultiLineChart({ 
  data, 
  lines,
  height = 240,
  unit = ""
}: EnhancedMultiLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} stroke="hsl(var(--muted-foreground))" />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          tickFormatter={(value) => {
            const date = new Date(value);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          }}
        />
        <YAxis 
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
        />
        <Tooltip content={<CustomTooltip unit={unit} />} />
        {lines.map((line) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            stroke={line.color}
            strokeWidth={2.5}
            dot={{ r: 3, fill: line.color, strokeWidth: 2, stroke: "hsl(var(--background))" }}
            activeDot={{ r: 5, strokeWidth: 2 }}
            name={line.name}
            animationDuration={800}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// Stacked Area Chart for Sleep Stages or Multiple Metrics
interface StackedAreaChartProps {
  data: any[];
  areas: Array<{
    dataKey: string;
    name: string;
    color: string;
  }>;
  height?: number;
}

export function StackedAreaChart({
  data,
  areas,
  height = 240
}: StackedAreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <defs>
          {areas.map((area) => (
            <linearGradient key={area.dataKey} id={`stackGradient-${area.dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={area.color} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={area.color} stopOpacity={0.3}/>
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} stroke="hsl(var(--muted-foreground))" />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          tickFormatter={(value) => {
            const date = new Date(value);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          }}
        />
        <YAxis 
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
        />
        <Tooltip content={<CustomTooltip />} />
        {areas.map((area) => (
          <Area
            key={area.dataKey}
            type="monotone"
            dataKey={area.dataKey}
            stackId="1"
            stroke={area.color}
            strokeWidth={1.5}
            fill={`url(#stackGradient-${area.dataKey})`}
            name={area.name}
            animationDuration={800}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
