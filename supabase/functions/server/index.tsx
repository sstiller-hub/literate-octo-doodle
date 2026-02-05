import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "jsr:@supabase/supabase-js@2";

const app = new Hono();

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

// Admin client for storage and privileged operations
const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
);

// Storage bucket name for progress pictures
const BUCKET_NAME = 'make-84ed1a00-progress-pics';

// Initialize storage bucket on startup
async function initializeBucket() {
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);
    
    if (!bucketExists) {
      const { error } = await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
        public: false,
        fileSizeLimit: 10485760, // 10MB
      });
      if (error) {
        console.log('Error creating bucket:', error);
      } else {
        console.log('Progress pictures bucket created successfully');
      }
    } else {
      console.log('Progress pictures bucket already exists');
    }
  } catch (error) {
    console.log('Error initializing bucket:', error);
  }
}

// Initialize bucket
initializeBucket();

const createUserClient = (authHeader: string) => {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });
};

const requireUser = async (c: any) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader) {
    return { error: c.json({ error: "Unauthorized" }, 401) };
  }

  const supabase = createUserClient(authHeader);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    return { error: c.json({ error: "Unauthorized" }, 401) };
  }

  return { supabase, user: data.user };
};

const mapDailyRow = (row: any, userId: string) => ({
  user_id: userId,
  date: row.date,
  recovery: row.recovery ?? null,
  feeling: row.feeling ?? null,
  sleep: row.sleep ?? null,
  hrv: row.hrv ?? null,
  resting_hr: row.restingHR ?? row.resting_hr ?? null,
  active_minutes: row.activeMinutes ?? row.active_minutes ?? null,
  steps: row.steps ?? null,
  weight: row.weight ?? null,
  strain: row.strain ?? null,
  active_energy: row.activeEnergy ?? row.active_energy ?? null,
  note: row.note ?? null,
});

const mapDailyResponse = (row: any) => ({
  date: row.date,
  recovery: row.recovery,
  feeling: row.feeling,
  sleep: row.sleep,
  hrv: row.hrv,
  restingHR: row.resting_hr,
  activeMinutes: row.active_minutes,
  steps: row.steps,
  weight: row.weight,
  strain: row.strain,
  activeEnergy: row.active_energy,
  note: row.note ?? undefined,
});

const generateWeeklyData = (dailyData: any[]) => {
  const weeks = [];
  if (dailyData.length === 0) return weeks;

  for (let i = 0; i < dailyData.length; i += 7) {
    const chunk = dailyData.slice(i, i + 7);
    if (chunk.length === 0) continue;

    const avg = (values: number[]) =>
      values.reduce((a, b) => a + b, 0) / values.length;

    weeks.push({
      week: `Week ${weeks.length + 1}`,
      recovery: Math.round(avg(chunk.map(d => d.recovery ?? 0))),
      strain: Math.round(avg(chunk.map(d => d.strain ?? 0)) * 10) / 10,
      sleep: Math.round(avg(chunk.map(d => d.sleep ?? 0)) * 10) / 10,
      hrv: Math.round(avg(chunk.map(d => d.hrv ?? 0))),
      restingHR: Math.round(avg(chunk.map(d => d.restingHR ?? 0))),
      activeMinutes: Math.round(avg(chunk.map(d => d.activeMinutes ?? 0))),
      steps: Math.round(avg(chunk.map(d => d.steps ?? 0))),
      weight: Math.round(avg(chunk.map(d => d.weight ?? 0)) * 10) / 10,
    });
  }

  return weeks;
};

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-84ed1a00/health", (c) => {
  return c.json({ status: "ok" });
});

// Upload health data from JSON
app.post("/make-server-84ed1a00/health-data/upload", async (c) => {
  try {
    const auth = await requireUser(c);
    if (auth.error) return auth.error;

    const { supabase, user } = auth;
    const data = await c.req.json();

    if (!data?.daily || !Array.isArray(data.daily)) {
      return c.json({ success: false, error: "Daily data array required" }, 400);
    }

    const rows = data.daily.map((row: any) => mapDailyRow(row, user.id));
    const { error } = await supabase
      .from("daily_metrics")
      .upsert(rows, { onConflict: "user_id,date" });

    if (error) {
      console.log("Error saving daily metrics:", error);
      return c.json({ success: false, error: error.message }, 500);
    }

    return c.json({
      success: true,
      message: "Health data uploaded successfully",
      count: rows.length,
    });
  } catch (error) {
    console.log(`Error uploading health data: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// One-time migration from KV store to user tables
app.post("/make-server-84ed1a00/migrate-kv", async (c) => {
  try {
    const auth = await requireUser(c);
    if (auth.error) return auth.error;

    const { supabase, user } = auth;
    const dailyData = await kv.get('health:daily');

    if (!dailyData) {
      return c.json({ success: true, migrated: 0 });
    }

    let daily = [];
    try {
      daily = JSON.parse(dailyData);
    } catch (e) {
      console.log('Error parsing KV daily data:', e);
      return c.json({ success: false, error: 'Invalid KV data' }, 400);
    }

    const rows = daily.map((row: any) => mapDailyRow(row, user.id));
    const { error } = await supabase
      .from("daily_metrics")
      .upsert(rows, { onConflict: "user_id,date" });

    if (error) {
      console.log("Error migrating KV data:", error);
      return c.json({ success: false, error: error.message }, 500);
    }

    return c.json({ success: true, migrated: rows.length });
  } catch (error) {
    console.log(`Error migrating KV data: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get performance data (weekly aggregations)
app.get("/make-server-84ed1a00/performance-data", async (c) => {
  try {
    const auth = await requireUser(c);
    if (auth.error) return auth.error;

    const { supabase, user } = auth;
    const timeHorizon = c.req.query('timeHorizon') || 'week';

    const { data: dailyRows, error } = await supabase
      .from("daily_metrics")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: true });

    if (error) {
      console.log("Error fetching daily metrics:", error);
      return c.json({ error: error.message }, 500);
    }

    const daily = (dailyRows || []).map(mapDailyResponse);
    let weekly = generateWeeklyData(daily);
    
    // Filter based on time horizon
    let filteredWeekly = weekly;
    if (timeHorizon === 'week' && weekly.length > 4) {
      filteredWeekly = weekly.slice(-4);
    } else if (timeHorizon === 'month' && weekly.length > 12) {
      filteredWeekly = weekly.slice(-12);
    } else if (timeHorizon === 'quarter' && weekly.length > 26) {
      filteredWeekly = weekly.slice(-26);
    }
    
    return c.json({
      weekly: filteredWeekly,
      daily: daily
    });
  } catch (error) {
    console.log(`Error fetching performance data: ${error}`);
    return c.json({ error: String(error) }, 500);
  }
});

// Save daily feeling check-in
app.post("/make-server-84ed1a00/save-feeling", async (c) => {
  try {
    const auth = await requireUser(c);
    if (auth.error) return auth.error;

    const { supabase, user } = auth;
    const { date, feeling, note } = await c.req.json();
    
    if (!date || !feeling) {
      return c.json({ success: false, error: 'Date and feeling are required' }, 400);
    }

    const { error } = await supabase
      .from("daily_metrics")
      .upsert(
        {
          user_id: user.id,
          date,
          feeling,
          note: note || null,
        },
        { onConflict: "user_id,date" },
      );

    if (error) {
      console.log("Error saving feeling:", error);
      return c.json({ success: false, error: error.message }, 500);
    }

    return c.json({
      success: true,
      message: 'Feeling saved successfully'
    });
  } catch (error) {
    console.log(`Error saving feeling: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// AI chat endpoint - analyze performance trends
app.post("/make-server-84ed1a00/ai-chat", async (c) => {
  try {
    const auth = await requireUser(c);
    if (auth.error) return auth.error;

    const { supabase, user } = auth;
    const { message } = await c.req.json();

    const { data: dailyRows, error } = await supabase
      .from("daily_metrics")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: true });

    if (error) {
      console.log("Error fetching daily metrics for chat:", error);
      return c.json({ error: error.message }, 500);
    }

    const daily = (dailyRows || []).map(mapDailyResponse);
    const weekly = generateWeeklyData(daily);

    // Generate AI response based on trends
    const response = generatePerformanceResponse(message, weekly, daily);
    
    return c.json({ response });
  } catch (error) {
    console.log(`Error in AI chat: ${error}`);
    return c.json({ error: String(error) }, 500);
  }
});

// Generate performance insights
app.get("/make-server-84ed1a00/insights", async (c) => {
  try {
    const auth = await requireUser(c);
    if (auth.error) return auth.error;

    const { supabase, user } = auth;
    const { data: dailyRows, error } = await supabase
      .from("daily_metrics")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: true });

    if (error) {
      console.log("Error fetching daily metrics for insights:", error);
      return c.json({ error: error.message }, 500);
    }

    const daily = (dailyRows || []).map(mapDailyResponse);
    
    const insights = generatePerformanceInsights(daily);
    
    return c.json({ insights });
  } catch (error) {
    console.log(`Error generating insights: ${error}`);
    return c.json({ error: String(error) }, 500);
  }
});

// Helper function to generate performance-focused AI responses
function generatePerformanceResponse(message: string, weeklyData: any[], dailyData: any[]): string {
  const lowerMessage = message.toLowerCase();
  
  // Check for excluded metric questions - Product Philosophy enforcement
  const excludedMetrics = {
    'calories': 'We don\'t track calories burned because it rarely changes training decisions. Calorie estimates are imprecise and don\'t correlate meaningfully with readiness. We focus on Active Energy which reflects training load more accurately.',
    'steps goal': 'We don\'t use step goals or streaks. Arbitrary targets introduce noise without clarity. Step volume is captured through active energy without gamification.',
    'streak': 'We don\'t track streaks or achievements. Gamification optimizes for engagement, not decisions. This system is a tool, not a game.',
    'badge': 'We don\'t use badges or achievements. This system values signal over volume. We track what meaningfully affects readiness and exclude what doesn\'t.',
    'activity ring': 'We don\'t use generic activity rings. They don\'t explain what changed or why. Training load is more specific and decision-relevant.',
    'mood journal': 'We don\'t track extensive mood journaling. Subjective logs require interpretation effort. Recovery markers (HRV, RHR, sleep) provide objective context without friction.',
    'body temperature': 'We don\'t track body temperature. While useful for illness detection, it adds complexity. HRV and RHR already signal systemic stress effectively.',
    'blood oxygen': 'We don\'t track blood oxygen (SpO2). It correlates weakly with training readiness unless you\'re at altitude or managing respiratory conditions.',
    'spo2': 'We don\'t track SpO2 (blood oxygen). It correlates weakly with training readiness unless you\'re at altitude or managing respiratory conditions.',
    'health score': 'We don\'t use composite health scores without explainability. Every metric here can be traced to a specific decision path. No black boxes.'
  };

  // Check if message asks about an excluded metric
  for (const [keyword, explanation] of Object.entries(excludedMetrics)) {
    if (lowerMessage.includes(keyword)) {
      return explanation;
    }
  }

  // Check for "why don't you track" questions
  if (lowerMessage.includes('why don\'t') || lowerMessage.includes('why not track') || lowerMessage.includes('why no')) {
    return 'This system is optimized for training decisions, not exhaustiveness. We track what meaningfully affects readiness: Sleep, HRV, Resting HR, and training load. More data isn\'t better. Better decisions are. If a metric doesn\'t improve your ability to answer "should I train hard today?", it\'s intentionally excluded.';
  }

  // Check if user has data - adjust tone accordingly
  const hasData = dailyData.length > 0 || weeklyData.length > 0;
  
  // Check if user has no data - provide onboarding help
  if (!hasData) {
    // Apple Health export questions
    if (lowerMessage.includes('export') || lowerMessage.includes('apple health')) {
      return `📱 **How to Export Apple Health Data:**

**Method 1: Using Apple Health App**
1. Open Apple Health app on iPhone
2. Tap your profile picture (top right)
3. Scroll down and tap "Export All Health Data"
4. Save the export.zip file
5. Extract and find export.xml
6. Convert to JSON format (you can use online converters)

**Method 2: Quick Start (No Export Needed)**
Just use the daily "How You Feel" check-in on the Trends tab! The app will:
• Track your 1-5 feeling rating daily
• Automatically calculate 7-day rolling averages
• Show trends over time

**📊 Expected JSON Format:**
\`\`\`json
{
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
}
\`\`\`

Ready to upload? Click Settings → Upload Data!`;
    }
    
    // Metrics questions
    if (lowerMessage.includes('metrics') || lowerMessage.includes('track') || lowerMessage.includes('measure')) {
      return `📊 **Key Metrics to Track:**

**Core Metrics (Required):**
• **Feeling (1-5)**: Daily subjective well-being rating
• **Sleep Hours**: Total sleep time per night
• **Steps**: Daily step count
• **Weight**: Body weight in lbs

**Advanced Metrics (Optional):**
• **Recovery**: 0-100% calculated from sleep, HRV, resting HR
• **HRV**: Heart rate variability (resilience indicator)
• **Resting HR**: Morning resting heart rate
• **Active Minutes**: Time spent in moderate-vigorous activity

**🎯 Why These Metrics?**
• **Feeling** = Captures stress, illness, motivation
• **Sleep** = #1 recovery factor
• **Steps** = Daily activity baseline
• **Weight** = Long-term trend tracking

**💡 Pro Tip:** Focus on trends, not daily numbers! This app uses **7-day rolling averages** to smooth out daily variance and show real patterns.

Start with just "Feeling" + "Sleep" and add more as you go!`;
    }
    
    // Recovery score calculation questions
    if (lowerMessage.includes('recovery score') || lowerMessage.includes('recovery calculated') || lowerMessage.includes('recovery based')) {
      return `🔋 **How Recovery Score is Calculated:**

Recovery is a 0-100% score that combines three key physiological markers:

**Formula Components:**
1. **HRV (Heart Rate Variability)** - 40% weight
   • Higher HRV = Better recovery
   • Each +1ms HRV adds ~0.8% to recovery
   • Typical range: 30-75ms

2. **Sleep Duration** - 35% weight  
   • Each hour of sleep matters
   • 8+ hours = strong recovery boost
   • <6 hours = significant penalty

3. **Resting Heart Rate** - 25% weight
   • Lower RHR = Better fitness/recovery
   • Each -5 bpm improvement helps recovery
   • Elevated RHR signals stress/illness

**Example Calculation:**
• Sleep: 8.2 hours → +9.6% recovery
• HRV: 58ms → +6.4% recovery  
• Resting HR: 56 bpm → +4% recovery
• **Total: ~72% recovery** ✅

**What Recovery Scores Mean:**
• **67-100%**: Ready for high-intensity training
• **34-66%**: Moderate readiness, balanced training
• **0-33%**: Need rest and recovery

**💡 Pro Tip:** Recovery trends over time matter more than single-day scores. That's why we use 7-day rolling averages!`;
    }
    
    // Rolling average questions
    if (lowerMessage.includes('rolling') || lowerMessage.includes('average')) {
      return `📈 **How Rolling Averages Work:**

**What is a 7-Day Rolling Average?**
Instead of looking at single days, we average the last 7 days to smooth out noise:
• Yesterday's late night? Won't tank your trend
• Great workout? Contributes to upward momentum
• See the forest, not just the trees

**Example:**
Day 1-7 average: 3.4/5 feeling
Day 2-8 average: 3.6/5 feeling ⬆️ **Improving trend!**

**Why 7 Days?**
• Captures full weekly cycle (work week + weekend)
• Balances responsiveness vs stability
• Matches human circadian rhythms

**Rolling vs Daily View:**
• **Rolling Mode**: Smooth trends, see big picture (30/90/365 days)
• **Daily Mode**: Raw data points, spot patterns (7/14/30 days)

**💡 Pro Tip:** Use Rolling for trends, Daily to investigate specific days!`;
    }
    
    // View mode questions
    if (lowerMessage.includes('difference') || lowerMessage.includes('daily view') || lowerMessage.includes('rolling view')) {
      return `🔍 **Rolling vs Daily View Explained:**

**Rolling View** 📈
• Shows 7-day rolling averages
• Smooths out daily fluctuations
• Best for: spotting trends, measuring progress
• Time ranges: 30 days, 90 days, 1 year
• Use when: reviewing overall trajectory

**Daily View** 📊
• Shows individual data points
• See exact values per day
• Best for: investigating specific days, spotting patterns
• Time ranges: 7, 14, or 30 days
• Use when: "Why did I feel bad Thursday?"

**📅 Smart Defaults:**
• **Monday-Friday**: Opens to Daily view (7 days)
  → Check yesterday + week context
• **Saturday**: Opens to Daily view (14 days)
  → Review last 2 weeks before Sunday weigh-in
• **Sunday**: Opens to Photos tab
  → Take progress pictures!

**💡 Pro Tip:** Toggle between views! Use Rolling for trends, then switch to Daily to see which specific days drove that trend.`;
    }
    
    // Getting started
    if (lowerMessage.includes('start') || lowerMessage.includes('begin') || lowerMessage.includes('setup')) {
      return `🚀 **Let's Get You Started!**

**Option 1: Quick Start (2 minutes)**
1. Go to Trends tab
2. Find "Daily Check-In" card
3. Rate how you feel today (1-5)
4. Come back tomorrow and do it again
5. After 7 days, you'll see your first rolling average!

**Option 2: Full Setup (15 minutes)**
1. Export Apple Health data (see "How do I export Apple Health data?")
2. Convert to JSON format
3. Click Settings → Upload Data
4. See instant trends and insights!

**📱 App Features:**
• **Trends**: View rolling averages or daily data
• **Photos**: Take progress pictures (Sundays!)
• **AI**: Ask me questions anytime (that's me! 👋)
• **Settings**: Upload data, view year review

**🎯 First Goal:** Get 7 consecutive days of data
Then you'll unlock rolling averages and trend insights!

Which option sounds better for you?`;
    }
    
    // General onboarding
    return `I'm here to help you get started! 

**I can help with:**
• "How do I export Apple Health data?"
• "What metrics should I track?"
• "How do rolling averages work?"
• "What's the difference between Rolling and Daily view?"
• "How do I get started?"

**Or just:**
1. Click Settings (top right) → Upload Data
2. Start with daily "How You Feel" check-ins
3. Come back in 7 days for your first trends!

What would you like to know?`;
  }
  
  const currentWeek = weeklyData.length > 0 ? weeklyData[weeklyData.length - 1] : null;
  const previousWeek = weeklyData.length > 1 ? weeklyData[weeklyData.length - 2] : null;
  const today = dailyData.length > 0 ? dailyData[dailyData.length - 1] : null;
  const yesterday = dailyData.length > 1 ? dailyData[dailyData.length - 2] : null;
  
  // FOR USERS WITH DATA: Concise, decisive, action-oriented responses
  
  // Today/readiness
  if (lowerMessage.includes('today') || lowerMessage.includes('right now') || lowerMessage.includes('readiness')) {
    if (!today) return "No data for today yet.";
    
    const readiness = today.recovery;
    let action = "";
    
    if (readiness >= 67) {
      action = "Ready for high-intensity work.";
    } else if (readiness >= 34) {
      action = "Moderate training load recommended.";
    } else {
      action = "Prioritize recovery today.";
    }
    
    return `${readiness}% readiness. ${action} Sleep: ${today.sleep.toFixed(1)}h, HRV: ${today.hrv}ms.`;
  }
  
  // Sleep questions
  if (lowerMessage.includes('sleep')) {
    if (!today && !currentWeek) return "No sleep data available.";
    
    const sleepHours = today ? today.sleep : currentWeek.sleep;
    const readiness = today ? today.recovery : currentWeek.recovery;
    
    if (sleepHours < 7) {
      return `Sleep: ${sleepHours.toFixed(1)}h. This is limiting your readiness (${readiness}%). Target 7-9h consistently.`;
    } else if (sleepHours >= 8) {
      return `Sleep: ${sleepHours.toFixed(1)}h. Strong foundation for recovery. Keep it up.`;
    } else {
      return `Sleep: ${sleepHours.toFixed(1)}h. Adequate but room to improve. Push toward 8h for optimal readiness.`;
    }
  }
  
  // Trend/progress questions
  if (lowerMessage.includes('trend') || lowerMessage.includes('progress') || lowerMessage.includes('this week')) {
    const last7Days = dailyData.slice(-7);
    if (last7Days.length < 7) return "Need at least 7 days of data for trends.";
    
    const currentAvg = last7Days.reduce((sum, d) => sum + d.recovery, 0) / 7;
    const previous7 = dailyData.slice(-14, -7);
    const previousAvg = previous7.length === 7 
      ? previous7.reduce((sum, d) => sum + d.recovery, 0) / 7 
      : null;
    
    if (!previousAvg) {
      return `Current 7-day average: ${currentAvg.toFixed(0)}% readiness.`;
    }
    
    const change = currentAvg - previousAvg;
    const sleepAvg = last7Days.reduce((sum, d) => sum + d.sleep, 0) / 7;
    
    if (change > 5) {
      return `Readiness improving: ${currentAvg.toFixed(0)}% (up ${change.toFixed(0)}%). You're adapting well. Maintain current load.`;
    } else if (change < -5) {
      if (sleepAvg < 7) {
        return `Readiness declining: ${currentAvg.toFixed(0)}% (down ${Math.abs(change).toFixed(0)}%). Sleep was the bottleneck. Keep training volume moderate.`;
      }
      return `Readiness declining: ${currentAvg.toFixed(0)}% (down ${Math.abs(change).toFixed(0)}%). Consider a recovery day or reduced intensity.`;
    } else {
      return `Readiness stable: ${currentAvg.toFixed(0)}%. Maintain current training load.`;
    }
  }
  
  // Recovery/strain balance
  if (lowerMessage.includes('recovery') || lowerMessage.includes('strain') || lowerMessage.includes('training')) {
    if (!today) return "No data for today.";
    
    const readiness = today.recovery;
    const strain = today.strain || 0;
    
    if (strain >= 14 && readiness < 50) {
      return `High strain (${strain.toFixed(1)}) + low readiness (${readiness}%) = overtraining risk. Deload this week.`;
    } else if (strain >= 10 && readiness >= 67) {
      return `Optimal zone: High load (${strain.toFixed(1)}) + strong readiness (${readiness}%). Sweet spot for gains.`;
    } else if (readiness >= 67) {
      return `${readiness}% readiness. Good capacity for high-intensity work today.`;
    } else if (readiness < 34) {
      return `${readiness}% readiness. Rest or active recovery only.`;
    } else {
      return `${readiness}% readiness. Moderate training load appropriate.`;
    }
  }
  
  // HRV questions
  if (lowerMessage.includes('hrv')) {
    if (!today && !currentWeek) return "No HRV data available.";
    
    const hrv = today ? today.hrv : currentWeek.hrv;
    const readiness = today ? today.recovery : currentWeek.recovery;
    
    if (hrv >= 60) {
      return `HRV: ${hrv}ms. Strong recovery indicator. Readiness: ${readiness}%.`;
    } else if (hrv >= 40) {
      return `HRV: ${hrv}ms. Moderate range. Monitor alongside sleep and RHR.`;
    } else {
      return `HRV: ${hrv}ms. Lower than ideal. Prioritize sleep and stress management.`;
    }
  }
  
  // General/fallback
  return `Ask me: "What's my readiness today?" or "How are my trends this week?" or "Should I train hard today?"`;
}

// Helper function to generate weekly performance insights
function generatePerformanceInsights(dailyData: any[]): Array<{
  title: string;
  description: string;
  type: 'success' | 'warning' | 'info' | 'action';
  metric?: string;
  trend?: 'up' | 'down' | 'stable';
}> {
  const insights = [];
  
  if (dailyData.length === 0) {
    return [];
  }
  
  const currentDay = dailyData[dailyData.length - 1];
  const previousDay = dailyData.length > 1 ? dailyData[dailyData.length - 2] : null;
  const last4Days = dailyData.slice(-4);
  
  // Recovery insight
  if (previousDay) {
    const recoveryChange = currentDay.recovery - previousDay.recovery;
    if (recoveryChange > 10) {
      insights.push({
        title: 'Recovery Improving',
        description: `Your recovery is up ${Math.round(recoveryChange)}% from last week. Your body is adapting well to training stress. Great time to push intensity.`,
        type: 'success',
        metric: `+${Math.round(recoveryChange)}%`,
        trend: 'up'
      });
    } else if (recoveryChange < -10) {
      insights.push({
        title: 'Recovery Declining',
        description: `Recovery dropped ${Math.round(Math.abs(recoveryChange))}% this week. Consider adding a rest day or reducing training volume to rebuild.`,
        type: 'warning',
        metric: `${Math.round(recoveryChange)}%`,
        trend: 'down'
      });
    }
  }
  
  // Strain-Recovery balance
  if (currentDay.strain >= 14 && currentDay.recovery < 50) {
    insights.push({
      title: 'High Strain, Low Recovery',
      description: 'Your training load is very high while recovery is compromised. Risk of overtraining - prioritize sleep and consider a deload week.',
      type: 'warning'
    });
  } else if (currentDay.strain >= 10 && currentDay.recovery >= 67) {
    insights.push({
      title: 'Optimal Training Zone',
      description: 'High training load with strong recovery - this is the sweet spot for performance gains. Keep this balance!',
      type: 'success'
    });
  }
  
  // Sleep consistency
  const avgSleep = last4Days.reduce((sum, w) => sum + w.sleep, 0) / last4Days.length;
  if (avgSleep >= 7.5) {
    insights.push({
      title: 'Excellent Sleep Consistency',
      description: `Averaging ${avgSleep.toFixed(1)}h of sleep over 4 weeks. This is your recovery foundation - maintain this!`,
      type: 'success'
    });
  } else if (avgSleep < 6.5) {
    insights.push({
      title: 'Sleep Opportunity',
      description: `Only ${avgSleep.toFixed(1)}h average sleep. Aim for 7-9 hours to maximize recovery and performance potential.`,
      type: 'action'
    });
  }
  
  // HRV trend
  if (last4Days.length >= 2) {
    const recentHRV = last4Days.slice(-2).reduce((sum, w) => sum + w.hrv, 0) / 2;
    const olderHRV = last4Days.slice(0, 2).reduce((sum, w) => sum + w.hrv, 0) / 2;
    
    if (recentHRV > olderHRV * 1.1) {
      insights.push({
        title: 'HRV Trending Up',
        description: 'Your HRV is increasing over the past few weeks, indicating improved cardiovascular fitness and recovery capacity.',
        type: 'success',
        trend: 'up'
      });
    }
  }
  
  // Resting HR trend
  if (previousDay) {
    const rhrChange = currentDay.restingHR - previousDay.restingHR;
    if (rhrChange <= -3) {
      insights.push({
        title: 'Resting Heart Rate Improving',
        description: `RHR decreased by ${Math.abs(rhrChange)} bpm. Lower resting HR indicates better cardiovascular fitness.`,
        type: 'success',
        trend: 'down'
      });
    } else if (rhrChange >= 5) {
      insights.push({
        title: 'Elevated Resting Heart Rate',
        description: `RHR increased ${rhrChange} bpm. This could indicate inadequate recovery, stress, or illness. Monitor closely.`,
        type: 'warning',
        trend: 'up'
      });
    }
  }
  
  // Training volume
  const avgActiveMinutes = last4Days.reduce((sum, w) => sum + w.activeMinutes, 0) / last4Days.length;
  if (avgActiveMinutes >= 200) {
    insights.push({
      title: 'Strong Training Volume',
      description: `Averaging ${Math.round(avgActiveMinutes)} active minutes per week. You're putting in consistent work!`,
      type: 'info'
    });
  } else if (avgActiveMinutes < 100) {
    insights.push({
      title: 'Increase Training Volume',
      description: 'Current volume is low. Gradually increase weekly active minutes to see performance improvements.',
      type: 'action'
    });
  }
  
  return insights;
}

// Upload progress picture
app.post("/make-server-84ed1a00/progress-picture/upload", async (c) => {
  try {
    const auth = await requireUser(c);
    if (auth.error) return auth.error;

    const { supabase, user } = auth;
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const date = formData.get('date') as string;
    const notes = formData.get('notes') as string || '';
    const view = formData.get('view') as string || 'front';
    
    if (!file) {
      return c.json({ success: false, error: 'No file provided' }, 400);
    }
    
    if (!date) {
      return c.json({ success: false, error: 'No date provided' }, 400);
    }
    
    // Validate view
    if (!['front', 'side', 'back'].includes(view)) {
      return c.json({ success: false, error: 'Invalid view. Must be front, side, or back' }, 400);
    }
    
    // Generate unique filename with view
    const fileExt = file.name.split('.').pop();
    const fileName = `${date}-${view}-${Date.now()}.${fileExt}`;
    
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);
    
    // Upload to Supabase Storage
    const { error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false
      });
    
    if (error) {
      console.log('Error uploading file to storage:', error);
      return c.json({ success: false, error: error.message }, 500);
    }
    
    const { data: inserted, error: insertError } = await supabase
      .from("progress_pictures")
      .insert({
        user_id: user.id,
        date,
        notes,
        view,
        storage_path: fileName,
      })
      .select("*")
      .single();

    if (insertError) {
      console.log("Error saving progress picture metadata:", insertError);
      return c.json({ success: false, error: insertError.message }, 500);
    }

    return c.json({
      success: true,
      message: 'Progress picture uploaded successfully',
      picture: {
        id: inserted.id,
        date: inserted.date,
        notes: inserted.notes,
        view: inserted.view,
        uploadedAt: inserted.created_at,
      },
    });
  } catch (error) {
    console.log(`Error uploading progress picture: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get all progress pictures
app.get("/make-server-84ed1a00/progress-pictures", async (c) => {
  try {
    const auth = await requireUser(c);
    if (auth.error) return auth.error;

    const { supabase, user } = auth;
    const { data: pictures, error } = await supabase
      .from("progress_pictures")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (error) {
      console.log("Error fetching progress pictures:", error);
      return c.json({ error: error.message }, 500);
    }

    const picturesWithUrls = await Promise.all(
      (pictures || []).map(async (pic) => {
        const { data, error: urlError } = await supabaseAdmin.storage
          .from(BUCKET_NAME)
          .createSignedUrl(pic.storage_path, 3600);

        if (urlError) {
          console.log('Error creating signed URL:', urlError);
        }

        return {
          id: pic.id,
          date: pic.date,
          notes: pic.notes || "",
          view: pic.view,
          fileName: pic.storage_path,
          uploadedAt: pic.created_at,
          url: urlError ? null : data.signedUrl,
        };
      })
    );

    return c.json({ pictures: picturesWithUrls });
  } catch (error) {
    console.log(`Error fetching progress pictures: ${error}`);
    return c.json({ error: String(error) }, 500);
  }
});

// Delete progress picture
app.delete("/make-server-84ed1a00/progress-picture/:id", async (c) => {
  try {
    const auth = await requireUser(c);
    if (auth.error) return auth.error;

    const { supabase, user } = auth;
    const id = c.req.param('id');

    const { data: deleted, error } = await supabase
      .from("progress_pictures")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*")
      .maybeSingle();

    if (error) {
      console.log("Error deleting progress picture:", error);
      return c.json({ success: false, error: error.message }, 500);
    }

    if (!deleted) {
      return c.json({ success: false, error: "Not found" }, 404);
    }

    const { error: storageError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove([deleted.storage_path]);

    if (storageError) {
      console.log('Error deleting file from storage:', storageError);
    }

    return c.json({ success: true, message: 'Progress picture deleted successfully' });
  } catch (error) {
    console.log(`Error deleting progress picture: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

Deno.serve(app.fetch);
