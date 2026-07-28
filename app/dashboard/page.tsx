'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OwnerDashboard } from '@/components/dashboard/OwnerDashboard';
import { AuthModal } from '@/components/AuthModal';
import { Lead } from '@/types/agent';

export default function DashboardPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const handleUpdateLeadStatus = (leadId: string, status: Lead['status']) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status } : l))
    );
  };

  const handleLoginSuccess = (role: 'owner' | 'client') => {
    if (role === 'client') {
      router.push('/chat');
    }
  };

  return (
    <>
      <OwnerDashboard
        onReturnHome={() => router.push('/')}
        leads={leads}
        onUpdateLeadStatus={handleUpdateLeadStatus}
        onOpenAuthModal={() => setIsAuthOpen(true)}
      />
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
}
