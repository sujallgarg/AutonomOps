'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Chat from '@/components/chat/UserChat';
import { Lead } from '@/types/agent';
import { getStoredSession } from '@/lib/auth';

export default function ChatPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    const session = getStoredSession();
    if (session?.role === 'owner') {
      router.replace('/dashboard');
    }
  }, [router]);

  const handleLeadCreated = (newLead: Lead) => {
    setLeads((prev) => [newLead, ...prev]);
  };

  const handleUpdateLeadStatus = (leadId: string, status: Lead['status']) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status } : l))
    );
  };

  return (
    <Chat
      onReturnHome={() => router.push('/')}
      leads={leads}
      onUpdateLeadStatus={handleUpdateLeadStatus}
      onLeadCreated={handleLeadCreated}
    />
  );
}
