#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { XMLParser } from "fast-xml-parser";

const [,, inputPath, outputPathArg] = process.argv;

if (!inputPath) {
  console.error("Usage: node scripts/convert-apple-health.mjs /path/to/export.xml [/path/to/output.json]");
  process.exit(1);
}

const outputPath = outputPathArg || path.resolve(process.cwd(), "health-data.json");

const xml = fs.readFileSync(inputPath, "utf8");
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
});

const data = parser.parse(xml);
const records = data?.HealthData?.Record ?? [];

const dayKey = (dateStr) => {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
};

const ensureDay = (acc, date) => {
  if (!acc[date]) {
    acc[date] = {
      date,
      steps: 0,
      sleep: 0,
      hrv: [],
      restingHR: [],
      activeMinutes: 0,
      weight: [],
      activeEnergy: 0,
    };
  }
  return acc[date];
};

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

// Build daily map with proper scope
const dailyMap = Object.create(null);
for (const rec of records) {
  const type = rec.type;
  const date = dayKey(rec.startDate);
  if (!type || !date) continue;

  const day = ensureDay(dailyMap, date);
  const value = toNumber(rec.value);

  if (type === "HKQuantityTypeIdentifierStepCount" && value != null) {
    day.steps += value;
  } else if (type === "HKQuantityTypeIdentifierHeartRateVariabilitySDNN" && value != null) {
    day.hrv.push(value);
  } else if (type === "HKQuantityTypeIdentifierRestingHeartRate" && value != null) {
    day.restingHR.push(value);
  } else if (type === "HKQuantityTypeIdentifierAppleExerciseTime" && value != null) {
    day.activeMinutes += value;
  } else if (type === "HKQuantityTypeIdentifierActiveEnergyBurned" && value != null) {
    day.activeEnergy += value;
  } else if (type === "HKQuantityTypeIdentifierBodyMass" && value != null) {
    day.weight.push(value);
  } else if (type === "HKCategoryTypeIdentifierSleepAnalysis") {
    const sleepValue = rec.value;
    if (sleepValue === "HKCategoryValueSleepAnalysisAsleep") {
      const start = new Date(rec.startDate);
      const end = new Date(rec.endDate);
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
        const hours = (end - start) / (1000 * 60 * 60);
        if (hours > 0) day.sleep += hours;
      }
    }
  }
}

const avg = (arr) => {
  if (!arr || arr.length === 0) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
};

const daily = Object.values(dailyMap)
  .map((d) => ({
    date: d.date,
    steps: Math.round(d.steps),
    sleep: d.sleep ? Math.round(d.sleep * 10) / 10 : undefined,
    hrv: d.hrv.length ? Math.round(avg(d.hrv)) : undefined,
    restingHR: d.restingHR.length ? Math.round(avg(d.restingHR)) : undefined,
    activeMinutes: d.activeMinutes ? Math.round(d.activeMinutes) : undefined,
    activeEnergy: d.activeEnergy ? Math.round(d.activeEnergy) : undefined,
    weight: d.weight.length ? Math.round(avg(d.weight) * 10) / 10 : undefined,
  }))
  .sort((a, b) => a.date.localeCompare(b.date));

const output = { daily };
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
console.log(`Wrote ${daily.length} days to ${outputPath}`);
