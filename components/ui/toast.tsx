"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, Info, AlertCircle } from "lucide-react";

export interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  isVisible: boolean;
  onClose: () => void;
  showIcon?: boolean; // Nueva prop para controlar si mostrar icono
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertCircle,
};

const styles = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
};

export function Toast({ message, type, isVisible, onClose, showIcon = true }: ToastProps) {
  const Icon = icons[type];

  React.useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
      <div className={cn(
        "flex items-center gap-3 p-4 rounded-xl border shadow-lg max-w-sm",
        styles[type]
      )}>
        {showIcon && <Icon className="w-5 h-5 flex-shrink-0" />}
        <p className="text-sm font-medium">{message}</p>
        <button
          onClick={onClose}
          className="ml-auto p-1 rounded-lg hover:bg-black/5 transition-colors"
        >
          ×
        </button>
      </div>
    </div>
  );
}