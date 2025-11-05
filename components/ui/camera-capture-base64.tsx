"use client";

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, RotateCcw, Check, X, Upload } from 'lucide-react';
import { Button } from './button';
import { Card } from './card';

interface CameraCaptureProps {
  onCapture: (files: string[]) => void; // Now expects base64 strings
  maxPhotos?: number;
  label?: string;
  required?: boolean;
}

export function CameraCaptureBase64({ 
  onCapture, 
  maxPhotos = 3, 
  label = "Fotos",
  required = false 
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const base64 = canvas.toDataURL('image/jpeg', 0.8);
        
        const newPhotos = [...capturedPhotos, base64];
        setCapturedPhotos(newPhotos);
        onCapture(newPhotos);
        
        if (newPhotos.length >= maxPhotos) {
          stopCamera();
        }
      }
    }
  }, [capturedPhotos, maxPhotos, onCapture, stopCamera]);

  const removePhoto = useCallback((index: number) => {
    const newPhotos = capturedPhotos.filter((_, i) => i !== index);
    setCapturedPhotos(newPhotos);
    onCapture(newPhotos);
  }, [capturedPhotos, onCapture]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (capturedPhotos.length < maxPhotos) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result && typeof e.target.result === 'string') {
            const newPhotos = [...capturedPhotos, e.target.result];
            setCapturedPhotos(newPhotos);
            onCapture(newPhotos);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }, [capturedPhotos, maxPhotos, onCapture]);

  const switchCamera = useCallback(() => {
    stopCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, [stopCamera]);

  useEffect(() => {
    if (isStreaming) {
      startCamera();
    }
  }, [facingMode, isStreaming, startCamera]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <span className="text-xs text-gray-500">
          {capturedPhotos.length}/{maxPhotos} fotos
        </span>
      </div>

      {/* Camera View */}
      {isStreaming && (
        <Card className="relative overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-64 object-cover"
          />
          
          <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={switchCamera}
              className="bg-black/70 hover:bg-black/80 text-white"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            
            <Button
              type="button"
              onClick={capturePhoto}
              disabled={capturedPhotos.length >= maxPhotos}
              className="bg-green-600 hover:bg-green-700 text-white px-6"
            >
              <Camera className="w-5 h-5 mr-2" />
              Capturar
            </Button>
            
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={stopCamera}
              className="bg-black/70 hover:bg-black/80 text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* Control Buttons */}
      {!isStreaming && capturedPhotos.length < maxPhotos && (
        <div className="flex space-x-2">
          <Button
            type="button"
            onClick={startCamera}
            variant="outline"
            className="flex-1"
          >
            <Camera className="w-4 h-4 mr-2" />
            Abrir Cámara
          </Button>
          
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="flex-1"
          >
            <Upload className="w-4 h-4 mr-2" />
            Subir Archivos
          </Button>
        </div>
      )}

      {/* Captured Photos Grid */}
      {capturedPhotos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {capturedPhotos.map((photo, index) => (
            <div key={index} className="relative group">
              <img
                src={photo}
                alt={`Foto ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg border"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => removePhoto(index)}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
