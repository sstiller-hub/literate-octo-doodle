import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Info, Target } from "lucide-react";

interface PerformanceInsight {
  title: string;
  description: string;
  type: 'success' | 'warning' | 'info' | 'action';
  metric?: string;
  trend?: 'up' | 'down' | 'stable';
}

interface PerformanceInsightsProps {
  insights: PerformanceInsight[];
}

export function PerformanceInsights({ insights }: PerformanceInsightsProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="size-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="size-4 text-yellow-500" />;
      case 'action':
        return <Target className="size-4 text-blue-500" />;
      case 'info':
        return <Info className="size-4 text-muted-foreground" />;
      default:
        return <Info className="size-4" />;
    }
  };

  const getTrendIcon = (trend?: string) => {
    if (trend === 'up') return <TrendingUp className="size-3 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="size-3 text-red-500" />;
    return null;
  };

  if (!insights || insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performance Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Upload health data to receive performance insights
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      <h2 className="text-lg font-semibold">This Week's Insights</h2>
      
      <div className="space-y-3">
        {insights.map((insight, idx) => (
          <Card key={idx}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {getIcon(insight.type)}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-sm">{insight.title}</div>
                    {insight.trend && (
                      <div className="flex items-center gap-1">
                        {getTrendIcon(insight.trend)}
                        {insight.metric && (
                          <span className="text-xs font-medium">{insight.metric}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {insight.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}