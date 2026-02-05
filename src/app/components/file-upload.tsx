import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Upload, FileJson, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { functionsBaseUrl } from "@/app/utils/supabase/client";

interface FileUploadProps {
  onUploadSuccess: () => void;
  authToken: string;
}

export function FileUpload({ onUploadSuccess, authToken }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [acceptedSummary, setAcceptedSummary] = useState<{
    count: number;
    sample: Array<{
      date: string;
      steps?: number;
      sleep?: number;
      hrv?: number;
      restingHR?: number;
      activeMinutes?: number;
      activeEnergy?: number;
      weight?: number;
      feeling?: number;
    }>;
  } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast.error('Please upload a JSON file');
      return;
    }

    setIsUploading(true);
    setUploadSuccess(false);
    setAcceptedSummary(null);
    setUploadError(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data?.daily || !Array.isArray(data.daily)) {
        throw new Error("Expected JSON with a top-level `daily` array.");
      }

      // Upload to backend
      const response = await fetch(
        `${functionsBaseUrl}/health-data/upload`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify(data)
        }
      );

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.error || "Upload failed");
      }

      const result = await response.json().catch(() => ({}));
      const sample = data.daily.slice(0, 5).map((d: any) => ({
        date: d.date,
        steps: d.steps,
        sleep: d.sleep,
        hrv: d.hrv,
        restingHR: d.restingHR,
        activeMinutes: d.activeMinutes,
        activeEnergy: d.activeEnergy,
        weight: d.weight,
        feeling: d.feeling,
      }));
      setAcceptedSummary({
        count: Number.isFinite(result?.count) ? result.count : data.daily.length,
        sample,
      });

      setUploadSuccess(true);
      toast.success('Health data uploaded successfully!');
      onUploadSuccess();
      
      // Reset success state after 2 seconds
      setTimeout(() => setUploadSuccess(false), 2000);
    } catch (error) {
      console.error('Upload error:', error);
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to upload file. Please check the format.';
      setUploadError(message);
      toast.error(message);
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Upload Health Data</CardTitle>
        <CardDescription>Import your Apple Health data as JSON</CardDescription>
      </CardHeader>
      <CardContent>
        <label htmlFor="file-upload">
          <input
            id="file-upload"
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />
          <Button 
            className="w-full"
            disabled={isUploading}
            onClick={() => document.getElementById('file-upload')?.click()}
            variant={uploadSuccess ? "default" : "outline"}
          >
            {isUploading ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : uploadSuccess ? (
              <>
                <Check className="size-4 mr-2" />
                Uploaded!
              </>
            ) : (
              <>
                <Upload className="size-4 mr-2" />
                Select JSON File
              </>
            )}
          </Button>
        </label>
        
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-start gap-2">
            <FileJson className="size-4 mt-0.5 text-muted-foreground" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium">Expected JSON format:</p>
              <pre className="text-[10px] overflow-x-auto">
{`{
  "steps": [{"date": "2026-01-25", "count": 10234}],
  "heartRate": [{"date": "2026-01-25", "bpm": 72}],
  "sleep": [{"date": "2026-01-25", "hours": 7.5}],
  "workouts": [{"date": "2026-01-25", "type": "Running", "duration": 30, "calories": 250}]
}`}
              </pre>
            </div>
          </div>
        </div>

        {uploadError && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg">
            <p className="text-xs text-red-800 dark:text-red-200">
              {uploadError}
            </p>
          </div>
        )}

        {acceptedSummary && (
          <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-lg">
            <p className="text-xs text-emerald-800 dark:text-emerald-200 font-medium">
              Accepted {acceptedSummary.count} daily records
            </p>
            {acceptedSummary.sample.length > 0 && (
              <pre className="mt-2 text-[10px] overflow-x-auto bg-emerald-100 dark:bg-emerald-900/50 p-2 rounded">
                {JSON.stringify(acceptedSummary.sample, null, 2)}
              </pre>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
