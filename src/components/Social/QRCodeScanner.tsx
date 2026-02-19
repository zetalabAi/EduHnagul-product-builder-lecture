/**
 * QR Code Scanner Component
 * Scan friend QR codes using device camera
 */

"use client";

import { useEffect, useRef, useState } from "react";

interface QRCodeScannerProps {
  onScan: (data: string) => void;
  onError: (error: Error) => void;
}

export function QRCodeScanner({ onScan, onError }: QRCodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setHasPermission(true);
        startScanning();
      }
    } catch (error) {
      onError(new Error("카메라 권한이 필요합니다."));
      setHasPermission(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
  };

  const startScanning = () => {
    setIsScanning(true);

    // Scan every 500ms
    scanIntervalRef.current = setInterval(() => {
      scanFrame();
    }, 500);
  };

  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) return;

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    // Try to decode QR code
    // Note: In production, use a library like jsQR or qr-scanner
    // For now, this is a placeholder that detects QR patterns
    try {
      const qrData = detectQRCode(imageData);
      if (qrData) {
        if (scanIntervalRef.current) {
          clearInterval(scanIntervalRef.current);
        }
        setIsScanning(false);
        onScan(qrData);
      }
    } catch (error) {
      // Continue scanning
    }
  };

  // Simplified QR detection (replace with actual library in production)
  const detectQRCode = (imageData: ImageData): string | null => {
    // This is a placeholder
    // In production, use jsQR library:
    // import jsQR from "jsqr";
    // const code = jsQR(imageData.data, imageData.width, imageData.height);
    // return code ? code.data : null;

    // For now, return null to allow manual testing
    return null;
  };

  return (
    <div className="relative">
      <div className="bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-64 object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Scanning Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-48 h-48 border-4 border-blue-500 rounded-lg relative">
            {/* Corner markers */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-lg"></div>
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr-lg"></div>
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl-lg"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br-lg"></div>

            {/* Scanning line */}
            {isScanning && (
              <div className="absolute inset-x-0 h-1 bg-blue-400 animate-scan"></div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black to-transparent p-4">
          <p className="text-white text-center text-sm">
            {hasPermission
              ? "QR 코드를 프레임 안에 맞춰주세요"
              : "카메라 권한을 허용해주세요"}
          </p>
        </div>
      </div>

      {/* Manual Input Fallback */}
      <div className="mt-4">
        <p className="text-gray-400 text-xs text-center mb-2">
          또는 QR 코드 수동 입력
        </p>
        <input
          type="text"
          placeholder="eduhangul://add-friend/..."
          onChange={(e) => {
            if (e.target.value.startsWith("eduhangul://add-friend/")) {
              onScan(e.target.value);
            }
          }}
          className="w-full bg-white border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
        />
      </div>
    </div>
  );
}
