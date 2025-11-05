"use client";

import { useState } from 'react';

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  isVisible: boolean;
  showIcon?: boolean;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'info',
    isVisible: false,
    showIcon: true,
  });

  const showToast = (message: string, type: ToastState['type'] = 'info', showIcon: boolean = true) => {
    setToast({ message, type, isVisible: true, showIcon });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  };

  return { toast, showToast, hideToast };
}
