import { useState, useEffect } from "react";
import "@/styles/index.css";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import { WeeklySummaryCard } from "@/app/components/weekly-summary";
import { ReadinessView } from "@/app/components/readiness-view";
import { ProgressPictures } from "@/app/components/progress-pictures";
import { DailyCheckIn } from "@/app/components/daily-checkin";
import { PerformanceInsights } from "@/app/components/performance-insights";
import { AIChat } from "@/app/components/ai-chat";
import { FileUpload } from "@/app/components/file-upload";
import { YearInReview } from "@/app/components/year-in-review";
import { ProductPhilosophy } from "@/app/components/product-philosophy";
import {
  Activity,
  TrendingUp,
  Camera,
  MessageSquare,
  Upload,
  Sparkles,
  Settings,
  Info,
  BookOpen,
  Database,
  Calendar,
} from "lucide-react";
import { Toaster } from "@/app/components/ui/sonner";
import { toast } from "sonner";
import { functionsBaseUrl, supabase } from "@/app/utils/supabase/client";
import type { Session } from "@supabase/supabase-js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { generateDemoHealthData } from "@/app/utils/demo-data";
import { Button } from "@/app/components/ui/button";

// Generate 90 days of realistic demo data
const generatedDailyData = generateDemoHealthData(90);

// Use the last 4 weeks for weekly view
const dummyWeeklyData = generatedDailyData.slice(-28);

// Use last 30 days for daily view
const dummyDailyData = generatedDailyData.slice(-30);

const dummyWeeklySummary = {
  weekNumber: 4,
  dateRange: "Jan 25 - Jan 31, 2026",
  avgRecovery: 68,
  avgSleep: 7.5,
  avgStepsPerDay: 9886, // average per day, not total
  avgWeight: 174.4,
  avgHRV: 55,
  avgRestingHR: 59,
  avgFeeling: 3.4,
  trends: {
    feeling: -8, // -8% vs previous week
    sleep: 2, // +2% vs previous week
    steps: -5, // -5% vs previous week
    weight: -0.5, // -0.5% vs previous week
    recovery: -3, // -3% vs previous week
  },
};

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setSession(data.session ?? null);
      setAuthLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        setAuthLoading(false);
      },
    );

    return () => {
      isMounted = false;
      subscription?.subscription.unsubscribe();
    };
  }, []);

  // Detect day of week for context-aware defaults
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
  const isSunday = dayOfWeek === 0;
  const isSaturday = dayOfWeek === 6;
  const isWeekend = isSaturday || isSunday;
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5; // Monday-Friday

  // Sunday: Auto-open Photos tab for progress pics
  const defaultTab = isSunday ? "pictures" : "performance";

  const [performanceData, setPerformanceData] = useState({
    weekly: dummyWeeklyData,
    daily: dummyDailyData,
  });
  const [insights, setInsights] = useState<any[]>([]);
  const [timeHorizon, setTimeHorizon] = useState<
    "month" | "quarter" | "year"
  >("month");
  // Monday-Friday: Daily view, Saturday: Daily view, Sunday/default: Rolling view
  const [viewMode, setViewMode] = useState<"rolling" | "daily">(
    isWeekday || isSaturday ? "daily" : "rolling",
  );
  // Saturday: Default to 14 days for review, Weekdays: 7 days for yesterday + week context
  const [daysToShow, setDaysToShow] = useState<7 | 14 | 30>(
    isSaturday ? 14 : 7,
  );
  const [weeklySummary] = useState(dummyWeeklySummary);
  const [settingsView, setSettingsView] = useState<
    "data" | "review" | "philosophy" | null
  >(null);
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [aiChatInitialPrompt, setAiChatInitialPrompt] = useState<string | null>(
    null,
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load performance data and insights on mount
  useEffect(() => {
    if (!session) return;
    loadPerformanceData();
    loadInsights();
  }, [session, timeHorizon]);

  const loadPerformanceData = async () => {
    if (!session || !functionsBaseUrl) return;
    try {
      const response = await fetch(
        `${functionsBaseUrl}/performance-data?timeHorizon=${timeHorizon}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        // If we have real data, use it; otherwise keep dummy data
        if (data.weekly && data.weekly.length > 0) {
          setPerformanceData(data);
        }
      }
    } catch (error) {
      // Silently fail and keep using dummy data - don't log to console
      // This is expected on first load when no data exists
    }
  };

  const loadInsights = async () => {
    if (!session || !functionsBaseUrl) return;
    try {
      const response = await fetch(
        `${functionsBaseUrl}/insights`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        setInsights(data.insights || []);
      }
    } catch (error) {
      // Silently fail - insights are optional
    }
  };

  const handleUploadSuccess = () => {
    loadPerformanceData();
    loadInsights();
  };

  const handleSendMessage = async (
    message: string,
  ): Promise<string> => {
    if (!session || !functionsBaseUrl) {
      throw new Error("Not authenticated");
    }
    try {
      const response = await fetch(
        `${functionsBaseUrl}/ai-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ message }),
        },
      );

      if (!response.ok) {
        throw new Error("Chat request failed");
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error("Error in AI chat:", error);
      throw error;
    }
  };

  const handleSaveFeeling = async (
    feeling: number,
    note: string,
    date: string,
  ) => {
    if (!session || !functionsBaseUrl) {
      toast.error("Please sign in first");
      return;
    }
    try {
      const response = await fetch(
        `${functionsBaseUrl}/save-feeling`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ date, feeling, note }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to save check-in");
      }

      toast.success("Check-in saved!");
      loadPerformanceData(); // Refresh data
    } catch (error) {
      console.error("Error saving feeling:", error);
      toast.error("Failed to save check-in");
    }
  };

  const handleExpandAIChat = (insightText: string) => {
    // Switch to AI tab and pre-populate with context about the insight
    setActiveTab('chat');
    setAiChatInitialPrompt(`Tell me more about this: ${insightText}`);
  };

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-foreground">
            Sign in to continue
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your data is private. Sign in with Google to access your dashboard.
          </p>
          <Button className="mt-6 w-full" onClick={handleSignIn}>
            Continue with Google
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster />

      {/* Sticky Header */}
      <header className="sticky top-0 z-10 pb-2 px-4 pt-[calc(1rem+env(safe-area-inset-top))]">
        <div className="flex items-center justify-between w-full">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
            <Activity className="size-5 text-primary" />
            <h1 className="font-semibold text-lg">
              Performance
            </h1>
          </div>

          {/* Settings Pill */}
          <Popover open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <PopoverTrigger asChild>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-muted/50 hover:bg-muted rounded-full border border-border transition-colors">
                <Settings className="size-4" />
                <span className="text-sm font-medium">
                  Settings
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-52 p-2">
              <div className="space-y-3">
                {/* Section: How This Works */}
                <div>
                  <div className="px-3 py-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                      How This Works
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <button
                      onClick={() => {
                        setSettingsView("philosophy");
                        setIsSettingsOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
                    >
                      <BookOpen className="size-4" />
                      Product Philosophy
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t" />

                {/* Section: Data */}
                <div>
                  <div className="px-3 py-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                      Data
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <button
                      onClick={() => {
                        setSettingsView("data");
                        setIsSettingsOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
                    >
                      <Upload className="size-4" />
                      Upload Data
                    </button>
                    <button
                      onClick={() => {
                        setSettingsView("review");
                        setIsSettingsOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
                    >
                      <Calendar className="size-4" />
                      Year in Review
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t" />

                {/* Section: Account */}
                <div>
                  <div className="px-3 py-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                      Account
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
                    >
                      <Info className="size-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-6 -mt-6 relative z-20">
        {/* Week in Review - Only visible on weekends */}
        {isWeekend && (
          <div className="mb-6">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h2 className="text-sm font-medium text-muted-foreground">
                  Week in Review
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isSaturday
                    ? "Prepare for tomorrow's progress check"
                    : "Reflect on last week's patterns"}
                </p>
              </div>
              {isSaturday && (
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500">
                  <TrendingUp className="size-4" />
                  <span className="text-xs font-medium">
                    Saturday Review
                  </span>
                </div>
              )}
            </div>
            <WeeklySummaryCard
              summary={weeklySummary}
              dailyData={performanceData.daily}
            />
          </div>
        )}

        {/* Weekday: Subtle collapsed affordance (optional) */}
        {isWeekday && (
          <button
            onClick={() => {
              // Could expand to show weekly summary, or navigate to a weekly view
              // For now, just a visual indicator
            }}
            className="mb-4 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
          >
            <span>Week in Review</span>
            <span className="text-[10px]">→</span>
          </button>
        )}

        {/* Settings Views (Data Upload or Year Review) */}
        {settingsView && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {settingsView === "data"
                  ? "Upload Data"
                  : settingsView === "review"
                    ? "2026 Year in Review"
                    : "Product Philosophy"}
              </h2>
              <button
                onClick={() => setSettingsView(null)}
                className="px-3 py-1.5 text-xs font-medium bg-muted hover:bg-muted/80 rounded-md transition-colors"
              >
                Close
              </button>
            </div>

            {settingsView === "data" ? (
              <>
                <FileUpload
                  onUploadSuccess={handleUploadSuccess}
                  authToken={session.access_token}
                />

                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg">
                  <h3 className="text-sm font-semibold mb-2 text-blue-900 dark:text-blue-100">
                    Data Format: Daily Records Only
                  </h3>
                  <p className="text-xs text-blue-800 dark:text-blue-200 mb-3">
                    Upload daily health data and the app
                    automatically calculates{" "}
                    <strong>7-day rolling averages</strong> for
                    trend analysis.
                  </p>
                  <div className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                    <p className="font-semibold">
                      Expected JSON format:
                    </p>
                    <pre className="text-[10px] overflow-x-auto bg-blue-100 dark:bg-blue-900/50 p-2 rounded mt-1">
                      {`{
  "daily": [
    {
      "date": "2026-01-25",
      "recovery": 72,
      "feeling": 4,
      "sleep": 7.8,
      "hrv": 58,
      "restingHR": 58,
      "activeMinutes": 45,
      "steps": 8500,
      "weight": 175
    }
  ]
}`}
                    </pre>
                  </div>
                  <div className="mt-3 text-xs text-blue-800 dark:text-blue-200">
                    <p className="font-semibold mb-1">
                      Key Metrics:
                    </p>
                    <ul className="list-disc list-inside space-y-0.5 ml-2">
                      <li>
                        <strong>Recovery</strong>: 0-100% score
                        based on sleep, HRV, resting HR
                      </li>
                      <li>
                        <strong>Feeling</strong>: 1-5 scale
                        measuring overall well-being
                      </li>
                      <li>
                        <strong>HRV</strong>: Heart rate
                        variability in milliseconds
                      </li>
                      <li>
                        <strong>Resting HR</strong>: Average
                        resting heart rate in bpm
                      </li>
                      <li>
                        <strong>Steps</strong>: Optional - daily
                        step count
                      </li>
                      <li>
                        <strong>Weight</strong>: Optional -
                        daily weight in lbs
                      </li>
                    </ul>
                    <p className="mt-2 text-muted-foreground italic">
                      Rolling averages smooth out daily variance
                      and provide better trend insights
                    </p>
                  </div>
                </div>
              </>
            ) : settingsView === "review" ? (
              <YearInReview
                year={2026}
                data={{
                  totalDays: 365,
                  totalSteps: 3650000,
                  totalSleep: 2737.5,
                  avgFeeling: 3.4,
                  avgWeight: 174.4,
                  bestWeek: {
                    dateRange: "June 1-7, 2026",
                    avgFeeling: 4.7,
                    avgSleep: 8.2,
                    avgSteps: 12500,
                  },
                  worstWeek: {
                    dateRange: "March 15-21, 2026",
                    avgFeeling: 2.1,
                    avgSleep: 6.2,
                  },
                  monthlyBreakdown: [
                    {
                      month: "January",
                      avgFeeling: 3.2,
                      avgSleep: 7.3,
                      avgSteps: 9500,
                      avgWeight: 176,
                    },
                    {
                      month: "February",
                      avgFeeling: 3.5,
                      avgSleep: 7.5,
                      avgSteps: 10200,
                      avgWeight: 175.2,
                    },
                    {
                      month: "March",
                      avgFeeling: 2.8,
                      avgSleep: 6.8,
                      avgSteps: 8800,
                      avgWeight: 175.5,
                    },
                    {
                      month: "April",
                      avgFeeling: 3.6,
                      avgSleep: 7.6,
                      avgSteps: 10800,
                      avgWeight: 174.8,
                    },
                    {
                      month: "May",
                      avgFeeling: 3.9,
                      avgSleep: 7.8,
                      avgSteps: 11200,
                      avgWeight: 174.2,
                    },
                    {
                      month: "June",
                      avgFeeling: 4.2,
                      avgSleep: 8.0,
                      avgSteps: 11800,
                      avgWeight: 173.5,
                    },
                    {
                      month: "July",
                      avgFeeling: 4.0,
                      avgSleep: 7.7,
                      avgSteps: 11500,
                      avgWeight: 173.8,
                    },
                    {
                      month: "August",
                      avgFeeling: 3.8,
                      avgSleep: 7.6,
                      avgSteps: 11000,
                      avgWeight: 174.0,
                    },
                    {
                      month: "September",
                      avgFeeling: 3.7,
                      avgSleep: 7.5,
                      avgSteps: 10500,
                      avgWeight: 174.3,
                    },
                    {
                      month: "October",
                      avgFeeling: 3.5,
                      avgSleep: 7.4,
                      avgSteps: 10200,
                      avgWeight: 174.5,
                    },
                    {
                      month: "November",
                      avgFeeling: 3.3,
                      avgSleep: 7.2,
                      avgSteps: 9800,
                      avgWeight: 174.6,
                    },
                    {
                      month: "December",
                      avgFeeling: 3.4,
                      avgSleep: 7.4,
                      avgSteps: 9900,
                      avgWeight: 174.4,
                    },
                  ],
                  records: {
                    mostSteps: {
                      value: 18500,
                      date: "2026-06-15",
                    },
                    bestSleep: {
                      value: 9.2,
                      date: "2026-06-22",
                    },
                    bestFeeling: {
                      value: 5,
                      date: "2026-06-10",
                    },
                  },
                  weightChange: -1.6,
                }}
              />
            ) : (
              <ProductPhilosophy />
            )}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger
              value="performance"
              className="text-xs"
            >
              <TrendingUp className="size-3 mr-1" />
              Trends
            </TabsTrigger>
            <TabsTrigger value="pictures" className="text-xs">
              <Camera className="size-3 mr-1" />
              Photos
            </TabsTrigger>
            <TabsTrigger value="chat" className="text-xs">
              <MessageSquare className="size-3 mr-1" />
              Manual
            </TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="mt-0">
            {/* View Mode Selector */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode("rolling")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    viewMode === "rolling"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  Rolling
                </button>
                <button
                  onClick={() => setViewMode("daily")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    viewMode === "daily"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  Daily
                </button>
              </div>

              <div className="flex items-center gap-2">
                {viewMode === "rolling" && (
                  <Select
                    value={timeHorizon}
                    onValueChange={(value: any) =>
                      setTimeHorizon(value)
                    }
                  >
                    <SelectTrigger className="w-28 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">
                        30 Days
                      </SelectItem>
                      <SelectItem value="quarter">
                        90 Days
                      </SelectItem>
                      <SelectItem value="year">
                        1 Year
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
                {viewMode === "daily" && (
                  <Select
                    value={daysToShow.toString()}
                    onValueChange={(value) =>
                      setDaysToShow(
                        Number(value) as 7 | 14 | 30,
                      )
                    }
                  >
                    <SelectTrigger className="w-24 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 Days</SelectItem>
                      <SelectItem value="14">
                        14 Days
                      </SelectItem>
                      <SelectItem value="30">
                        30 Days
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Primary Readiness View */}
            {viewMode === "rolling" ? (
              <ReadinessView
                data={performanceData.daily}
                viewMode="rolling"
                daysToShow={
                  timeHorizon === "month"
                    ? 30
                    : timeHorizon === "quarter"
                      ? 90
                      : 365
                }
              />
            ) : (
              (() => {
                // Daily mode: Position check-in based on time of day
                const currentHour = new Date().getHours();
                const isMorning = currentHour < 11;

                const checkInComponent = (
                  <div className={isMorning ? "mb-4" : "mt-6"}>
                    <DailyCheckIn
                      onSave={handleSaveFeeling}
                      onLoadExisting={async (date) => {
                        const dayData =
                          performanceData.daily.find(
                            (d) => d.date === date,
                          );
                        if (dayData && dayData.feeling) {
                          return {
                            feeling: dayData.feeling,
                            note: dayData.note || "",
                          };
                        }
                        return null;
                      }}
                    />
                  </div>
                );

                const readinessView = (
                  <ReadinessView
                    data={performanceData.daily}
                    viewMode="daily"
                    daysToShow={daysToShow}
                    onExpandAIChat={handleExpandAIChat}
                  />
                );

                // In morning: check-in before readiness
                // After 11am: check-in after readiness
                return isMorning ? (
                  <>
                    {checkInComponent}
                    {readinessView}
                  </>
                ) : (
                  <>
                    {readinessView}
                    {checkInComponent}
                  </>
                );
              })()
            )}

            {/* Performance Insights Section */}
            <div className="mt-8">
              <PerformanceInsights insights={insights} />

              {insights.length === 0 && (
                <div className="mt-4 p-6 border border-dashed rounded-lg text-center">
                  <Activity className="size-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Demo data active
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload data to generate real insights
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="pictures" className="mt-0">
            <ProgressPictures authToken={session.access_token} />
          </TabsContent>

          <TabsContent value="chat" className="mt-0">
            <AIChat
              onSendMessage={handleSendMessage}
              hasHealthData={performanceData.daily.length > 0}
              initialPrompt={aiChatInitialPrompt}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
