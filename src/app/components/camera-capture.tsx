import { useState, useRef, useEffect } from "react";
import { Camera, X, Timer, Check, RotateCcw, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { toast } from "sonner";

interface CameraCaptureProps {
  onCapture: (imageBlob: Blob) => void;
  onClose: () => void;
}

export function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [timerDuration, setTimerDuration] = useState<5 | 10>(5);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const countdownIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Check if getUserMedia is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Camera is not supported on this device or browser.");
      setPermissionDenied(false);
      return;
    }
    
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    try {
      // Reset error states
      setPermissionDenied(false);
      setCameraError(null);

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      // Handle camera access errors gracefully
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        setPermissionDenied(true);
        setCameraError("Camera access was denied. Please enable camera permissions in your browser settings.");
      } else if (error instanceof DOMException && error.name === "NotFoundError") {
        setCameraError("No camera found on this device.");
      } else if (error instanceof DOMException && error.name === "NotReadableError") {
        setCameraError("Camera is already in use by another application.");
      } else {
        setCameraError("Could not access camera. Please try again.");
      }
    }
  };

  const retryCamera = () => {
    setPermissionDenied(false);
    setCameraError(null);
    startCamera();
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
  };

  const startCountdown = () => {
    setCountdown(timerDuration);
    
    countdownIntervalRef.current = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
          capturePhoto();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const imageUrl = URL.createObjectURL(blob);
        setCapturedImage(imageUrl);
        stopCamera();
      }
    }, 'image/jpeg', 0.95);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setCountdown(null);
    startCamera();
  };

  const confirmPhoto = () => {
    if (!canvasRef.current) return;

    canvasRef.current.toBlob((blob) => {
      if (blob) {
        onCapture(blob);
        onClose();
      }
    }, 'image/jpeg', 0.95);
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white hover:bg-white/20"
        >
          <X className="size-6" />
        </Button>

        {!capturedImage && (
          <div className="flex items-center gap-2">
            <Button
              variant={timerDuration === 5 ? "default" : "ghost"}
              size="sm"
              onClick={() => setTimerDuration(5)}
              className={timerDuration === 5 ? "" : "text-white hover:bg-white/20"}
            >
              <Timer className="size-4 mr-1" />
              5s
            </Button>
            <Button
              variant={timerDuration === 10 ? "default" : "ghost"}
              size="sm"
              onClick={() => setTimerDuration(10)}
              className={timerDuration === 10 ? "" : "text-white hover:bg-white/20"}
            >
              <Timer className="size-4 mr-1" />
              10s
            </Button>
          </div>
        )}

        {!capturedImage && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleCamera}
            className="text-white hover:bg-white/20"
          >
            <RotateCcw className="size-6" />
          </Button>
        )}
      </div>

      {/* Camera Preview / Captured Image */}
      <div className="flex-1 relative overflow-hidden">
        {cameraError || permissionDenied ? (
          <div className="w-full h-full flex items-center justify-center bg-black/90 p-6">
            <Card className="max-w-md">
              <CardContent className="pt-6 text-center space-y-4">
                <AlertCircle className="size-16 mx-auto text-destructive" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Camera Access Required</h3>
                  <p className="text-sm text-muted-foreground">
                    {cameraError || "Camera permission was denied"}
                  </p>
                </div>
                
                {permissionDenied && (
                  <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
                    <p className="text-xs font-semibold">How to enable camera:</p>
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                      <li><strong>iOS Safari:</strong> Settings → Safari → Camera → Allow</li>
                      <li><strong>Chrome:</strong> Tap the lock icon in URL bar → Camera → Allow</li>
                      <li><strong>Desktop:</strong> Click camera icon in address bar → Allow</li>
                    </ul>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <Button onClick={retryCamera} className="w-full">
                    <RefreshCw className="size-4 mr-2" />
                    Try Again
                  </Button>
                  <Button onClick={onClose} variant="outline" className="w-full">
                    Use File Upload Instead
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : !capturedImage ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {/* Countdown Overlay */}
            {countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-white text-9xl font-bold animate-pulse">
                  {countdown}
                </div>
              </div>
            )}

            {/* Center Guide Frame */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[80%] max-w-md aspect-[3/4] border-4 border-white/40 rounded-lg" />
            </div>
          </>
        ) : (
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full h-full object-contain"
          />
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Bottom Controls */}
      <div className="p-6 bg-black/50 backdrop-blur-sm">
        {!capturedImage && !cameraError && !permissionDenied ? (
          <div className="flex items-center justify-center">
            <Button
              size="lg"
              onClick={startCountdown}
              disabled={countdown !== null || !stream}
              className="rounded-full size-20 bg-white hover:bg-white/90 text-black"
            >
              <Camera className="size-8" />
            </Button>
          </div>
        ) : capturedImage ? (
          <div className="flex items-center justify-center gap-4">
            <Button
              size="lg"
              variant="outline"
              onClick={retakePhoto}
              className="rounded-full px-8"
            >
              <RotateCcw className="size-5 mr-2" />
              Retake
            </Button>
            <Button
              size="lg"
              onClick={confirmPhoto}
              className="rounded-full px-8 bg-green-600 hover:bg-green-700"
            >
              <Check className="size-5 mr-2" />
              Use Photo
            </Button>
          </div>
        ) : null}
      </div>

      {!capturedImage && !cameraError && !permissionDenied && (
        <div className="px-6 pb-4 text-center">
          <p className="text-white/70 text-sm">
            Position yourself in the frame. Timer: {timerDuration}s
          </p>
        </div>
      )}
    </div>
  );
}