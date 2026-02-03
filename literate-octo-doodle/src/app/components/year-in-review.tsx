import { useState, useEffect } from "react";
import { Card, CardContent } from "@/app/components/ui/card";
import { 
  TrendingUp, 
  TrendingDown, 
  Award, 
  Calendar, 
  Moon, 
  Activity, 
  Weight as WeightIcon,
  Heart,
  Footprints,
  Zap,
  Trophy,
  Star,
  Sparkles,
  Camera
} from "lucide-react";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";

interface YearInReviewProps {
  year: number;
  data: {
    totalDays: number;
    totalSteps: number;
    totalSleep: number;
    avgFeeling: number;
    avgWeight?: number;
    bestWeek: {
      dateRange: string;
      avgFeeling: number;
      avgSleep: number;
      avgSteps: number;
    };
    worstWeek: {
      dateRange: string;
      avgFeeling: number;
      avgSleep: number;
    };
    monthlyBreakdown: Array<{
      month: string;
      avgFeeling: number;
      avgSleep: number;
      avgSteps: number;
      avgWeight?: number;
    }>;
    records: {
      mostSteps: { value: number; date: string };
      bestSleep: { value: number; date: string };
      bestFeeling: { value: number; date: string };
    };
    progressPhotos?: {
      first?: string;
      last?: string;
    };
    weightChange?: number;
  };
}

export function YearInReview({ year, data }: YearInReviewProps) {
  const [currentSection, setCurrentSection] = useState(0);
  
  const getFeelingEmoji = (feeling: number) => {
    if (feeling >= 4.5) return '🔥';
    if (feeling >= 3.5) return '😊';
    if (feeling >= 2.5) return '😐';
    if (feeling >= 1.5) return '😴';
    return '🤕';
  };

  const sections = [
    {
      id: 'hero',
      title: `Your ${year} Journey`,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <Sparkles className="size-16 mx-auto mb-4 text-yellow-500" />
            <h1 className="text-4xl font-bold mb-2">
              {year} Year in Review
            </h1>
            <p className="text-muted-foreground">
              {data.totalDays} days of tracking your health journey
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8">
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
              <CardContent className="pt-6 text-center">
                <Footprints className="size-8 mx-auto mb-2 text-blue-600" />
                <div className="text-3xl font-bold">
                  {(data.totalSteps / 1000000).toFixed(1)}M
                </div>
                <div className="text-sm text-muted-foreground">Total Steps</div>
                <div className="text-xs text-muted-foreground mt-1">
                  ~{Math.round(data.totalSteps * 2.5 / 5280)} miles walked
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
              <CardContent className="pt-6 text-center">
                <Moon className="size-8 mx-auto mb-2 text-purple-600" />
                <div className="text-3xl font-bold">
                  {Math.round(data.totalSleep)}
                </div>
                <div className="text-sm text-muted-foreground">Hours Slept</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {Math.round(data.totalSleep / 24)} full days of rest
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 border-amber-500/20">
            <CardContent className="pt-6 text-center">
              <div className="text-5xl mb-2">{getFeelingEmoji(data.avgFeeling)}</div>
              <div className="text-2xl font-bold">
                {data.avgFeeling.toFixed(1)}/5 Average
              </div>
              <div className="text-sm text-muted-foreground">How You Felt This Year</div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 'records',
      title: 'Personal Records',
      content: (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <Trophy className="size-12 mx-auto mb-3 text-yellow-500" />
            <h2 className="text-2xl font-bold">Your Best Days</h2>
            <p className="text-sm text-muted-foreground">Breaking your own records</p>
          </div>

          <Card className="border-2 border-green-500/20 bg-green-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Footprints className="size-5 text-green-600" />
                  <span className="font-semibold">Most Steps</span>
                </div>
                <Award className="size-5 text-yellow-500" />
              </div>
              <div className="text-3xl font-bold text-green-600">
                {data.records.mostSteps.value.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {new Date(data.records.mostSteps.date).toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-500/20 bg-purple-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Moon className="size-5 text-purple-600" />
                  <span className="font-semibold">Best Sleep</span>
                </div>
                <Award className="size-5 text-yellow-500" />
              </div>
              <div className="text-3xl font-bold text-purple-600">
                {data.records.bestSleep.value.toFixed(1)}h
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {new Date(data.records.bestSleep.date).toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-amber-500/20 bg-amber-500/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="size-5 text-amber-600" />
                  <span className="font-semibold">Peak Performance</span>
                </div>
                <Award className="size-5 text-yellow-500" />
              </div>
              <div className="text-3xl font-bold text-amber-600">
                {getFeelingEmoji(data.records.bestFeeling.value)} {data.records.bestFeeling.value}/5
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {new Date(data.records.bestFeeling.date).toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 'best-worst',
      title: 'Your Peaks & Valleys',
      content: (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <TrendingUp className="size-12 mx-auto mb-3 text-green-500" />
            <h2 className="text-2xl font-bold">Best & Challenging Weeks</h2>
            <p className="text-sm text-muted-foreground">Every journey has ups and downs</p>
          </div>

          <Card className="border-2 border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Star className="size-6 text-green-600" />
                <h3 className="text-lg font-bold">Best Week</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{data.bestWeek.dateRange}</p>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="text-2xl mb-1">{getFeelingEmoji(data.bestWeek.avgFeeling)}</div>
                  <div className="text-sm font-semibold">{data.bestWeek.avgFeeling.toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground">Feeling</div>
                </div>
                <div className="text-center">
                  <Moon className="size-6 mx-auto mb-1 text-purple-600" />
                  <div className="text-sm font-semibold">{data.bestWeek.avgSleep.toFixed(1)}h</div>
                  <div className="text-xs text-muted-foreground">Sleep</div>
                </div>
                <div className="text-center">
                  <Footprints className="size-6 mx-auto mb-1 text-blue-600" />
                  <div className="text-sm font-semibold">{(data.bestWeek.avgSteps / 1000).toFixed(1)}k</div>
                  <div className="text-xs text-muted-foreground">Steps</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-500/30 bg-gradient-to-br from-orange-500/10 to-red-500/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="size-6 text-orange-600" />
                <h3 className="text-lg font-bold">Challenging Week</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{data.worstWeek.dateRange}</p>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <div className="text-2xl mb-1">{getFeelingEmoji(data.worstWeek.avgFeeling)}</div>
                  <div className="text-sm font-semibold">{data.worstWeek.avgFeeling.toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground">Feeling</div>
                </div>
                <div className="text-center">
                  <Moon className="size-6 mx-auto mb-1 text-purple-600" />
                  <div className="text-sm font-semibold">{data.worstWeek.avgSleep.toFixed(1)}h</div>
                  <div className="text-xs text-muted-foreground">Sleep</div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-background/50 rounded-lg">
                <p className="text-xs text-muted-foreground italic">
                  💪 You pushed through and kept tracking. That's growth.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 'transformation',
      title: 'Your Transformation',
      content: (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <Sparkles className="size-12 mx-auto mb-3 text-purple-500" />
            <h2 className="text-2xl font-bold">Visual Progress</h2>
            <p className="text-sm text-muted-foreground">See how far you've come</p>
          </div>

          {data.progressPhotos?.first && data.progressPhotos?.last ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-2 text-center">Start of {year}</p>
                  <div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden">
                    <ImageWithFallback 
                      src={data.progressPhotos.first} 
                      alt="Start of year"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2 text-center">End of {year}</p>
                  <div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden">
                    <ImageWithFallback 
                      src={data.progressPhotos.last} 
                      alt="End of year"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              {data.weightChange && (
                <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
                  <CardContent className="pt-6 text-center">
                    <WeightIcon className="size-8 mx-auto mb-2 text-blue-600" />
                    <div className="text-2xl font-bold">
                      {data.weightChange > 0 ? '+' : ''}{data.weightChange.toFixed(1)} lbs
                    </div>
                    <div className="text-sm text-muted-foreground">Weight Change</div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card className="border-2 border-dashed">
              <CardContent className="pt-6 text-center py-12">
                <Camera className="size-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No progress photos for {year}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Start taking weekly photos to see your transformation next year!
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )
    },
    {
      id: 'monthly',
      title: 'Month by Month',
      content: (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <Calendar className="size-12 mx-auto mb-3 text-indigo-500" />
            <h2 className="text-2xl font-bold">Monthly Breakdown</h2>
            <p className="text-sm text-muted-foreground">Your year at a glance</p>
          </div>

          <div className="space-y-3">
            {data.monthlyBreakdown.map((month, idx) => (
              <Card key={month.month} className="border-l-4 border-l-primary">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">{month.month}</h3>
                    <div className="text-xl">{getFeelingEmoji(month.avgFeeling)}</div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-muted-foreground">Feeling</div>
                      <div className="font-semibold">{month.avgFeeling.toFixed(1)}/5</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Sleep</div>
                      <div className="font-semibold">{month.avgSleep.toFixed(1)}h</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Steps</div>
                      <div className="font-semibold">{(month.avgSteps / 1000).toFixed(1)}k</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )
    }
  ];

  const currentSectionData = sections[currentSection];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {sections.map((section, idx) => (
          <button
            key={section.id}
            onClick={() => setCurrentSection(idx)}
            className={`h-1.5 rounded-full transition-all ${
              idx === currentSection 
                ? 'w-8 bg-primary' 
                : 'w-1.5 bg-muted-foreground/30'
            }`}
            aria-label={`Go to ${section.title}`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="mb-6">
        {currentSectionData.content}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
          disabled={currentSection === 0}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-muted disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted/80 transition-colors"
        >
          Previous
        </button>

        <span className="text-sm text-muted-foreground">
          {currentSection + 1} of {sections.length}
        </span>

        <button
          onClick={() => setCurrentSection(Math.min(sections.length - 1, currentSection + 1))}
          disabled={currentSection === sections.length - 1}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}