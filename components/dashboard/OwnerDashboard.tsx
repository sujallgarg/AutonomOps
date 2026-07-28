'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldAlert, 
  Calendar, 
  Clock,
  DollarSign, 
  ArrowLeft, 
  Search, 
  CheckCircle2, 
  Settings as SettingsIcon, 
  RefreshCw,
  Save,
  Check,
  Code,
  Terminal,
  Plus,
  Trash2,
  XCircle,
  ShieldCheck,
  UserCheck,
  LogOut,
  Sparkles,
  Lock,
  Unlock,
  Hourglass,
  Database,
  Shield,
  Key,
  Edit3,
  Filter,
  Tag,
  Briefcase,
  CreditCard,
  Loader2,
  Sliders,
  User,
  Crown,
  Mail
} from 'lucide-react';
import { Lead, StructuredExecutionLog, PricingMatrix } from '@/types/agent';
import { getLogs } from '@/lib/agent/logger';
import { getOrCreatePricingMatrix, updatePricingMatrix } from '@/lib/agent/pricingEngine';
import { getStoredSession, clearStoredSession, UserSession } from '@/lib/auth';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';

interface CustomServiceOffering {
  id: string;
  name: string;
  desc: string;
  baseFee: number;
  hourlyRate: number;
  ownerEmail?: string;
}

interface OwnerDashboardProps {
  onReturnHome: () => void;
  leads: Lead[];
  onUpdateLeadStatus: (leadId: string, status: Lead['status']) => void;
  onOpenAuthModal?: () => void;
}

import { DbUser, DbPayment, DbBusinessOwner } from '@/lib/db';

export function OwnerDashboard({ onReturnHome, leads: propLeads, onUpdateLeadStatus, onOpenAuthModal }: OwnerDashboardProps) {
  // Global Auth Session State
  const [session, setSession] = useState<UserSession | null>(null);

  const [selectedWorkCategory, setSelectedWorkCategory] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'leads' | 'review' | 'bookings' | 'add_service' | 'pricing' | 'logs' | 'payments'>('review');
  const [logs, setLogs] = useState<StructuredExecutionLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dynamic Pricing Matrix Config
  const [matrixConfig, setMatrixConfig] = useState<PricingMatrix>(getOrCreatePricingMatrix('Software & Tech Consulting'));
  const [isMatrixSaved, setIsMatrixSaved] = useState(false);

  // PostgreSQL Database State
  const [dbLeads, setDbLeads] = useState<Lead[]>([]);
  const [dbUsers, setDbUsers] = useState<DbUser[]>([]);
  const [dbOwners, setDbOwners] = useState<DbBusinessOwner[]>([]);
  const [dbPayments, setDbPayments] = useState<DbPayment[]>([]);
  const [customServices, setCustomServices] = useState<CustomServiceOffering[]>([]);
  const [notificationMsg, setNotificationMsg] = useState('');

  // Pro Subscription Gate State
  const [isSubscribingPro, setIsSubscribingPro] = useState(false);
  const [isProUnlocked, setIsProUnlocked] = useState(false);

  // Owner Custom Decided Timing State per lead ID
  const [ownerTimings, setOwnerTimings] = useState<Record<string, string>>({});

  // $1.00 BUSINESS OWNER APPROVAL PAYMENT MODAL STATE
  const [approvalModalLead, setApprovalModalLead] = useState<Lead | null>(null);
  const [ownerCardNumber, setOwnerCardNumber] = useState('4242 •••• •••• 4242');
  const [ownerCardExp, setOwnerCardExp] = useState('12/28');
  const [ownerCardCvc, setOwnerCardCvc] = useState('123');
  const [isProcessingApprovalFee, setIsProcessingApprovalFee] = useState(false);

  // New Custom Service Input Form State
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServiceBaseFee, setNewServiceBaseFee] = useState<number>(300);
  const [newServiceHourlyRate, setNewServiceHourlyRate] = useState<number>(140);

  // Load Auth session and listen for auth changes
  useEffect(() => {
    setSession(getStoredSession());

    const handleAuthChange = () => {
      setSession(getStoredSession());
    };

    window.addEventListener('autonomops_auth_change', handleAuthChange);
    return () => window.removeEventListener('autonomops_auth_change', handleAuthChange);
  }, []);

  // Load leads, services, users, and payments from PostgreSQL API on mount
  const loadDbData = async () => {
    try {
      const leadsRes = await fetch('/api/leads');
      const leadsData = await leadsRes.json();
      if (leadsData.success && Array.isArray(leadsData.leads)) {
        setDbLeads(leadsData.leads);
      }

      const ownersRes = await fetch('/api/owners');
      const ownersData = await ownersRes.json();
      if (ownersData.success && Array.isArray(ownersData.owners)) {
        setDbOwners(ownersData.owners);
      }

      const servicesRes = await fetch('/api/services');
      const servicesData = await servicesRes.json();
      if (servicesData.success && Array.isArray(servicesData.services)) {
        setCustomServices(servicesData.services);
      }

      const usersRes = await fetch('/api/users');
      const usersData = await usersRes.json();
      if (usersData.success && Array.isArray(usersData.users)) {
        setDbUsers(usersData.users);
      }

      const paymentsRes = await fetch('/api/payments');
      const paymentsData = await paymentsRes.json();
      if (paymentsData.success && Array.isArray(paymentsData.payments)) {
        setDbPayments(paymentsData.payments);
      }
    } catch (err) {
      console.error('Error fetching PostgreSQL data:', err);
    }
  };

  useEffect(() => {
    loadDbData();
    setLogs(getLogs());

    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('payment') === 'success') {
        setNotificationMsg('🎉 Stripe Gateway Payment Verified & Saved in PostgreSQL Database!');
        setTimeout(() => setNotificationMsg(''), 6000);
      }
    }
  }, []);

  // 15-Day Free Trial Check
  const isTrialExpired = React.useMemo(() => {
    if (isProUnlocked) return false;
    const ownerData = dbOwners.find(o => o.email.toLowerCase() === session?.email?.toLowerCase());
    if (ownerData?.is_premium) return false;
    if (!ownerData?.created_at) return false;

    const createdAt = new Date(ownerData.created_at).getTime();
    const fifteenDaysMs = 15 * 24 * 60 * 60 * 1000;
    return Date.now() - createdAt > fifteenDaysMs;
  }, [dbOwners, session, isProUnlocked]);

  // Handler for $5.00 Pro Owner Subscription
  const handlePayProSubscription = async () => {
    setIsSubscribingPro(true);
    setTimeout(async () => {
      setIsSubscribingPro(false);
      setIsProUnlocked(true);

      if (session?.email) {
        try {
          await fetch('/api/owners', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: session.name || 'Business Owner',
              email: session.email,
              is_premium: true
            })
          });

          await fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: session.name || 'Business Owner',
              email: session.email,
              role: 'owner',
              is_premium: true
            })
          });

          await fetch('/api/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_name: session.name || 'Business Owner',
              user_email: session.email,
              type: '$5.00 Pro Subscription',
              amount: 5.00,
              description: 'Upgraded 15-Day Trial to Pro Owner Subscription'
            })
          });
        } catch (err) {
          console.error('Subscription error:', err);
        }
      }

      setNotificationMsg('🎉 $5.00/mo Pro Subscription Activated! Dashboard Unlocked.');
      loadDbData();
      setTimeout(() => setNotificationMsg(''), 5000);
    }, 1200);
  };

  const refreshLogs = () => {
    setLogs(getLogs());
    loadDbData();
  };

  // Open $1.00 Payment Modal for Owner Approval
  const handleOpenApprovalModal = (lead: Lead) => {
    if (isTrialExpired) {
      alert('⚠️ Your 15-day free owner trial has expired! Please purchase the $5.00/month Pro Subscription to perform owner tasks.');
      return;
    }
    setApprovalModalLead(lead);
  };

  // Execute $1.00 Owner Payment & AUTOMATICALLY APPROVE WORK
  const handleConfirmPayAndApprove = () => {
    if (!approvalModalLead) return;

    setIsProcessingApprovalFee(true);
    const targetLead = approvalModalLead;

    setTimeout(async () => {
      setIsProcessingApprovalFee(false);
      const finalTiming = ownerTimings[targetLead.id] || targetLead.preferred_timeline || 'Tomorrow at 10:00 AM EST';

      setDbLeads((prev) =>
        prev.map((l) => (l.id === targetLead.id ? { ...l, status: 'owner_approved_awaiting_payment', preferred_timeline: finalTiming } : l))
      );
      onUpdateLeadStatus(targetLead.id, 'owner_approved_awaiting_payment');

      try {
        await fetch('/api/leads', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: targetLead.id,
            status: 'owner_approved_awaiting_payment',
            preferred_timeline: finalTiming
          })
        });
      } catch (err) {
        console.error('PostgreSQL status update error:', err);
      }

      if (session?.email) {
        fetch('/api/owners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: session.name || 'Business Owner',
            email: session.email,
            total_match_fees: 1.00,
            total_approved_orders: 1
          })
        }).catch(console.error);

        fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_name: session.name || 'Business Owner',
            user_email: session.email,
            type: '$1.00 Match Approval Fee',
            amount: 1.00,
            description: `Approved lead request for ${targetLead.full_name} (${targetLead.project_type})`
          })
        }).catch(console.error);
      }

      setApprovalModalLead(null);
      setNotificationMsg(`🎉 $1.00 Match Fee Processed! Work Request for ${targetLead.full_name} AUTOMATICALLY APPROVED & saved in PostgreSQL with Timing "${finalTiming}".`);
      setTimeout(() => setNotificationMsg(''), 6000);
    }, 1000);
  };

  // Handler for Owner Cancelling a Reservation in PostgreSQL
  const handleCancelReservation = async (leadId: string, customerName: string) => {
    setDbLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: 'declined_out_of_area' } : l))
    );
    onUpdateLeadStatus(leadId, 'declined_out_of_area');

    try {
      await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId, status: 'declined_out_of_area' })
      });
    } catch (err) {
      console.error('PostgreSQL cancel error:', err);
    }

    setNotificationMsg(`Reservation for ${customerName} CANCELLED & updated in PostgreSQL.`);
    setTimeout(() => setNotificationMsg(''), 5000);
  };

  // Save Pricing Matrix Engine
  const handleSaveMatrix = (e: React.FormEvent) => {
    e.preventDefault();
    updatePricingMatrix(matrixConfig);
    setIsMatrixSaved(true);
    setNotificationMsg('Pricing Matrix saved successfully! Rates updated across AI estimation engine.');
    setTimeout(() => {
      setIsMatrixSaved(false);
      setNotificationMsg('');
    }, 4000);
  };

  // Handler for Owner Adding Their Own Custom Service to PostgreSQL
  const handleAddCustomService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isTrialExpired) {
      alert('⚠️ Your 15-day free owner trial has expired! Please purchase the $5.00/month Pro Subscription to perform owner tasks.');
      return;
    }
    if (!newServiceName.trim()) return;

    const newOffering: CustomServiceOffering = {
      id: `cs_${Date.now()}`,
      name: newServiceName.trim(),
      desc: newServiceDesc.trim() || 'Owner-added custom software engineering service',
      baseFee: Number(newServiceBaseFee),
      hourlyRate: Number(newServiceHourlyRate),
      ownerEmail: session?.email || ''
    };

    setCustomServices((prev) => [newOffering, ...prev]);
    setNewServiceName('');
    setNewServiceDesc('');

    try {
      await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOffering)
      });
    } catch (err) {
      console.error('PostgreSQL add service error:', err);
    }

    setNotificationMsg(`New Service "${newOffering.name}" saved to PostgreSQL Database!`);
    setTimeout(() => setNotificationMsg(''), 4000);
  };

  const handleRemoveCustomService = async (id: string) => {
    setCustomServices((prev) => prev.filter((s) => s.id !== id));
    try {
      await fetch('/api/services', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
    } catch (err) {
      console.error('PostgreSQL delete service error:', err);
    }
  };

  // Combine DB leads and propLeads (empty by default for a fresh site)
  const rawLeads: Lead[] = dbLeads.length > 0 ? dbLeads : propLeads;

  // WORK CATEGORY FILTERING AGENT LOGIC
  const combinedLeads = rawLeads.filter((lead) => {
    if (selectedWorkCategory === 'ALL') return true;
    return (lead.project_type || '').toLowerCase().includes(selectedWorkCategory.toLowerCase());
  });

  // Stat computations
  const totalLeadsCount = combinedLeads.length;
  const pendingApprovalCount = combinedLeads.filter((l) => l.status === 'pending_owner_approval').length;
  const confirmedCount = combinedLeads.filter((l) => l.status === 'deposit_paid' || l.status === 'owner_approved_awaiting_payment').length;
  const totalDeposits = combinedLeads
    .filter((l) => l.status === 'deposit_paid')
    .reduce((acc, curr) => acc + (curr.pricing_breakdown?.deposit_amount || 0), 0);

  const filteredLogs = logs.filter((log) => {
    const q = searchQuery.toLowerCase();
    return (
      log.agent_id.toLowerCase().includes(q) ||
      log.customer_id.toLowerCase().includes(q) ||
      log.decision.toLowerCase().includes(q) ||
      log.action_taken.toLowerCase().includes(q)
    );
  });

  const WORK_CATEGORIES = [
    { id: 'ALL', label: 'All Work Categories' },
    { id: 'Full-Stack', label: '💻 Full-Stack Web & Mobile' },
    { id: 'Backend', label: '⚡ Backend & APIs' },
    { id: 'AI Agent', label: '🤖 AI Agent & LLMs' },
    { id: 'Code Audit', label: '🛡️ Security & Audits' },
    { id: 'DevOps', label: '🚀 DevOps & Cloud' }
  ];

  // ROLE-BASED ACCESS CONTROL GATE FOR CLIENT USERS
  if (!session || session.role !== 'owner') {
    return (
      <div className="min-h-screen bg-[#03060f] text-slate-100 flex flex-col items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full rounded-2xl border border-rose-900/40 bg-[#090d18] p-8 text-center space-y-6 shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <Lock className="h-7 w-7 text-rose-400" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Access Restricted — Owner Only</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              {session?.role === 'client' ? (
                <>You are currently logged in as <strong className="text-slate-200">{session.name} ({session.email})</strong>. Owner Dashboard and business data are NOT visible to client accounts.</>
              ) : (
                <>You must be signed in with a Business Owner account to view the Owner Dashboard.</>
              )}
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {onOpenAuthModal && (
              <button
                onClick={onOpenAuthModal}
                className="w-full rounded-xl bg-blue-600 py-3 text-xs font-bold text-white hover:bg-blue-500 transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-blue-600/20 font-mono"
              >
                <Key className="h-4 w-4" />
                <span>Sign In / Switch Role to Owner</span>
              </button>
            )}

            <button
              onClick={onReturnHome}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 py-3 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            >
              Back to Client Agent Chat
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans relative">
      {/* $1.00 BUSINESS OWNER APPROVAL PAYMENT MODAL OVERLAY */}
      {approvalModalLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 px-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-7 shadow-2xl space-y-6 text-slate-900 font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Pay $1.00 Fee &amp; Approve Work</h3>
                  <p className="text-xs text-slate-500">Business lead match fee required to automatically approve client work</p>
                </div>
              </div>
              <button onClick={() => setApprovalModalLead(null)} className="text-slate-400 hover:text-slate-700 text-sm font-bold">✕</button>
            </div>

            {/* Target Work Summary */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Client User:</span>
                <span className="font-bold text-slate-900 font-sans">{approvalModalLead.full_name} ({approvalModalLead.email})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Work Category:</span>
                <span className="font-bold text-slate-900">{approvalModalLead.project_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Decided Timing:</span>
                <span className="font-bold text-blue-700">{ownerTimings[approvalModalLead.id] || approvalModalLead.preferred_timeline || 'Tomorrow at 10:00 AM EST'}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-emerald-700 font-extrabold text-sm font-sans">
                <span>Business Match Fee Due:</span>
                <span>$1.00 USD</span>
              </div>
            </div>

            {/* Payment Details Form */}
            <div className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-[10px] uppercase text-slate-500 font-sans mb-1 font-bold">CARD NUMBER</label>
                <input
                  type="text"
                  value={ownerCardNumber}
                  onChange={(e) => setOwnerCardNumber(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-slate-500 font-sans mb-1 font-bold">EXPIRATION</label>
                  <input
                    type="text"
                    value={ownerCardExp}
                    onChange={(e) => setOwnerCardExp(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-slate-500 font-sans mb-1 font-bold">CVC</label>
                  <input
                    type="text"
                    value={ownerCardCvc}
                    onChange={(e) => setOwnerCardCvc(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setApprovalModalLead(null)}
                className="flex-1 rounded-xl border border-slate-300 bg-white py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPayAndApprove}
                disabled={isProcessingApprovalFee}
                className="flex-1 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white hover:bg-emerald-500 transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-emerald-600/20 font-mono disabled:opacity-50"
              >
                {isProcessingApprovalFee ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing $1.00 Payment...</span>
                  </>
                ) : (
                  <>
                    <Unlock className="h-4 w-4" />
                    <span>Pay $1.00 &amp; Auto-Approve</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Owner Header */}
      <header className="border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center space-x-6">
            <button
              onClick={onReturnHome}
              className="flex items-center space-x-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Home</span>
            </button>

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-bold text-slate-900">Owner Management Dashboard</h1>
                <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 uppercase flex items-center gap-1">
                  <Database className="h-3 w-3" /> POSTGRES CONNECTED
                </span>
                <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase">
                  $1.00 MATCH FEE GATEWAY ACTIVE
                </span>
              </div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
                AUTONOMOPS WORK FILTER &amp; RESERVATION ENGINE
              </p>
            </div>
          </div>

          {/* Owner Credentials Info & Top-Right Profile Dropdown */}
          <div className="flex items-center space-x-3 text-xs">
            <button
              onClick={onReturnHome}
              className="flex items-center space-x-1.5 rounded-md bg-blue-600 px-3.5 py-1.5 font-medium text-white shadow hover:bg-blue-500 transition-colors cursor-pointer"
            >
              <span>View Customer Agent</span>
            </button>

            {/* Profile Dropdown in Top Right Corner */}
            <UserProfileDropdown session={session} onOpenAuthModal={onOpenAuthModal} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 space-y-6">
        {/* BUSINESS OWNER ACCOUNT & PROVIDED EMAIL ADDRESS BANNER */}
        {session && session.role === 'owner' && (
          <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-4 shadow-sm text-xs font-mono flex flex-col sm:flex-row items-center justify-between gap-3 text-blue-900">
            <div className="flex items-center space-x-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 font-bold text-white shadow">
                <Crown className="h-5 w-5 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center space-x-2 font-bold text-slate-900 font-sans text-sm">
                  <span>{session.name}</span>
                  <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-mono uppercase font-bold">VERIFIED BUSINESS OWNER</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-600 text-xs font-mono mt-0.5">
                  <Mail className="h-3.5 w-3.5 text-blue-600" />
                  <span>Provided Business Owner Email: <strong className="text-blue-700 bg-blue-100 px-2 py-0.5 rounded border border-blue-300 font-mono">{session.email}</strong></span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-[11px] font-mono">
              <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> ACTIVE OWNER SESSION
              </span>
            </div>
          </div>
        )}

        {/* Notification Alert Banner */}
        {notificationMsg && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-mono text-emerald-900 flex items-center justify-between shadow-sm animate-fade-in">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <span className="font-semibold">{notificationMsg}</span>
            </div>
            <button onClick={() => setNotificationMsg('')} className="text-slate-400 hover:text-slate-600">✕</button>
          </div>
        )}

        {/* WORK CATEGORY FILTER BAR */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-700 font-bold font-mono">
            <Filter className="h-4 w-4 text-blue-600" />
            <span>AGENT WORK CATEGORY FILTER:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
            {WORK_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedWorkCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg border font-semibold transition-all cursor-pointer ${
                  selectedWorkCategory === cat.id
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-400 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stat KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center space-x-2 font-mono text-[10px] uppercase tracking-wider text-slate-400">
              <Users className="h-3.5 w-3.5" />
              <span>FILTERED CLIENT WORK</span>
            </div>
            <p className="mt-3 text-3xl font-extrabold text-slate-900">{totalLeadsCount}</p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center space-x-2 font-mono text-[10px] uppercase tracking-wider text-amber-600">
              <Hourglass className="h-3.5 w-3.5 text-amber-500 animate-spin" />
              <span>AWAITING WORK APPROVAL</span>
            </div>
            <p className="mt-3 text-3xl font-extrabold text-amber-600">{pendingApprovalCount}</p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center space-x-2 font-mono text-[10px] uppercase tracking-wider text-slate-400">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>APPROVED &amp; MATCHED</span>
            </div>
            <p className="mt-3 text-3xl font-extrabold text-emerald-600">{confirmedCount}</p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center space-x-2 font-mono text-[10px] uppercase tracking-wider text-slate-400">
              <DollarSign className="h-3.5 w-3.5 text-blue-600" />
              <span>NET DEPOSITS ($1 FEE DEDUCTED)</span>
            </div>
            <p className="mt-3 text-3xl font-extrabold text-slate-900">${totalDeposits.toFixed(2)}</p>
          </div>
        </div>

        {/* Tab Header Bar */}
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex border-b border-slate-200 bg-slate-50/50">
            <button
              onClick={() => setActiveTab('review')}
              className={`px-5 py-3 text-xs font-semibold ${
                activeTab === 'review'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Pending Work Approvals {pendingApprovalCount > 0 && `(${pendingApprovalCount})`}
            </button>
            <button
              onClick={() => setActiveTab('leads')}
              className={`px-5 py-3 text-xs font-semibold ${
                activeTab === 'leads'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Filtered Client Users ({combinedLeads.length})
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-5 py-3 text-xs font-semibold ${
                activeTab === 'bookings'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Manage &amp; Cancel Reservations
            </button>
            <button
              onClick={() => setActiveTab('add_service')}
              className={`px-5 py-3 text-xs font-semibold ${
                activeTab === 'add_service'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Owner Custom Services ({customServices.length})
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              className={`px-5 py-3 text-xs font-semibold ${
                activeTab === 'pricing'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Pricing Matrix Engine
            </button>
            <button
              onClick={() => {
                setActiveTab('logs');
                refreshLogs();
              }}
              className={`px-5 py-3 text-xs font-semibold ${
                activeTab === 'logs'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Execution Logs
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-5 py-3 text-xs font-semibold ${
                activeTab === 'payments'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              💳 Payment History ({dbPayments.length})
            </button>
          </div>

          {/* TAB 1: Pending Owner Approvals Queue with Owner Timing Decider & $1.00 Payment Modal Gate */}
          {activeTab === 'review' && (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Work Approval &amp; Match Queue ($1.00 Fee Required)</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Filter work requests, set timing slot, and approve. First pay $1.00 match fee to automatically approve client work.</p>
                </div>
                <button
                  onClick={refreshLogs}
                  className="flex items-center space-x-1 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Sync DB</span>
                </button>
              </div>

              {combinedLeads.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500 space-y-1">
                  <p className="font-semibold text-slate-700">No work requests found in category "{selectedWorkCategory}".</p>
                  <p>Client requests filtered by work type will appear here for work approval.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {combinedLeads.map((lead) => {
                    const currentOwnerTiming = ownerTimings[lead.id] !== undefined ? ownerTimings[lead.id] : (lead.preferred_timeline || 'Tomorrow at 10:00 AM EST');
                    const isApproved = lead.status === 'owner_approved_awaiting_payment' || lead.status === 'deposit_paid';
                    const isCancelled = lead.status === 'declined_out_of_area';

                    return (
                      <div
                        key={lead.id}
                        className={`rounded-xl border p-5 space-y-4 shadow-sm transition-all ${
                          isApproved
                            ? 'border-emerald-300 bg-emerald-50/50'
                            : isCancelled
                            ? 'border-rose-300 bg-rose-50/40 opacity-80'
                            : 'border-amber-300 bg-amber-50/60'
                        }`}
                      >
                        <div className="flex items-center justify-between border-b pb-3 border-slate-200">
                          <div className="flex items-center space-x-2">
                            {isApproved ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            ) : isCancelled ? (
                              <XCircle className="h-4 w-4 text-rose-600" />
                            ) : (
                              <Hourglass className="h-4 w-4 text-amber-600 animate-spin" />
                            )}
                            <span className="font-bold text-slate-900">{lead.full_name} ({lead.email})</span>
                          </div>

                          <span
                            className={`font-mono text-xs font-bold px-3 py-1 rounded flex items-center gap-1 ${
                              isApproved
                                ? 'bg-emerald-200 text-emerald-800'
                                : isCancelled
                                ? 'bg-rose-200 text-rose-800'
                                : 'bg-amber-200 text-amber-800'
                            }`}
                          >
                            <Database className="h-3 w-3" />
                            {isApproved
                              ? '✓ APPROVED BY OWNER ($1.00 MATCH FEE PAID)'
                              : isCancelled
                              ? '❌ CANCELLED BY OWNER'
                              : 'PENDING WORK APPROVAL'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono text-slate-700 bg-white/80 p-3 rounded-lg border border-slate-200">
                          <div><strong className="font-sans text-slate-900">Work Category:</strong> {lead.project_type}</div>
                          <div><strong className="font-sans text-slate-900">Requested Timing:</strong> {lead.preferred_timeline}</div>
                          <div><strong className="font-sans text-slate-900">Deposit Due:</strong> ${lead.pricing_breakdown?.deposit_amount || 75}</div>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-1 text-xs font-mono">
                          <span className="text-[10px] text-slate-500 uppercase font-sans font-semibold">User Project Expectations:</span>
                          <p className="text-slate-800 font-sans">{lead.scope || 'No specific scope provided.'}</p>
                        </div>

                        {/* OWNER TIMING DECISION INPUT CARD */}
                        <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-3.5 space-y-2 text-xs">
                          <div className="flex items-center space-x-2 text-blue-900 font-semibold font-mono">
                            <Clock className="h-4 w-4 text-blue-600" />
                            <span>SET OWNER DECIDED TIMING &amp; APPROVE WORK:</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              disabled={isApproved || isCancelled}
                              value={currentOwnerTiming}
                              onChange={(e) => setOwnerTimings({ ...ownerTimings, [lead.id]: e.target.value })}
                              placeholder="Owner timing (e.g. Tomorrow at 3:00 PM EST)..."
                              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-900 focus:border-blue-500 focus:outline-none disabled:opacity-60"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                          <span className="text-[11px] font-mono text-emerald-800 font-bold bg-emerald-100 px-2.5 py-1 rounded">
                            {isApproved ? '✓ $1.00 Business Match Fee Paid' : '$1.00 Business Match Fee Required'}
                          </span>

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleCancelReservation(lead.id, lead.full_name)}
                              disabled={isCancelled}
                              className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                                isCancelled
                                  ? 'bg-rose-100 text-rose-500 border border-rose-200 cursor-not-allowed font-bold'
                                  : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 cursor-pointer'
                              }`}
                            >
                              {isCancelled ? 'Cancelled' : 'Cancel Request'}
                            </button>

                            <button
                              onClick={() => handleOpenApprovalModal(lead)}
                              disabled={isApproved || isCancelled}
                              className={`rounded-lg px-5 py-2 text-xs font-bold text-white transition-all flex items-center space-x-1.5 shadow-lg ${
                                isApproved
                                  ? 'bg-emerald-600 cursor-not-allowed opacity-90 shadow-none'
                                  : isCancelled
                                  ? 'bg-slate-400 cursor-not-allowed opacity-50 shadow-none'
                                  : 'bg-emerald-600 hover:bg-emerald-500 cursor-pointer shadow-emerald-600/20'
                              }`}
                            >
                              {isApproved ? (
                                <>
                                  <Check className="h-4 w-4 text-white" />
                                  <span>Approved</span>
                                </>
                              ) : (
                                <>
                                  <CreditCard className="h-4 w-4" />
                                  <span>Pay $1.00 &amp; Auto-Approve</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Filtered Client Users Table */}
          {activeTab === 'leads' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Client User</th>
                    <th className="px-6 py-3">Work Category</th>
                    <th className="px-6 py-3">Project Expectations</th>
                    <th className="px-6 py-3">Decided Timing</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Owner Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {combinedLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{lead.full_name}</div>
                        <div className="text-[11px] text-slate-500">{lead.email} • {lead.phone}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-medium">{lead.project_type}</td>
                      <td className="px-6 py-4 text-slate-600 max-w-xs truncate">{lead.scope || 'No details specified'}</td>
                      <td className="px-6 py-4 font-mono text-slate-800 font-bold">{lead.preferred_timeline || 'Tomorrow 10:00 AM'}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block rounded px-2.5 py-0.5 font-mono text-[10px] font-bold ${
                            lead.status === 'declined_out_of_area'
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : lead.status === 'pending_owner_approval'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {lead.status === 'declined_out_of_area'
                            ? 'CANCELLED'
                            : lead.status === 'pending_owner_approval'
                            ? 'AWAITING APPROVAL'
                            : 'APPROVED & MATCHED'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenApprovalModal(lead)}
                          disabled={lead.status === 'deposit_paid'}
                          className={`inline-flex items-center space-x-1 rounded-md px-3 py-1.5 text-xs font-semibold text-white transition-all shadow-sm ${
                            lead.status === 'deposit_paid'
                              ? 'bg-slate-400 cursor-not-allowed opacity-60'
                              : 'bg-emerald-600 hover:bg-emerald-500 cursor-pointer'
                          }`}
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                          <span>
                            {lead.status === 'deposit_paid'
                              ? 'Approved & Paid'
                              : lead.status === 'owner_approved_awaiting_payment'
                              ? 'Awaiting Payment'
                              : 'Pay $1.00 & Approve'}
                          </span>
                        </button>

                        <button
                          onClick={() => handleCancelReservation(lead.id, lead.full_name)}
                          disabled={lead.status === 'declined_out_of_area'}
                          className={`inline-flex items-center space-x-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-all shadow-sm ${
                            lead.status === 'declined_out_of_area'
                              ? 'bg-rose-100 text-rose-400 border border-rose-200 cursor-not-allowed opacity-60'
                              : 'bg-rose-600 text-white hover:bg-rose-700 cursor-pointer'
                          }`}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          <span>{lead.status === 'declined_out_of_area' ? 'Cancelled' : 'Cancel'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: Manage & Cancel Reservations */}
          {activeTab === 'bookings' && (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Manage &amp; Cancel Active Client Reservations</h3>
                  <p className="text-xs text-slate-500 mt-0.5">As the business owner, you can cancel any reservation to free up developer calendar slots.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {combinedLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className={`rounded-xl border p-5 space-y-3 bg-white shadow-sm transition-all ${
                      lead.status === 'declined_out_of_area' ? 'border-rose-200 bg-rose-50/30 opacity-75' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{lead.full_name}</h4>
                        <p className="text-xs text-slate-500 font-mono">{lead.email} • {lead.phone}</p>
                      </div>
                      <span
                        className={`font-mono text-[10px] font-bold px-2.5 py-1 rounded ${
                          lead.status === 'declined_out_of_area'
                            ? 'bg-rose-100 text-rose-700 border border-rose-300'
                            : lead.status === 'pending_owner_approval'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                        }`}
                      >
                        {lead.status === 'declined_out_of_area'
                          ? 'CANCELLED'
                          : lead.status === 'pending_owner_approval'
                          ? 'PENDING OWNER APPROVAL'
                          : 'RESERVED & UNLOCKED'}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-700 font-mono">
                      <p><strong className="text-slate-900 font-sans">Module:</strong> {lead.project_type}</p>
                      <p><strong className="text-slate-900 font-sans">Owner Timing:</strong> {lead.preferred_timeline || 'Tomorrow at 10:00 AM EST'}</p>
                      <p><strong className="text-slate-900 font-sans">Deposit Paid:</strong> ${lead.pricing_breakdown?.deposit_amount || 75.00}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] font-mono text-slate-400">ID: {lead.id}</span>
                      <button
                        onClick={() => handleCancelReservation(lead.id, lead.full_name)}
                        disabled={lead.status === 'declined_out_of_area'}
                        className={`flex items-center space-x-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all shadow-sm ${
                          lead.status === 'declined_out_of_area'
                            ? 'bg-rose-100 text-rose-400 border border-rose-200 cursor-not-allowed opacity-60'
                            : 'bg-rose-600 text-white hover:bg-rose-700 cursor-pointer'
                        }`}
                      >
                        <XCircle className="h-4 w-4" />
                        <span>{lead.status === 'declined_out_of_area' ? 'Reservation Cancelled' : 'Cancel Reservation'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Owner Add Custom Services */}
          {activeTab === 'add_service' && (
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Add Owner Custom Services &amp; Offerings</h3>
                <p className="text-xs text-slate-500 mt-0.5">As the business owner, add your own custom software engineering services, base fees, and hourly rates into PostgreSQL.</p>
              </div>

              {/* Add Service Form */}
              <form onSubmit={handleAddCustomService} className="rounded-xl border border-blue-200 bg-blue-50/40 p-5 space-y-4">
                <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Database className="h-4 w-4 text-blue-600" /> Create New Service Offering (PostgreSQL)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Service Title*</label>
                    <input
                      type="text"
                      required
                      value={newServiceName}
                      onChange={(e) => setNewServiceName(e.target.value)}
                      placeholder="e.g. ⚡ Custom Smart Contract & Web3 Integration"
                      className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Short Description</label>
                    <input
                      type="text"
                      value={newServiceDesc}
                      onChange={(e) => setNewServiceDesc(e.target.value)}
                      placeholder="e.g. Solidity audit, DApp frontend & EVM backend"
                      className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Base Onboarding Fee ($)</label>
                    <input
                      type="number"
                      required
                      value={newServiceBaseFee}
                      onChange={(e) => setNewServiceBaseFee(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Hourly Labor Rate ($/hr)</label>
                    <input
                      type="number"
                      required
                      value={newServiceHourlyRate}
                      onChange={(e) => setNewServiceHourlyRate(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors flex items-center space-x-1.5 cursor-pointer shadow"
                >
                  <Plus className="h-4 w-4" />
                  <span>Save Service to PostgreSQL</span>
                </button>
              </form>

              {/* Owner Services List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider">Current Owner Offerings ({customServices.length})</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customServices.map((s) => (
                    <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 shadow-sm relative group">
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="font-bold text-xs text-slate-900">{s.name}</h5>
                          <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveCustomService(s.id)}
                          className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                          title="Remove Service"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between font-mono text-[11px]">
                        <span className="text-slate-600">Base Fee: <strong>${s.baseFee}</strong></span>
                        <span className="text-blue-600 font-bold">Rate: ${s.hourlyRate}/hr</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Dynamic Pricing Matrix Configuration */}
          {activeTab === 'pricing' && (
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Pricing Matrix &amp; Quote Calculation Configuration</h3>
                <p className="text-xs text-slate-500 mt-0.5">As the business owner, configure base fees, hourly rates, and complexity multipliers used by the AI Agent.</p>
              </div>

              <form onSubmit={handleSaveMatrix} className="rounded-xl border border-slate-200 bg-white p-6 space-y-5 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div>
                    <label className="block text-slate-700 font-sans font-semibold mb-1">Base Kickoff Fee ($)</label>
                    <input
                      type="number"
                      value={matrixConfig.base_fee}
                      onChange={(e) => setMatrixConfig({ ...matrixConfig, base_fee: Number(e.target.value) })}
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-sans font-semibold mb-1">Standard Hourly Labor Rate ($/hr)</label>
                    <input
                      type="number"
                      value={matrixConfig.hourly_rate}
                      onChange={(e) => setMatrixConfig({ ...matrixConfig, hourly_rate: Number(e.target.value) })}
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-sans font-semibold mb-1">Material Base Cost ($)</label>
                    <input
                      type="number"
                      value={matrixConfig.material_base_cost}
                      onChange={(e) => setMatrixConfig({ ...matrixConfig, material_base_cost: Number(e.target.value) })}
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-sans font-semibold mb-1">Deposit Required Percentage (%)</label>
                    <input
                      type="number"
                      value={matrixConfig.deposit_percentage}
                      onChange={(e) => setMatrixConfig({ ...matrixConfig, deposit_percentage: Number(e.target.value) })}
                      className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-mono">Category: Software &amp; Tech Consulting</span>
                  <button
                    type="submit"
                    className="rounded-lg bg-blue-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-blue-500 transition-colors shadow flex items-center space-x-1.5 cursor-pointer font-mono"
                  >
                    {isMatrixSaved ? <Check className="h-4 w-4 text-white" /> : <Save className="h-4 w-4" />}
                    <span>{isMatrixSaved ? 'Matrix Configuration Saved!' : 'Save Pricing Matrix Configuration'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 6: Execution Logs */}
          {activeTab === 'logs' && (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search logs by agent ID, customer, decision..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white pl-9 pr-4 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <button
                  onClick={refreshLogs}
                  className="flex items-center space-x-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Refresh Trace Logs</span>
                </button>
              </div>

              <div className="space-y-3">
                {filteredLogs.map((log, idx) => (
                  <div key={log.id || idx} className="rounded-lg border border-slate-800 bg-[#060911] p-4 text-white font-mono text-xs space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                      <div className="flex items-center space-x-2">
                        <span className="rounded bg-blue-900/60 text-blue-300 px-2 py-0.5 text-[10px] uppercase font-bold">
                          {log.agent_id}
                        </span>
                        <span className="text-slate-200 font-bold">{log.decision}</span>
                      </div>
                      <span>{log.timestamp}</span>
                    </div>

                    <p className="text-slate-300 font-sans text-xs">{log.action_taken}</p>

                    {Object.keys(log.pricing_breakdown).length > 0 && (
                      <div className="bg-slate-950 p-2.5 rounded border border-slate-900 text-[11px] text-emerald-400">
                        <pre>{JSON.stringify(log.pricing_breakdown, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: Payment History ($5 Subscription & $1 Approval Fees) */}
          {activeTab === 'payments' && (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Financial Payment History ($5.00 Pro Subscription &amp; $1.00 Approval Fees)</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Persisted in PostgreSQL database table <code>payments</code>.</p>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                  Total Payments Recorded: {dbPayments.length}
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3">Transaction ID</th>
                      <th className="px-6 py-3">Owner / Payer</th>
                      <th className="px-6 py-3">Payment Type</th>
                      <th className="px-6 py-3">Amount</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Description &amp; Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white font-mono">
                    {dbPayments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-6 text-center text-xs text-slate-500">
                          No payment transactions recorded in the database yet.
                        </td>
                      </tr>
                    ) : (
                      dbPayments.map((pmt) => (
                        <tr key={pmt.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-900">{pmt.id}</td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{pmt.user_name}</div>
                            <div className="text-[10px] text-slate-500">{pmt.user_email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                              pmt.type.includes('$5.00')
                                ? 'bg-purple-100 text-purple-800 border-purple-300'
                                : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            }`}>
                              {pmt.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-extrabold text-emerald-600 text-sm">
                            ${pmt.amount.toFixed(2)} USD
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              <span>{pmt.status}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-600 text-[11px]">
                            <div>{pmt.description || 'Payment transaction'}</div>
                            <div className="text-[10px] text-slate-400">{new Date(pmt.created_at).toLocaleString()}</div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* $1.00 STRIPE APPROVAL PAYMENT MODAL */}
      {approvalModalLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-md font-sans">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-[#090d18] p-6 shadow-2xl space-y-5 text-slate-100">
            <button
              onClick={() => setApprovalModalLead(null)}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <XCircle className="h-5 w-5" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center space-x-2 font-mono text-xs text-emerald-400">
                <CreditCard className="h-4 w-4 text-emerald-400" />
                <span className="tracking-widest uppercase font-semibold">STRIPE PAYMENT GATEWAY</span>
              </div>
              <h3 className="text-lg font-bold text-white">Approve Request &amp; Pay $1.00 Fee</h3>
              <p className="text-xs text-slate-400 font-mono">
                Approve lead request for <strong>{approvalModalLead.full_name}</strong> ({approvalModalLead.project_type}).
              </p>
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3.5 space-y-1 font-mono text-xs text-emerald-300">
              <div className="flex justify-between font-bold">
                <span>Match Approval Fee:</span>
                <span className="text-white">$1.00 USD</span>
              </div>
              <div className="text-[10px] text-slate-400">Saved to PostgreSQL database tables (leads, owners, payments)</div>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">CARD NUMBER</label>
                <input
                  type="text"
                  value={ownerCardNumber}
                  onChange={(e) => setOwnerCardNumber(e.target.value)}
                  className="w-full rounded border border-slate-800 bg-[#03060f] px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">EXPIRATION</label>
                  <input
                    type="text"
                    value={ownerCardExp}
                    onChange={(e) => setOwnerCardExp(e.target.value)}
                    className="w-full rounded border border-slate-800 bg-[#03060f] px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">CVC</label>
                  <input
                    type="text"
                    value={ownerCardCvc}
                    onChange={(e) => setOwnerCardCvc(e.target.value)}
                    className="w-full rounded border border-slate-800 bg-[#03060f] px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleConfirmPayAndApprove}
                disabled={isProcessingApprovalFee}
                className="w-full rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white hover:bg-emerald-500 transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-emerald-600/25 font-mono"
              >
                {isProcessingApprovalFee ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Processing $1.00 Stripe Fee...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Pay $1.00 USD &amp; Approve Work</span>
                  </>
                )}
              </button>

              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/stripe/checkout', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        type: 'match_fee',
                        amount: 1.00,
                        title: `Match Fee Approval for ${approvalModalLead.full_name}`,
                        email: session?.email || 'owner@autonomops.io',
                        name: session?.name || 'Business Owner',
                        leadId: approvalModalLead.id,
                        returnUrl: '/dashboard'
                      })
                    });
                    const data = await res.json();
                    if (data.url) {
                      window.location.href = data.url;
                    }
                  } catch (err) {
                    const targetUrl = `/checkout/stripe?type=match_fee&amount=1.00&title=${encodeURIComponent(`Match Fee Approval for ${approvalModalLead.full_name}`)}&email=${encodeURIComponent(session?.email || 'owner@autonomops.io')}&name=${encodeURIComponent(session?.name || 'Business Owner')}&leadId=${approvalModalLead.id}&returnUrl=/dashboard`;
                    window.location.href = targetUrl;
                  }
                }}
                className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3 text-xs font-bold text-white hover:from-indigo-500 hover:to-purple-500 transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-indigo-600/25 font-mono"
              >
                <CreditCard className="h-4 w-4" />
                <span>Redirect to Stripe Gateway Checkout ($1.00)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 15-DAY FREE TRIAL EXPIRED LOCKOUT MODAL */}
      {isTrialExpired && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 px-4 backdrop-blur-lg font-sans">
          <div className="relative w-full max-w-lg rounded-2xl border border-purple-500/40 bg-[#070b18] p-8 shadow-2xl space-y-6 text-slate-100 font-sans">
            <div className="space-y-2 text-center">
              <div className="inline-flex p-3 rounded-2xl bg-purple-950 border border-purple-800 text-purple-400 mb-2">
                <Lock className="h-8 w-8 text-purple-400" />
              </div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">15-Day Free Trial Expired</h2>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                Your 15-day free business owner trial has expired. To continue approving client work requests, adding custom services, and accessing the Owner Dashboard, please subscribe to <strong>AutonomOps Pro ($5.00 USD / month)</strong>.
              </p>
            </div>

            <div className="rounded-xl border border-purple-500/30 bg-purple-950/30 p-4 space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between font-bold text-white">
                <span>Pro Owner Plan Subscription:</span>
                <span className="text-purple-300 font-extrabold">$5.00 USD / mo</span>
              </div>
              <div className="text-[10px] text-slate-400 leading-relaxed font-sans">
                Includes unlimited client approvals, custom service cataloging, PostgreSQL database integration, and priority agent dispatch.
              </div>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">CARD NUMBER</label>
                <input
                  type="text"
                  defaultValue="4242 •••• •••• 4242"
                  className="w-full rounded-lg border border-slate-800 bg-[#03060f] px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">EXPIRATION</label>
                  <input
                    type="text"
                    defaultValue="12/28"
                    className="w-full rounded-lg border border-slate-800 bg-[#03060f] px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">CVC</label>
                  <input
                    type="text"
                    defaultValue="123"
                    className="w-full rounded-lg border border-slate-800 bg-[#03060f] px-3 py-2 text-xs text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handlePayProSubscription}
                disabled={isSubscribingPro}
                className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3.5 text-xs font-bold text-white hover:from-purple-500 hover:to-indigo-500 transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-purple-600/30 font-mono"
              >
                {isSubscribingPro ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Processing $5.00 Pro Subscription...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-amber-300" />
                    <span>Pay $5.00/mo &amp; Unlock Owner Dashboard</span>
                  </>
                )}
              </button>

              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/stripe/checkout', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        type: 'subscription',
                        amount: 5.00,
                        title: 'AutonomOps Pro Owner Subscription',
                        email: session?.email || 'owner@autonomops.io',
                        name: session?.name || 'Business Owner',
                        returnUrl: '/dashboard'
                      })
                    });
                    const data = await res.json();
                    if (data.url) {
                      window.location.href = data.url;
                    }
                  } catch (err) {
                    const targetUrl = `/checkout/stripe?type=subscription&amount=5.00&title=${encodeURIComponent('AutonomOps Pro Owner Subscription')}&email=${encodeURIComponent(session?.email || 'owner@autonomops.io')}&name=${encodeURIComponent(session?.name || 'Business Owner')}&returnUrl=/dashboard`;
                    window.location.href = targetUrl;
                  }
                }}
                className="w-full rounded-xl bg-slate-900 border border-slate-700 py-3 text-xs font-bold text-white hover:bg-slate-800 transition-all flex items-center justify-center space-x-2 cursor-pointer font-mono"
              >
                <CreditCard className="h-4 w-4 text-indigo-400" />
                <span>Redirect to Official Stripe Gateway Checkout Page ($5.00)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
