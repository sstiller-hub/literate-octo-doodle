import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";

export function ProductPhilosophy() {
  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold mb-2">How This Works</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          This system is optimized for training decisions, not exhaustiveness.
          It tracks what meaningfully affects readiness and excludes what doesn't.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">What We Track — and Why</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-medium mb-1">Sleep Duration & Consistency</p>
            <p className="text-muted-foreground leading-relaxed">
              Primary recovery driver. Directly impacts central nervous system readiness.
            </p>
          </div>

          <div>
            <p className="font-medium mb-1">Heart Rate Variability (HRV)</p>
            <p className="text-muted-foreground leading-relaxed">
              Measures autonomic nervous system recovery. Declines under accumulated fatigue.
            </p>
          </div>

          <div>
            <p className="font-medium mb-1">Resting Heart Rate (RHR)</p>
            <p className="text-muted-foreground leading-relaxed">
              Early indicator of training stress or incomplete recovery. Stabilizes with adaptation.
            </p>
          </div>

          <div>
            <p className="font-medium mb-1">Active Energy & Workouts</p>
            <p className="text-muted-foreground leading-relaxed">
              Training load context. Used to validate recovery patterns, not as a goal.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">What We Don't Track — and Why</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-medium mb-1">Calories Burned</p>
            <p className="text-muted-foreground leading-relaxed">
              Does not change training decisions. Calorie estimates are imprecise and rarely correlate with readiness.
            </p>
          </div>

          <div>
            <p className="font-medium mb-1">Step Goals or Streaks</p>
            <p className="text-muted-foreground leading-relaxed">
              Arbitrary targets introduce noise. Step volume is captured through active energy without gamification.
            </p>
          </div>

          <div>
            <p className="font-medium mb-1">Generic Activity Rings</p>
            <p className="text-muted-foreground leading-relaxed">
              Does not explain what changed or why. Training load is more specific and decision-relevant.
            </p>
          </div>

          <div>
            <p className="font-medium mb-1">Composite Health Scores Without Explainability</p>
            <p className="text-muted-foreground leading-relaxed">
              We don't use black-box scores. Every metric here can be traced to a specific decision path.
            </p>
          </div>

          <div>
            <p className="font-medium mb-1">Mood Journaling (Beyond Lightweight Context)</p>
            <p className="text-muted-foreground leading-relaxed">
              Subjective logs require interpretation effort. Recovery markers provide objective context without friction.
            </p>
          </div>

          <div>
            <p className="font-medium mb-1">Badges, Streaks, or Achievements</p>
            <p className="text-muted-foreground leading-relaxed">
              Gamification optimizes for engagement, not decisions. This system is a tool, not a game.
            </p>
          </div>

          <div>
            <p className="font-medium mb-1">Blood Oxygen (SpO2)</p>
            <p className="text-muted-foreground leading-relaxed">
              Correlates weakly with training readiness unless at altitude or managing respiratory conditions.
            </p>
          </div>

          <div>
            <p className="font-medium mb-1">Body Temperature or Skin Temperature</p>
            <p className="text-muted-foreground leading-relaxed">
              Useful for illness detection but adds complexity. HRV and RHR already signal systemic stress.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Design Principles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-medium mb-1">Signal Over Volume</p>
            <p className="text-muted-foreground leading-relaxed">
              More data isn't better. Better decisions are.
            </p>
          </div>

          <div>
            <p className="font-medium mb-1">Explainability Over Completeness</p>
            <p className="text-muted-foreground leading-relaxed">
              Every metric has a visible path to a recommendation. No black boxes.
            </p>
          </div>

          <div>
            <p className="font-medium mb-1">Decisions Over Dashboards</p>
            <p className="text-muted-foreground leading-relaxed">
              This system answers "should I train hard today?" — not "how am I doing?"
            </p>
          </div>

          <div>
            <p className="font-medium mb-1">Trends Over Moments</p>
            <p className="text-muted-foreground leading-relaxed">
              Weekly patterns reveal training response better than daily fluctuations.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="pt-2">
        <p className="text-xs text-muted-foreground leading-relaxed">
          This is a product decision, not a preference. If a metric doesn't meaningfully improve readiness decisions, it's intentionally excluded.
        </p>
      </div>
    </div>
  );
}
