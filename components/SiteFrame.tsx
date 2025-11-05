"use client";

import React from 'react';
import { usePathname } from 'next/navigation';

export function SiteFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNav = pathname !== '/';

  return (
    <>
      {showNav && (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200">
          <div className="container mx-auto px-4 py-3">
            <div className="flex justify-between items-center">
              <a href="/" className="text-xl font-bold text-gray-900">
                BookingApp
              </a>
              <a 
                href="/onboarding" 
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Onboarding
              </a>
            </div>
          </div>
        </nav>
      )}
      <div className={showNav ? 'pt-16' : undefined}>{children}</div>
    </>
  );
}
