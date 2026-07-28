'use client';

import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, ShieldCheck, UserCheck, ChevronDown, ChevronRight, Sparkles, Crown, CheckCircle2, Zap, Shield, Mail } from 'lucide-react';
import { UserSession, clearStoredSession } from '@/lib/auth';

interface UserProfileDropdownProps {
  session: UserSession;
  onOpenAuthModal?: () => void;
}

export function UserProfileDropdown({ session, onOpenAuthModal }: UserProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (session?.email) {
      fetch('/api/owners')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.owners) {
            const owner = data.owners.find((o: any) => o.email?.toLowerCase() === session.email.toLowerCase());
            if (owner) {
              setIsSubscribed(Boolean(owner.is_premium));
            }
          }
        })
        .catch((err) => console.error('Error fetching owner subscription status:', err));
    }
  }, [session?.email]);

  const handleLogout = () => {
    clearStoredSession();
    setIsOpen(false);
  };

  const handleUpgradeSubscription = () => {
    const targetUrl = `/checkout/stripe?type=subscription&amount=5.00&title=${encodeURIComponent('AutonomOps Pro Owner Subscription')}&email=${encodeURIComponent(session.email)}&name=${encodeURIComponent(session.name)}&returnUrl=/dashboard`;
    window.location.href = targetUrl;
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const isOwner = session.role === 'owner';

  return (
    <div className="relative font-sans z-50" ref={dropdownRef}>
      {/* Top-Right Corner Profile Pill Button with Circular Avatar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center space-x-2 rounded-full p-1 pr-2.5 sm:pr-3 text-xs text-slate-100 bg-[#090d19]/90 border border-slate-800 hover:border-slate-700 transition-all duration-200 cursor-pointer shadow-lg backdrop-blur-xl hover:bg-slate-900/90 active:scale-98"
      >
        {/* Circular Avatar Badge */}
        <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-[#dbe1ea] text-black font-extrabold text-[11px] sm:text-xs tracking-tight shadow-md border-2 border-slate-900 group-hover:scale-105 transition-transform shrink-0">
          {getInitials(session.name)}
        </div>

        {/* User Name & Role Pill Subtext */}
        <div className="text-left hidden sm:block">
          <span className="font-bold text-white block leading-tight text-xs tracking-tight group-hover:text-amber-200 transition-colors">
            {session.name}
          </span>
          <div className="flex items-center space-x-1.5 mt-0.5">
            <span className={`inline-flex items-center space-x-1 text-[10px] font-mono leading-none capitalize font-bold ${
              isOwner ? 'text-amber-300' : 'text-blue-300'
            }`}>
              <span>{isOwner ? '👑 Owner' : '👤 Client'}</span>
            </span>
            {isOwner && (
              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 rounded-full font-bold">
                {isSubscribed ? '$5 Pro' : '15d Trial'}
              </span>
            )}
          </div>
        </div>

        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 group-hover:text-white transition-transform duration-300 ${isOpen ? 'rotate-180 text-amber-400' : ''}`} />
      </button>

      {/* Interactive Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-[88vw] max-w-[320px] sm:w-80 rounded-3xl border border-slate-800/90 bg-[#070a14] p-4 sm:p-5 shadow-2xl z-50 text-xs space-y-4 text-slate-200 backdrop-blur-2xl animate-in fade-in slide-in-from-top-2 font-sans">
          {/* Header User Card (Avatar + Name + Email + Role) */}
          <div className="flex items-center space-x-3 border-b border-slate-800/80 pb-4">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full font-extrabold text-black bg-[#dbe1ea] text-xs sm:text-sm shadow-md border-2 border-slate-900 shrink-0">
              {getInitials(session.name)}
            </div>

            <div className="overflow-hidden flex-1 space-y-0.5">
              <h4 className="font-extrabold text-white text-sm sm:text-base truncate tracking-tight">{session.name}</h4>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate font-sans flex items-center gap-1">
                <Mail className="h-3 w-3 text-blue-400 shrink-0" /> {session.email}
              </p>
              <div className="flex items-center space-x-1.5 pt-1">
                <span className={`font-mono text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  isOwner
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                }`}>
                  {isOwner ? '👑 Verified Business Owner' : '👤 Client User'}
                </span>
              </div>
            </div>
          </div>

          {/* ACTIVE PLAN & 15-DAY FREE TRIAL CARD — ONLY FOR BUSINESS OWNERS (HIDDEN FOR CLIENTS) */}
          {isOwner && (
            <>
              <div className="rounded-2xl border border-slate-800/90 bg-[#0b0f1d] p-3.5 sm:p-4 font-sans space-y-2 shadow-inner">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Active Plan:</span>
                  <span className="bg-[#161c2d] text-emerald-400 font-bold px-2.5 py-1 rounded-xl text-xs border border-emerald-500/30 shadow-sm flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                    {isSubscribed ? 'Pro Plan ($5/mo)' : '15-Day Free Trial'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed pt-1 font-sans">
                  {isSubscribed 
                    ? 'Pro Subscription Active — Unlimited AI Matchmaking & Operations' 
                    : '15 Days Free Trial Active. Upgrade anytime for $5/month to keep unlimited access.'}
                </p>
              </div>

              {!isSubscribed ? (
                <button
                  onClick={handleUpgradeSubscription}
                  className="w-full rounded-2xl bg-white hover:bg-slate-100 text-black font-extrabold text-xs sm:text-sm py-2.5 sm:py-3 px-4 shadow-xl transition-all duration-200 flex items-center justify-between cursor-pointer group active:scale-98"
                >
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-black shrink-0" />
                    <span>Explore More Plans ($5/mo)</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-700 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ) : (
                <div className="w-full rounded-2xl bg-emerald-950/40 border border-emerald-500/40 py-2.5 px-4 text-emerald-300 font-bold text-xs flex items-center justify-center space-x-2 font-mono">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Pro Plan ($5/mo) Active</span>
                </div>
              )}
            </>
          )}

          {/* Action List Divider & Buttons (Switch Role & Sign Out) */}
          <div className="border-t border-slate-800/80 pt-3 space-y-2">
            {onOpenAuthModal && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenAuthModal();
                }}
                className="w-full flex items-center space-x-2.5 rounded-xl px-2 py-1.5 text-xs text-slate-400 hover:text-white transition-colors text-left cursor-pointer font-medium"
              >
                <ShieldCheck className="h-4 w-4 text-blue-400" />
                <span>Switch Role / Portal</span>
              </button>
            )}

            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-2.5 rounded-xl px-2 py-1.5 text-xs text-rose-500 hover:text-rose-400 transition-colors text-left font-bold cursor-pointer"
            >
              <LogOut className="h-4 w-4 text-rose-500" />
              <span>Sign Out ({session.name})</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
