'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, LayoutDashboard, Lock } from 'lucide-react';
import { getStoredSession, UserSession } from '@/lib/auth';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';

interface NavbarProps {
  onOpenIntake?: () => void;
  onOpenAuthModal?: () => void;
}

export function Navbar({ onOpenAuthModal }: NavbarProps) {
  const pathname = usePathname();
  const [session, setSession] = useState<UserSession | null>(null);

  useEffect(() => {
    setSession(getStoredSession());

    const handleAuthChange = () => {
      setSession(getStoredSession());
    };

    window.addEventListener('autonomops_auth_change', handleAuthChange);
    return () => window.removeEventListener('autonomops_auth_change', handleAuthChange);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#060911]/80 backdrop-blur-md font-sans">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Link href="/" className="flex items-center space-x-1.5 sm:space-x-2 focus:outline-none">
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded bg-blue-600 font-mono text-[11px] sm:text-xs font-bold text-white shadow-lg shadow-blue-500/20">
              SP
            </div>
            <span className="text-base sm:text-lg font-bold tracking-tight text-white">
              AutonomOps<span className="text-blue-500">.ai</span>
            </span>
          </Link>
          <span className="hidden rounded-full border border-slate-800 bg-slate-900/80 px-2.5 py-0.5 font-mono text-[10px] text-slate-400 lg:inline-block">
            Autonomous Front-Office Agent
          </span>
        </div>

        {/* Navigation Routes & Top-Right Profile Icon Dropdown */}
        <div className="flex items-center space-x-1.5 sm:space-x-3">
          <Link
            href={session?.role === 'client' ? '/chat' : pathname === '/dashboard' ? '/' : '/dashboard'}
            className="flex items-center space-x-1.5 sm:space-x-2 rounded-md border border-slate-800 bg-slate-900/60 px-2.5 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-medium text-slate-300 transition-colors hover:border-slate-700 hover:bg-slate-800 hover:text-white"
          >
            <LayoutDashboard className="h-3.5 w-3.5 text-blue-400 shrink-0" />
            <span className="hidden xs:inline sm:inline">
              {session?.role === 'client'
                ? 'Agent Chat'
                : pathname === '/dashboard'
                ? 'Customer agent'
                : 'Owner dashboard'}
            </span>
            <span className="xs:hidden sm:hidden">
              {session?.role === 'client' ? 'Chat' : pathname === '/dashboard' ? 'Agent' : 'Owner'}
            </span>
          </Link>

          {pathname !== '/chat' && (
            <Link
              href="/chat"
              className="flex items-center space-x-1.5 rounded-md bg-blue-600 px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-medium text-white shadow-md shadow-blue-600/30 transition-all hover:bg-blue-500 hover:shadow-blue-500/40 active:scale-[0.98]"
            >
              <span>Try agent</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}

          {/* Top Right Profile Icon Dropdown */}
          {session ? (
            <UserProfileDropdown session={session} onOpenAuthModal={onOpenAuthModal} />
          ) : (
            onOpenAuthModal && (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center space-x-1.5 rounded-full border border-slate-800 bg-slate-900/80 px-2.5 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-medium text-slate-300 transition-colors hover:border-slate-700 hover:bg-slate-800 hover:text-white cursor-pointer"
              >
                <Lock className="h-3.5 w-3.5 text-blue-400" />
                <span className="hidden sm:inline">Sign In / Roles</span>
                <span className="sm:hidden">Sign In</span>
              </button>
            )
          )}
        </div>
      </div>
    </header>
  );
}
