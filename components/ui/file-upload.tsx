"use client";

import { useState, useCallback } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Upload, X, File } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  accept?: Record<string, string[]>;
  maxFiles?: number;
  maxSize?: number;
  className?: string;
  label?: string;
  required?: boolean;
  error?: string;
}

export function FileUpload({
  onFileSelect,
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
    'application/pdf': ['.pdf'],
  },
  maxFiles = 1,
  maxSize = 5 * 1024 * 1024, // 5MB default
  className,
  label,
  required,
  error,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState<string>('');

  // Detect mobile and adjust maxSize
  const isMobile = typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const effectiveMaxSize = isMobile ? Math.min(maxSize, 5 * 1024 * 1024) : maxSize;

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    setUploadError('');
    
    // Handle rejected files
    if (rejectedFiles && rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors && rejection.errors.length > 0) {
        const errorCode = rejection.errors[0].code;
        if (errorCode === 'file-too-large') {
          setUploadError(`El archivo es demasiado grande. Máximo ${Math.round(effectiveMaxSize / 1024 / 1024)}MB`);
        } else if (errorCode === 'file-invalid-type') {
          setUploadError('Tipo de archivo no permitido');
        } else {
          setUploadError('Error al seleccionar el archivo');
        }
      }
      return;
    }

    setFiles(acceptedFiles);
    onFileSelect(acceptedFiles);
  }, [onFileSelect, effectiveMaxSize]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles,
    maxSize: effectiveMaxSize,
  });

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFileSelect(newFiles);
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-4 sm:p-6 text-center cursor-pointer transition-colors touch-manipulation active:scale-95",
          isDragActive ? "border-green-400 bg-green-50" : "border-gray-300 hover:border-gray-400",
          error && "border-red-300 bg-red-50"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 mx-auto mb-2" />
        {isDragActive ? (
          <p className="text-green-600 text-sm sm:text-base font-medium">Suelta los archivos aquí...</p>
        ) : (
          <div>
            <p className="text-gray-600 mb-1 text-sm sm:text-base">
              <span className="block sm:inline">Toca para seleccionar archivos</span>
              <span className="hidden sm:inline"> o arrástralos aquí</span>
            </p>
            <p className="text-xs text-gray-500">
              Máximo {maxFiles} archivo{maxFiles > 1 ? 's' : ''}, hasta {Math.round(effectiveMaxSize / 1024 / 1024)}MB
            </p>
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <File className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm text-gray-700 block truncate">{file.name}</span>
                <span className="text-xs text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(1)}MB
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="text-red-500 hover:text-red-700 p-1 -m-1 touch-manipulation active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {(error || uploadError) && (
        <p className="text-red-600 text-sm mt-1">{error || uploadError}</p>
      )}
    </div>
  );
}