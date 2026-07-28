'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Compass, 
  Zap, 
  CreditCard, 
  Calendar, 
  ShieldAlert, 
  FileCode, 
  ArrowRight 
} from 'lucide-react';

interface FeaturesGridProps {
  onOpenIntake?: () => void;
}

export function FeaturesGrid({ onOpenIntake }: FeaturesGridProps) {
  const features = [
    {
      num: '01',
      tag: 'INTAKE',
      title: 'Gemini 3 Flash discovery',
      description: 'Extracts project type, scope, ZIP, timeline, and photos in a single warm conversation. Politely declines out-of-area requests.',
      icon: Compass,
      colSpan: 'md:col-span-6'
    },
    {
      num: '02',
      tag: 'ESTIMATE',
      title: 'Gemini 3 Pro pricing',
      description: 'Multimodal analysis of job-site photos against your pricing matrix.',
      icon: Zap,
      colSpan: 'md:col-span-6'
    },
    {
      num: '03',
      tag: 'DEPOSIT',
      title: 'Stripe checkout',
      description: 'Custom deposit amount per estimate. Webhook-driven confirmation.',
      icon: CreditCard,
      colSpan: 'md:col-span-4'
    },
    {
      num: '04',
      tag: 'SCHEDULE',
      title: 'Auto-book slot',
      description: 'Next available business-hours slot reserved on successful payment.',
      icon: Calendar,
      colSpan: 'md:col-span-4'
    },
    {
      num: '05',
      tag: 'SAFETY',
      title: 'Human review flags',
      description: 'Structural, gas, or high-value jobs escalate to the owner queue.',
      icon: ShieldAlert,
      colSpan: 'md:col-span-4'
    },
    {
      num: '06',
      tag: 'AUDIT',
      title: 'Structured execution logs',
      description: 'Every agent decision — inputs, pricing math, confidence, action taken — persisted with ISO timestamps for review.',
      icon: FileCode,
      colSpan: 'md:col-span-12'
    }
  ];

  return (
    <section className="relative border-t border-slate-800/80 bg-[#060911] py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Features Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className={`${item.colSpan} group relative flex flex-col justify-between overflow-hidden rounded-lg border border-slate-800 bg-[#0b101c] p-6 transition-all hover:border-blue-500/40 hover:bg-[#0e1627]`}
              >
                <div>
                  {/* Monospace Badge matching screenshot */}
                  <div className="flex items-center space-x-2 font-mono text-[11px] text-blue-400">
                    <Icon className="h-3.5 w-3.5" />
                    <span>{item.num} • {item.tag}</span>
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA Banner matching screenshot 2 */}
        <div className="mt-20 overflow-hidden rounded-xl border border-slate-800 bg-gradient-to-r from-[#0b101c] via-[#0f172a] to-[#0b101c] p-8 sm:p-12">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <span className="font-mono text-xs tracking-widest uppercase text-blue-400">
                READY WHEN YOU ARE
              </span>
              <h2 className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">
                Try a live intake in under 60 seconds.
              </h2>
            </div>

            <Link
              href="/chat"
              className="flex items-center space-x-2 rounded-md bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg transition-all hover:bg-slate-200 active:scale-[0.98]"
            >
              <span>Start the conversation</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
