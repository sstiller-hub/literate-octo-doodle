import { useState, useRef, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Camera, Upload, Trash2, Plus, ArrowRight, Calendar } from "lucide-react";
import { toast } from "sonner";
import { CameraCapture } from "@/app/components/camera-capture";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/app/components/ui/dialog";
import { functionsBaseUrl } from "@/app/utils/supabase/client";

interface ProgressPicture {
  id: string;
  date: string;
  notes: string;
  fileName: string;
  uploadedAt: string;
  url: string | null;
  view: 'front' | 'side' | 'back';
}

interface ProgressPicturesProps {
  onUploadSuccess?: () => void;
  authToken: string;
}

export function ProgressPictures({ onUploadSuccess, authToken }: ProgressPicturesProps) {
  const [pictures, setPictures] = useState<ProgressPicture[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'front' | 'side' | 'back'>('front');
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Dimension selector (matches view mode in Trends)
  const [dimension, setDimension] = useState<'front' | 'side' | 'back'>('front');
  
  // Time period selector (matches Trends)
  const [timePeriod, setTimePeriod] = useState<'30' | '90' | 'custom'>('30');
  
  // Custom date selection
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Load pictures on mount
  useEffect(() => {
    loadPictures();
  }, []);

  const loadPictures = async () => {
    try {
      const response = await fetch(
        `${functionsBaseUrl}/progress-pictures`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPictures(data.pictures || []);
      }
    } catch (error) {
      console.error('Error loading progress pictures:', error);
      toast.error('Failed to load progress pictures');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = (blob: Blob) => {
    // Convert blob to file
    const file = new File([blob], `progress-${Date.now()}.jpg`, { type: 'image/jpeg' });
    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a photo');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('date', selectedDate);
      formData.append('notes', notes);
      formData.append('view', selectedView);

      const response = await fetch(
        `${functionsBaseUrl}/progress-picture/upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`
          },
          body: formData
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      toast.success('Photo added');
      
      // Reset form
      setSelectedFile(null);
      setPreviewUrl(null);
      setNotes('');
      setShowUploadDialog(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Reload pictures
      await loadPictures();
      
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      console.error('Error uploading progress picture:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this photo?')) {
      return;
    }

    try {
      const response = await fetch(
        `${functionsBaseUrl}/progress-picture/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      toast.success('Photo deleted');
      await loadPictures();
    } catch (error) {
      console.error('Error deleting progress picture:', error);
      toast.error('Failed to delete photo');
    }
  };

  // Filter pictures by dimension
  const dimensionPictures = pictures.filter(p => p.view === dimension);
  
  // Get comparison based on time period
  const getComparison = () => {
    if (dimensionPictures.length < 2) return null;
    
    const sortedPics = [...dimensionPictures].sort((a, b) => a.date.localeCompare(b.date));
    
    let startPic: ProgressPicture | null = null;
    let endPic: ProgressPicture = sortedPics[sortedPics.length - 1];
    
    if (timePeriod === 'custom' && customStartDate && customEndDate) {
      // Find closest to custom dates
      startPic = sortedPics.find(p => p.date >= customStartDate) || sortedPics[0];
      const endCandidates = sortedPics.filter(p => p.date <= customEndDate);
      endPic = endCandidates[endCandidates.length - 1] || sortedPics[sortedPics.length - 1];
    } else {
      const daysAgo = timePeriod === '30' ? 30 : 90;
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - daysAgo);
      const targetDateStr = targetDate.toISOString().split('T')[0];
      
      // Find closest to target date
      startPic = sortedPics.find(p => p.date >= targetDateStr) || sortedPics[0];
    }
    
    if (!startPic || startPic.id === endPic.id) return null;
    
    return { start: startPic, end: endPic };
  };

  const comparison = getComparison();
  
  // Calculate days between comparison
  const getDaysDelta = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  // Generate insight based on comparison and readiness data
  const getInsight = () => {
    if (!comparison) return null;
    
    const days = getDaysDelta(comparison.start.date, comparison.end.date);
    
    // Simple observational insights
    if (days < 21) {
      return "Early phase; visual change typically follows consistent training.";
    } else if (days < 60) {
      return "Visual change aligns with improved weekly readiness.";
    } else {
      return "Long-term consistency visible across multiple training blocks.";
    }
  };

  return (
    <div className="space-y-4">
      {/* Camera Modal */}
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Add Photo</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Add a photo to track your progress.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            {/* Photo Input */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCamera(true)}
              >
                <Camera className="size-3 mr-1.5" />
                Take
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="size-3 mr-1.5" />
                Upload
              </Button>
            </div>

            {/* Preview */}
            {previewUrl && (
              <div className="relative w-full aspect-[3/4] bg-muted rounded-md overflow-hidden">
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Date */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="size-3" />
                Date
              </label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            {/* View Selection */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">View</label>
              <div className="flex gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant={selectedView === 'front' ? 'default' : 'outline'}
                  onClick={() => setSelectedView('front')}
                  className="flex-1 h-8 text-xs"
                >
                  Front
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={selectedView === 'side' ? 'default' : 'outline'}
                  onClick={() => setSelectedView('side')}
                  className="flex-1 h-8 text-xs"
                >
                  Side
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={selectedView === 'back' ? 'default' : 'outline'}
                  onClick={() => setSelectedView('back')}
                  className="flex-1 h-8 text-xs"
                >
                  Back
                </Button>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Notes (optional)</label>
              <Textarea
                placeholder="Weight, context..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="text-xs resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowUploadDialog(false)}
                className="flex-1 h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                size="sm"
                className="flex-1 h-8 text-xs"
              >
                {isUploading ? 'Uploading...' : 'Add'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Top Controls - Mirrors Trends page */}
      <div className="flex items-center justify-between">
        {/* Dimension Selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDimension('front')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              dimension === 'front'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Front
          </button>
          <button
            onClick={() => setDimension('side')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              dimension === 'side'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Side
          </button>
          <button
            onClick={() => setDimension('back')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              dimension === 'back'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Back
          </button>
        </div>

        {/* Secondary Action - Add Photo */}
        <button
          onClick={() => setShowUploadDialog(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="size-3" />
          <span>Photo</span>
        </button>
      </div>

      {/* Time Period Selector */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setTimePeriod('30')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            timePeriod === '30'
              ? 'bg-secondary text-secondary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          30 Days
        </button>
        <button
          onClick={() => setTimePeriod('90')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            timePeriod === '90'
              ? 'bg-secondary text-secondary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          90 Days
        </button>
        <button
          onClick={() => setTimePeriod('custom')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            timePeriod === 'custom'
              ? 'bg-secondary text-secondary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Custom
        </button>
      </div>

      {/* Custom Date Range */}
      {timePeriod === 'custom' && (
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={customStartDate}
            onChange={(e) => setCustomStartDate(e.target.value)}
            className="h-8 text-xs"
            placeholder="Start"
          />
          <ArrowRight className="size-3 text-muted-foreground" />
          <Input
            type="date"
            value={customEndDate}
            onChange={(e) => setCustomEndDate(e.target.value)}
            className="h-8 text-xs"
            placeholder="End"
          />
        </div>
      )}

      {/* Comparison View */}
      {comparison ? (
        <div className="space-y-3">
          {/* Time Delta */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatDate(comparison.start.date)}</span>
            <div className="flex items-center gap-1.5">
              <ArrowRight className="size-3" />
              <span>{getDaysDelta(comparison.start.date, comparison.end.date)} days</span>
            </div>
            <span>{formatDate(comparison.end.date)}</span>
          </div>

          {/* Side-by-side Comparison */}
          <div className="grid grid-cols-2 gap-3">
            {/* Start Photo */}
            <div className="relative">
              <div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden">
                {comparison.start.url ? (
                  <img 
                    src={comparison.start.url} 
                    alt="Before"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-xs text-muted-foreground">Loading...</p>
                  </div>
                )}
              </div>
              <div className="mt-1.5 text-center">
                <p className="text-[10px] text-muted-foreground">
                  {formatDate(comparison.start.date)}
                </p>
              </div>
            </div>

            {/* End Photo */}
            <div className="relative">
              <div className="aspect-[3/4] bg-muted rounded-lg overflow-hidden">
                {comparison.end.url ? (
                  <img 
                    src={comparison.end.url} 
                    alt="After"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-xs text-muted-foreground">Loading...</p>
                  </div>
                )}
              </div>
              <div className="mt-1.5 text-center">
                <p className="text-[10px] text-muted-foreground">
                  {formatDate(comparison.end.date)}
                </p>
              </div>
            </div>
          </div>

          {/* Insight */}
          {getInsight() && (
            <p className="text-xs text-muted-foreground text-center">
              {getInsight()}
            </p>
          )}
        </div>
      ) : (
        <div className="py-12 text-center">
          <Camera className="size-8 mx-auto mb-2 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">
            {dimensionPictures.length === 0 
              ? `No ${dimension} photos yet`
              : dimensionPictures.length === 1
              ? 'Add another photo to see comparison'
              : 'No photos in selected range'
            }
          </p>
        </div>
      )}

      {/* Timeline - All photos for this dimension */}
      {dimensionPictures.length > 0 && (
        <div className="mt-8 pt-6 border-t border-border">
          <h3 className="text-xs font-medium text-muted-foreground mb-3">Timeline</h3>
          <div className="grid grid-cols-4 gap-2">
            {[...dimensionPictures]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((picture) => (
                <div key={picture.id} className="relative group">
                  <div className="aspect-[3/4] bg-muted rounded-md overflow-hidden">
                    {picture.url ? (
                      <img 
                        src={picture.url} 
                        alt={formatDate(picture.date)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <p className="text-[10px] text-muted-foreground">...</p>
                      </div>
                    )}
                  </div>
                  <p className="text-[9px] text-muted-foreground text-center mt-1">
                    {formatDate(picture.date)}
                  </p>
                  
                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(picture.id)}
                    className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="size-2.5" />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
