'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Activity, ShieldCheck, Zap, Code, Wrench, Sparkles } from 'lucide-react';

interface HeroProps {
  onOpenIntake?: () => void;
  onOpenDashboard?: () => void;
}

export function Hero({ onOpenIntake, onOpenDashboard }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-grid pt-12 pb-20 md:pt-20 md:pb-28">
      {/* Background Radial Blur */}
      <div className="pointer-events-none absolute inset-0 bg-radial-glow opacity-70" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          {/* Left Hero Content */}
          <div className="lg:col-span-7">
            {/* Tagline Badge matching screenshot */}
            <div className="inline-flex items-center space-x-2 rounded border border-blue-500/20 bg-blue-950/40 px-3 py-1 font-mono text-xs text-blue-400 backdrop-blur-sm">
              <span className="text-slate-500">[ 001 ]</span>
              <span className="text-blue-500">•</span>
              <span className="tracking-widest uppercase text-slate-300">Autonomous Front-Office for Any Business</span>
            </div>

            {/* Headline matching screenshot */}
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.1]">
              The AI front-office agent that{' '}
              <span className="text-blue-500 text-glow-blue">books jobs &amp; projects</span>{' '}
              while you&apos;re focused on build.
            </h1>

            {/* Description updated for Software Engineering & Trades */}
            <p className="mt-6 text-base text-slate-400 sm:text-lg leading-relaxed max-w-2xl">
              AutonomOps converts inbound inquiries into paid, scheduled appointments—from <b>Software Engineering &amp; Staffing</b> to <b>Plumbing, HVAC, Electrical, and Professional Services</b>. It estimates scope from text and spec photos, collects deposits via Stripe, and never quotes outside your pricing matrix.
            </p>

            {/* Supported Sectors Tags */}
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-mono">
              <span className="rounded border border-blue-500/30 bg-blue-950/50 px-2.5 py-1 text-blue-400 flex items-center space-x-1">
                <Code className="h-3 w-3" />
                <span>Software Engineering</span>
              </span>
              {/* <span className="rounded border border-emerald-500/30 bg-emerald-950/50 px-2.5 py-1 text-emerald-400 flex items-center space-x-1">
                <Wrench className="h-3 w-3" />
                <span>Plumbing &amp; Mechanical</span>
              </span>
              <span className="rounded border border-purple-500/30 bg-purple-950/50 px-2.5 py-1 text-purple-400 flex items-center space-x-1">
                <Zap className="h-3 w-3" />
                <span>HVAC &amp; Electrical</span>
              </span> */}
            </div>

            {/* CTA Action Buttons with Next.js Link Routing */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/chat"
                className="flex items-center space-x-2 rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-500 hover:shadow-blue-500/50 active:scale-[0.98]"
              >
                <span>See it book a project</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/dashboard"
                className="flex items-center space-x-2 rounded-md border border-slate-700 bg-slate-900/60 px-6 py-3 text-sm font-medium text-slate-200 transition-colors hover:border-slate-500 hover:bg-slate-800 hover:text-white"
              >
                <span>Owner dashboard</span>
              </Link>
            </div>

            {/* Live Indicator Badges */}
            <div className="mt-10 flex flex-wrap items-center gap-6 border-t border-slate-800/80 pt-6 text-xs text-slate-400">
              <div className="flex items-center space-x-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
                <span className="font-mono text-slate-300">Gemini 3 Flash &amp; Pro</span>
              </div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="h-4 w-4 text-blue-400" />
                <span>Stripe Deposit Checkout</span>
              </div>
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>Google Calendar Sync</span>
              </div>
            </div>
          </div>

          {/* Right Card / Visual Section matching screenshot */}
          <div className="lg:col-span-5">
            <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-[#0b101c] p-2 shadow-2xl shadow-blue-950/30">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-slate-950">
                <img
                  src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80"
                  alt="Software Engineer Development Workstation"
                  className="h-full w-full object-cover opacity-80 filter brightness-90 contrast-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b101c] via-transparent to-transparent" />
                
                {/* Status Overlay Badge */}
                <div className="absolute bottom-4 left-4 right-4 rounded-md border border-slate-800/80 bg-[#060911]/90 p-3 backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-blue-400 animate-pulse" />
                      <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400">STATUS</span>
                    </div>
                    <span className="font-mono text-[10px] text-emerald-400">ONLINE</span>
                  </div>
                  <p className="mt-1 font-mono text-xs text-slate-200">
                    Discovery agent online • 4.7s median reply
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
