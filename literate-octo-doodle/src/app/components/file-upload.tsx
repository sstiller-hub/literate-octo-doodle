import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Upload, FileJson, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

interface FileUploadProps {
  onUploadSuccess: () => void;
}

export function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast.error('Please upload a JSON file');
      return;
    }

    setIsUploading(true);
    setUploadSuccess(false);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Upload to backend
      const response = await fetch(
        `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/make-server-84ed1a00/health-data/upload`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify(data)
        }
      );

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      setUploadSuccess(true);
      toast.success('Health data uploaded successfully!');
      onUploadSuccess();
      
      // Reset success state after 2 seconds
      setTimeout(() => setUploadSuccess(false), 2000);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file. Please check the format.');
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
      </CardContent>
    </Card>
  );
}
