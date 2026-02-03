// Generate realistic demo health data for 90 days
export function generateDemoHealthData(days: number = 90) {
  const data = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Base values with gradual trends
  let baseWeight = 178;
  let baseHRV = 48;
  let baseRestingHR = 62;
  let baseSleep = 7.0;
  let baseFeeling = 3.0;
  let baseRecovery = 60;
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Day of week patterns
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isMonday = dayOfWeek === 1;
    const isFriday = dayOfWeek === 5;
    
    // Gradual improvements over time (simulating training adaptation)
    const progress = i / days;
    const weightTrend = -3 * progress; // Lose 3 lbs over period
    const hrvTrend = 12 * progress; // HRV improves by 12ms
    const restingHRTrend = -5 * progress; // RHR drops 5 bpm
    
    // Weekly cycles - harder training mid-week, rest on weekends
    const weekCycle = Math.sin((i % 7) * Math.PI / 7);
    
    // Add some realistic variance and life events
    let stressMultiplier = 1.0;
    let alcoholEffect = 0;
    let sicknessEffect = 0;
    
    // Simulate occasional stress/poor sleep (roughly once per week)
    if (Math.random() < 0.12) {
      stressMultiplier = 0.7; // Bad sleep/high stress day
      alcoholEffect = -1.5; // Slightly worse sleep
    }
    
    // Simulate a "sick week" around day 25-30
    if (i >= 25 && i <= 30) {
      sicknessEffect = -15;
    }
    
    // Weekend patterns
    const weekendBonus = isWeekend ? 0.5 : 0; // More sleep on weekends
    const mondayPenalty = isMonday ? -0.8 : 0; // Tired on Mondays
    
    // Calculate daily values with realistic variation
    const sleep = Math.max(5.5, Math.min(9.5,
      baseSleep + weekendBonus + mondayPenalty + alcoholEffect + 
      (Math.random() - 0.5) * 1.5 + (progress * 0.5) // Gradual improvement
    ));
    
    const hrv = Math.max(30, Math.min(75,
      baseHRV + hrvTrend + sicknessEffect +
      (sleep - 7) * 3 + // HRV correlates with sleep
      (Math.random() - 0.5) * 8
    ));
    
    const restingHR = Math.max(48, Math.min(72,
      baseRestingHR + restingHRTrend + (sicknessEffect ? 8 : 0) -
      (sleep - 7) * 1.5 + // Better sleep = lower RHR
      (isMonday ? 3 : 0) + // Higher on Monday
      (Math.random() - 0.5) * 4
    ));
    
    const recovery = Math.max(20, Math.min(95,
      baseRecovery + sicknessEffect +
      (hrv - 50) * 0.8 + // HRV drives recovery
      (8 - restingHR/10) * 2 +
      (sleep - 7) * 8 +
      (Math.random() - 0.5) * 10 +
      (progress * 15) // Gradual improvement
    ));
    
    const feeling = Math.max(1, Math.min(5,
      baseFeeling + 
      (recovery - 65) / 20 + // Feeling correlates with recovery
      (sleep - 7) * 0.3 +
      (sicknessEffect ? -1.5 : 0) +
      (isWeekend ? 0.3 : 0) +
      (isFriday ? 0.5 : 0) + // Better feeling on Friday
      (isMonday ? -0.4 : 0) +
      (Math.random() - 0.5) * 0.8 +
      (progress * 0.8) // Gradual improvement
    ));
    
    // Training patterns - harder mid-week, easier weekends
    const baseActiveMinutes = isWeekend ? 25 : 45;
    const activeMinutes = Math.max(0, Math.min(120,
      baseActiveMinutes +
      (recovery > 70 ? 20 : 0) + // Train harder when recovered
      weekCycle * 20 +
      (sicknessEffect ? -30 : 0) +
      (Math.random() - 0.3) * 25
    ));
    
    const strain = Math.max(0, Math.min(21,
      6 + 
      (activeMinutes / 15) +
      (100 - recovery) / 15 +
      (Math.random() - 0.5) * 2
    ));
    
    // Steps correlate with active minutes and day type
    const baseSteps = isWeekend ? 7500 : 9500;
    const steps = Math.floor(Math.max(3000, Math.min(18000,
      baseSteps +
      activeMinutes * 50 +
      (Math.random() - 0.4) * 3000 +
      (progress * 2000) // Gradual increase
    )));
    
    // Weight with realistic fluctuations
    const weight = Math.round(
      (baseWeight + weightTrend + 
      (Math.random() - 0.5) * 1.5 + // Daily fluctuation
      (sleep < 6.5 ? 0.5 : 0)) * 10 // Water retention from poor sleep
    ) / 10;
    
    // Active energy correlates with activity
    const activeEnergy = Math.floor(
      activeMinutes * 6 + 
      steps * 0.03 +
      (Math.random() - 0.5) * 100
    );
    
    data.push({
      date: dateStr,
      recovery: Math.round(recovery),
      feeling: Math.round(feeling * 10) / 10,
      sleep: Math.round(sleep * 10) / 10,
      hrv: Math.round(hrv),
      restingHR: Math.round(restingHR),
      activeMinutes: Math.round(activeMinutes),
      steps,
      weight,
      strain: Math.round(strain * 10) / 10,
      activeEnergy,
      // Add some notes for interesting days
      note: sicknessEffect ? "Feeling under the weather" : 
            (recovery > 85 ? "Feeling great!" : 
            (recovery < 40 ? "Need more rest" : undefined))
    });
  }
  
  return data;
}

// Generate weekly summary data from daily data
export function generateWeeklyData(dailyData: any[]) {
  const weeks = [];
  const weeksCount = Math.ceil(dailyData.length / 7);
  
  for (let i = 0; i < weeksCount; i++) {
    const startIdx = i * 7;
    const weekData = dailyData.slice(startIdx, startIdx + 7);
    
    if (weekData.length === 0) continue;
    
    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    
    weeks.push({
      week: `Week ${i + 1}`,
      recovery: Math.round(avg(weekData.map(d => d.recovery))),
      strain: Math.round(avg(weekData.map(d => d.strain)) * 10) / 10,
      sleep: Math.round(avg(weekData.map(d => d.sleep)) * 10) / 10,
      hrv: Math.round(avg(weekData.map(d => d.hrv))),
      restingHR: Math.round(avg(weekData.map(d => d.restingHR))),
      activeMinutes: Math.round(avg(weekData.map(d => d.activeMinutes))),
      steps: Math.round(avg(weekData.map(d => d.steps))),
      weight: Math.round(avg(weekData.map(d => d.weight)) * 10) / 10
    });
  }
  
  return weeks;
}
