'use client';

// Simple toaster that bridges our lightweight toast hook/component
import { Toast } from '@/components/ui/toast';
import { useToast } from '@/hooks/useToastClient';

export function Toaster() {
  const { toast, hideToast } = useToast();

  return (
    <Toast
      message={toast.message}
      type={toast.type}
      isVisible={toast.isVisible}
      onClose={hideToast}
    />
  );
}
