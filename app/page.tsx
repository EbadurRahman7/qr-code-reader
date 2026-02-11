"use client";

import jsQR from "jsqr";
import React, { useState, useRef, useEffect } from "react";
import { Camera, Upload, X, CheckCircle } from "lucide-react";
import Link from "next/link";

const Home = () => {
  const [result, setResult] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState("");
  const [hasCamera, setHasCamera] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);


  // Check if camera is available
  useEffect(() => {
    checkCameraAvailability();
    return () => {
      stopScanning();
    };
  }, []);

  const checkCameraAvailability = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput"
      );
      setHasCamera(videoDevices.length > 0);
    } catch (err) {
      setHasCamera(false);
    }
  };

  const startCamera = async () => {
    try {
      setError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);

        // Start scanning for QR codes
        scanIntervalRef.current = setInterval(scanQRCode, 500);
      }
    } catch (err) {
      setError("Unable to access camera. Please allow camera permissions.");
      setHasCamera(false);
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    setIsScanning(false);
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      if (code) {
        setResult(code.data);
        stopScanning();
      }
    } catch (err) {
      console.error("QR Scan Error:", err);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setError("");
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);

        try {
          const imageData = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
          );
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code) {
            setResult(code.data);
          } else {
            setError("No QR code detected in the uploaded image.");
          }
        } catch (err) {
          setError("Unable to process the uploaded image.");
        }
      };
      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  };

  const resetReader = () => {
    setResult("");
    setError("");
    stopScanning();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            QR Code Reader
          </h1>
          <p className="text-gray-600">Scan or upload QR codes instantly</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          {/* Result Display */}
          {result && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle
                  className="text-green-500 mt-1 flex-shrink-0"
                  size={20}
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-800 mb-1">
                    QR Code Detected!
                  </h3>
                  <Link target="_blank" href={result} className="text-green-700 break-all text-sm">{result}</Link>
                </div>
                <button
                  onClick={resetReader}
                  className="text-green-600 hover:text-green-800"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Camera Section */}
          {!result && (
            <div className="space-y-4">
              {/* Video Preview */}
              {isScanning && (
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-64 object-cover rounded-lg bg-gray-100"
                  />
                  <div className="absolute inset-0 border-2 border-dashed border-white rounded-lg pointer-events-none">
                    <div className="absolute top-4 left-4 w-6 h-6 border-l-4 border-t-4 border-white"></div>
                    <div className="absolute top-4 right-4 w-6 h-6 border-r-4 border-t-4 border-white"></div>
                    <div className="absolute bottom-4 left-4 w-6 h-6 border-l-4 border-b-4 border-white"></div>
                    <div className="absolute bottom-4 right-4 w-6 h-6 border-r-4 border-b-4 border-white"></div>
                  </div>
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                    Scanning...
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="space-y-3">
                {hasCamera && !isScanning && (
                  <button
                    onClick={startCamera}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <Camera size={20} />
                    Start Camera Scan
                  </button>
                )}

                {isScanning && (
                  <button
                    onClick={stopScanning}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                  >
                    Stop Scanning
                  </button>
                )}

                {/* File Upload */}
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors border-2 border-dashed border-gray-300"
                  >
                    <Upload size={20} />
                    Upload QR Code Image
                  </label>
                </div>
              </div>

              {/* Instructions */}
              <div className="text-center text-sm text-gray-500 mt-4">
                <p>Point your camera at a QR code or upload an image</p>
                {!hasCamera && (
                  <p className="text-red-500 mt-1">
                    Camera not available - use file upload
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default Home;
