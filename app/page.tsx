'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { FeaturesGrid } from '@/components/FeaturesGrid';
import { IntakeFormModal } from '@/components/IntakeFormModal';
import { AuthModal } from '@/components/AuthModal';
import { Lead } from '@/types/agent';

export default function Home() {
  const router = useRouter();
  const [isIntakeOpen, setIsIntakeOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);

  const handleLeadCreated = (newLead: Lead) => {
    setLeads((prev) => [newLead, ...prev]);
  };

  const handleLoginSuccess = (role: 'owner' | 'client') => {
    if (role === 'owner') {
      router.push('/dashboard');
    } else {
      router.push('/chat');
    }
  };

  return (
    <main className="min-h-screen bg-[#060911] text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Navigation Bar */}
      <Navbar 
        onOpenIntake={() => setIsIntakeOpen(true)}
        onOpenAuthModal={() => setIsAuthOpen(true)}
      />

      {/* Hero Header Section */}
      <Hero onOpenIntake={() => setIsIntakeOpen(true)} />

      {/* 6 Core Operational Agent Features Grid */}
      <FeaturesGrid onOpenIntake={() => setIsIntakeOpen(true)} />

      {/* Interactive Form Intake Modal */}
      <IntakeFormModal
        isOpen={isIntakeOpen}
        onClose={() => setIsIntakeOpen(false)}
        onLeadCreated={handleLeadCreated}
      />

      {/* Auth / Login Modal for Owner and Client */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#060911] py-8 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <p>© 2026 AutonomOps.ai — Autonomous Front-Office Agent for Developer &amp; Tech Services</p>
          <div className="flex space-x-4 font-mono text-[11px] text-slate-400">
            <span>Autonomous Front-Office Agent Active</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
