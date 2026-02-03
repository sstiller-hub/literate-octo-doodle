import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { AlertCircle, CheckCircle, Info } from "lucide-react";

interface Insight {
  title: string;
  description: string;
  type: 'success' | 'warning' | 'info';
}

interface InsightsPanelProps {
  insights: Insight[];
}

export function InsightsPanel({ insights }: InsightsPanelProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="size-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="size-4 text-yellow-500" />;
      case 'info':
        return <Info className="size-4 text-blue-500" />;
      default:
        return <Info className="size-4" />;
    }
  };

  const getVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case 'success':
        return 'default';
      case 'warning':
        return 'secondary';
      case 'info':
        return 'outline';
      default:
        return 'default';
    }
  };

  if (!insights || insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">💡 AI Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Upload your health data to receive personalized insights
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">💡 AI Insights</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {insights.map((insight, idx) => (
            <div key={idx} className="p-3 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-start gap-2">
                {getIcon(insight.type)}
                <div className="flex-1 space-y-1">
                  <div className="font-medium text-sm">{insight.title}</div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {insight.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
