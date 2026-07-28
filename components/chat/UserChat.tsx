'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  Send, 
  Loader2,
  Calendar,
  Clock,
  MapPin,
  User,
  CreditCard,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Tag,
  DollarSign,
  Code,
  Terminal,
  Cpu,
  Globe,
  Github,
  Mail,
  Zap,
  ShieldAlert,
  Rocket,
  Lock,
  Hourglass,
  Crown,
  Database,
  LogOut,
  UserCheck,
  Key,
  MessageSquare,
  Award,
  FileText,
  Check,
  ChevronRight,
  Phone,
  AlertCircle
} from 'lucide-react';
import { Lead } from '@/types/agent';
import { calculateEstimate } from '@/lib/agent/pricingEngine';
import { getStoredSession, setStoredSession, clearStoredSession, UserSession, getRegisteredAccounts } from '@/lib/auth';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';

export interface ChatMessage {
  id: string;
  role: 'ai' | 'user' | 'owner';
  senderName?: string;
  text: string;
}

export interface UserChatProps {
  onReturnHome: () => void;
  leads?: Lead[];
  onUpdateLeadStatus?: (leadId: string, status: Lead['status']) => void;
  onLeadCreated?: (lead: Lead) => void;
}

export interface BookedAppointment {
  id: string;
  type: string;
  timing: string;
  name: string;
  email: string;
  phone: string;
  projectExpectations: string;
  zip: string;
  totalQuoteMin: number;
  totalQuoteMax: number;
  depositAmount: number;
  assignedOwnerName: string;
  assignedOwnerEmail: string;
  createdAt: string;
}

const COUNTRY_CODES = [
  { code: '+91', label: '🇮🇳 +91 (India)' },
  { code: '+1', label: '🇺🇸 +1 (US/Canada)' },
  { code: '+44', label: '🇬🇧 +44 (UK)' },
  { code: '+61', label: '🇦🇺 +61 (Australia)' },
  { code: '+49', label: '🇩🇪 +49 (Germany)' },
  { code: '+65', label: '🇸🇬 +65 (Singapore)' },
  { code: '+971', label: '🇦🇪 +971 (UAE)' },
  { code: '+33', label: '🇫🇷 +33 (France)' },
  { code: '+81', label: '🇯🇵 +81 (Japan)' }
];

export default function Chat({ onReturnHome, onLeadCreated }: UserChatProps) {
  // Global Authentication Session State
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);

  // Auth Gate Form Inputs
  const [authRole, setAuthRole] = useState<'client' | 'owner'>('client');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Steps: 1: SELECT_TYPE -> 2: SELECT_OWNER -> 3: SELECT_TIMING -> 4: ENTER_DETAILS -> 5: AWAITING_OWNER_CONFIRM -> 6: OWNER_APPROVED -> 7: CONFIRMED
  const [step, setStep] = useState<
    'SELECT_TYPE' | 'SELECT_OWNER' | 'SELECT_TIMING' | 'ENTER_DETAILS' | 'AWAITING_OWNER_CONFIRM' | 'OWNER_APPROVED' | 'CONFIRMED'
  >('SELECT_TYPE');

  // Developer Form & Booking Data
  const [appointmentType, setAppointmentType] = useState('');
  const [appointmentTiming, setAppointmentTiming] = useState('');
  const [customTimingInput, setCustomTimingInput] = useState('');
  const [fullName, setFullName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [mobilePhone, setMobilePhone] = useState('');
  const [projectExpectations, setProjectExpectations] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [formDetailsError, setFormDetailsError] = useState('');

  const [selectedOwner, setSelectedOwner] = useState<{
    id: string;
    name: string;
    role: string;
    email: string;
    specialty: string;
    rating: string;
  }>({
    id: 'owner_primary',
    name: 'Business Owner',
    role: 'Business Owner & Lead Software Architect',
    email: 'owner@autonomops.com',
    specialty: 'Full-Stack Web, Microservices & AI Agent Architecture',
    rating: '5.0 ★ Verified Owner'
  });

  // Stripe Mock Inputs
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExp, setCardExp] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('123');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [currentLeadId, setCurrentLeadId] = useState<string>('');

  // Confirmed Appointment in Corner & Work History Modal State
  const [bookedAppointment, setBookedAppointment] = useState<BookedAppointment | null>(null);
  const [showCornerModal, setShowCornerModal] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyLeads, setHistoryLeads] = useState<Lead[]>([]);

  const fetchHistoryLeads = async () => {
    try {
      const res = await fetch('/api/leads');
      const data = await res.json();
      if (data.success && Array.isArray(data.leads)) {
        setHistoryLeads(data.leads);
      }
    } catch (err) {
      console.error('Fetch history error:', err);
    }
  };

  // Initial Messages introducing Services Provided
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      role: 'ai',
      text: "Hello Developer! Welcome to AutonomOps DevStudio. Below are the software engineering services we provide. Select a service to get started with your appointment booking:"
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [dbOwnersList, setDbOwnersList] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/owners')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.owners) && data.owners.length > 0) {
          setDbOwnersList(data.owners);
        }
      })
      .catch(console.error);
  }, []);

  // Check login state on mount & listen to global auth changes & check for Stripe checkout redirect params
  useEffect(() => {
    const session = getStoredSession();
    setCurrentUser(session);
    if (session?.name) {
      setFullName(session.name);
    }
    if (session?.email) {
      setWorkEmail(session.email);
    }

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('payment') === 'success') {
        const tx = params.get('tx') || 'stripe_verified';
        setMessages((prev) => [
          ...prev,
          {
            id: `sys_${Date.now()}`,
            role: 'ai',
            text: `🎉 Official Stripe Gateway Payment Verified (Transaction ID: ${tx})! Your deposit has been saved to PostgreSQL database. Direct developer chat is active!`
          }
        ]);
        setStep('CONFIRMED');
      }
    }

    const handleAuthChange = () => {
      const updated = getStoredSession();
      setCurrentUser(updated);
      if (updated?.name) {
        setFullName(updated.name);
      }
      if (updated?.email) {
        setWorkEmail(updated.email);
      }
      if (updated?.role === 'owner') {
        window.location.href = '/dashboard';
      }
    };

    window.addEventListener('autonomops_auth_change', handleAuthChange);
    return () => window.removeEventListener('autonomops_auth_change', handleAuthChange);
  }, []);

  // Match Business Owners strictly based on client's chosen work domain
  const getMatchedOwnersForWork = (chosenWork: string) => {
    const workLower = (chosenWork || '').toLowerCase();
    
    let domainKeyword = 'web';
    let defaultRole = 'Lead Full-Stack Web & Mobile Architect';
    let defaultSpecialty = 'React, Next.js, Node.js & React Native App Specialist';

    if (workLower.includes('full-stack') || workLower.includes('web') || workLower.includes('mobile')) {
      domainKeyword = 'web';
      defaultRole = 'Lead Full-Stack Web & Mobile Architect';
      defaultSpecialty = 'React, Next.js, Node.js & React Native App Specialist';
    } else if (workLower.includes('backend') || workLower.includes('microservices') || workLower.includes('api')) {
      domainKeyword = 'api';
      defaultRole = 'Principal Backend & Microservices Architect';
      defaultSpecialty = 'REST/GraphQL APIs, PostgreSQL, Redis & Microservices Specialist';
    } else if (workLower.includes('ai') || workLower.includes('llm') || workLower.includes('agent')) {
      domainKeyword = 'ai';
      defaultRole = 'Lead AI Agent & LLM Systems Architect';
      defaultSpecialty = 'Autonomous AI Agents, Gemini & OpenAI APIs, RAG Specialist';
    } else if (workLower.includes('audit') || workLower.includes('security') || workLower.includes('performance')) {
      domainKeyword = 'security';
      defaultRole = 'Chief Code Auditor & Security Lead Engineer';
      defaultSpecialty = 'Codebase Refactoring, Security Scans & Query Optimization Specialist';
    } else if (workLower.includes('devops') || workLower.includes('cloud') || workLower.includes('ci/cd')) {
      domainKeyword = 'cloud';
      defaultRole = 'Lead Cloud Infrastructure & DevOps Engineer';
      defaultSpecialty = 'AWS, GCP, Docker, Kubernetes & Automated CI/CD Pipelines Specialist';
    }

    // Filter database owners matching the specific work domain
    if (dbOwnersList.length > 0) {
      const filtered = dbOwnersList.filter((o) => {
        const spec = (o.specialty || '').toLowerCase();
        if (domainKeyword === 'web') return spec.includes('web') || spec.includes('mobile') || spec.includes('full-stack') || spec.includes('react');
        if (domainKeyword === 'api') return spec.includes('api') || spec.includes('backend') || spec.includes('microservice') || spec.includes('postgres');
        if (domainKeyword === 'ai') return spec.includes('ai') || spec.includes('llm') || spec.includes('agent') || spec.includes('rag');
        if (domainKeyword === 'security') return spec.includes('audit') || spec.includes('security') || spec.includes('performance');
        if (domainKeyword === 'cloud') return spec.includes('cloud') || spec.includes('devops') || spec.includes('docker') || spec.includes('aws');
        return true;
      });

      const listToReturn = filtered.length > 0 ? filtered : dbOwnersList;

      return listToReturn.map((o) => ({
        id: o.id,
        name: o.name,
        role: defaultRole,
        email: o.email,
        specialty: o.specialty || defaultSpecialty,
        rating: '5.0 ★ Verified Work Specialist'
      }));
    }

    const registeredOwner = typeof window !== 'undefined'
      ? getRegisteredAccounts().find((a) => a.role === 'owner')
      : null;

    const ownerName = currentUser?.role === 'owner'
      ? currentUser.name
      : registeredOwner
      ? registeredOwner.name
      : 'Business Owner';

    const ownerEmail = currentUser?.role === 'owner'
      ? currentUser.email
      : registeredOwner
      ? registeredOwner.email
      : 'owner@autonomops.io';

    return [
      {
        id: `owner_${domainKeyword}`,
        name: ownerName,
        role: defaultRole,
        email: ownerEmail,
        specialty: defaultSpecialty,
        rating: '5.0 ★ Verified Work Specialist'
      }
    ];
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, step, isTyping]);

  // AUTOMATIC POSTGRES DB POLLING FOR OWNER APPROVAL STATUS
  useEffect(() => {
    if (step !== 'AWAITING_OWNER_CONFIRM') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/leads');
        const data = await res.json();
        if (data.success && Array.isArray(data.leads)) {
          const myLead = data.leads.find(
            (l: Lead) => l.full_name === fullName || l.email === workEmail
          );

          if (myLead && (myLead.status === 'owner_approved_awaiting_payment' || myLead.status === 'deposit_paid')) {
            if (myLead.preferred_timeline) {
              setAppointmentTiming(myLead.preferred_timeline);
            }
            setStep(myLead.status === 'deposit_paid' ? 'CONFIRMED' : 'OWNER_APPROVED');
            setMessages((prev) => [
              ...prev,
              {
                id: `a_${Date.now()}`,
                role: 'owner',
                senderName: selectedOwner.name,
                text: `🎉 Hello ${fullName}! I (${selectedOwner.name}) have reviewed and APPROVED your reservation request for timing "${myLead.preferred_timeline || appointmentTiming}". Your Stripe payment gateway is unlocked below. Let's chat about your project build!`
              }
            ]);
          }
        }
      } catch (err) {
        console.error('Error polling lead status:', err);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [step, fullName, workEmail, selectedOwner.name, appointmentTiming]);

  // Software Engineering Pricing Engine Calculation
  const pricingAssessment = calculateEstimate(
    `${appointmentType} expectations: ${projectExpectations} zip ${zipCode}`,
    appointmentType || 'Software Engineering Consulting',
    'software_engineering'
  );

  // Services Provided Options
  const SERVICES_PROVIDED = [
    { 
      id: 's1',
      title: '💻 Full-Stack Web & Mobile App Development', 
      desc: 'End-to-end React, Next.js, Node.js & React Native app engineering',
      icon: Code 
    },
    { 
      id: 's2',
      title: '⚡ Backend Microservices & API Architecture', 
      desc: 'High-performance REST/GraphQL APIs, Postgres, Redis & Docker setup',
      icon: Zap 
    },
    { 
      id: 's3',
      title: '🤖 AI Agent & LLM Integration', 
      desc: 'OpenAI, Google Gemini API, RAG workflows & custom AI chatbots',
      icon: Cpu 
    },
    { 
      id: 's4',
      title: '🛡️ Code Audit, Security & Performance Fix', 
      desc: 'Full codebase refactoring, vulnerability scan & query optimization',
      icon: ShieldAlert 
    },
    { 
      id: 's5',
      title: '🚀 DevOps, Cloud Infrastructure & CI/CD', 
      desc: 'Automated deployment pipelines for AWS, GCP, Vercel & Docker',
      icon: Rocket 
    }
  ];

  // Dynamically configured Business Owner (or active Owner session)
  const AVAILABLE_OWNERS = [
    {
      id: 'owner_primary',
      name: currentUser?.role === 'owner' ? currentUser.name : 'Business Owner',
      role: 'Business Owner & Lead Software Architect',
      email: currentUser?.role === 'owner' ? currentUser.email : 'owner@autonomops.com',
      specialty: 'Full-Stack Web, Microservices & AI Agent Architecture',
      rating: '5.0 ★ Verified Owner'
    }
  ];

  // Preset Timing Slots
  const TIMING_SLOTS = [
    'Today at 2:00 PM EST',
    'Tomorrow at 10:00 AM EST',
    'Tomorrow at 3:30 PM EST',
    'Friday at 11:00 AM EST'
  ];

  // Login Handler
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const trimmedName = authName.trim() || (authRole === 'owner' ? 'Sujal Garg' : 'Alex Rivera');
    const trimmedEmail = authEmail.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setAuthError('Full Name must be at least 2 characters.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setAuthError('Please enter a valid email address (e.g. name@domain.com)');
      return;
    }

    if (!authPassword || authPassword.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }

    const userObj: UserSession = { name: trimmedName, email: trimmedEmail, role: authRole };
    setStoredSession(userObj);
    setWorkEmail(trimmedEmail);
    setFullName(trimmedName);
  };

  // Handler for selecting service type
  const handleSelectType = (type: string) => {
    if (!currentUser) return;
    setAppointmentType(type);

    const matchedOwners = getMatchedOwnersForWork(type);
    if (matchedOwners && matchedOwners.length > 0) {
      setSelectedOwner(matchedOwners[0]);
    }

    setMessages((prev) => [
      ...prev,
      { id: `u_${Date.now()}`, role: 'user', senderName: fullName, text: type },
      { id: `a_${Date.now()}`, role: 'ai', text: `Great choice! Based on your selected work (${type}), here is the assigned Business Owner & Lead Specialist for your project:` }
    ]);
    setStep('SELECT_OWNER');
  };

  // Handler for selecting Business Owner
  const handleSelectOwner = (owner: typeof AVAILABLE_OWNERS[0]) => {
    setSelectedOwner(owner);
    setMessages((prev) => [
      ...prev,
      { id: `u_${Date.now()}`, role: 'user', senderName: fullName, text: `Selected Owner: ${owner.name} (${owner.role})` },
      { id: `a_${Date.now()}`, role: 'ai', text: `Selected Owner & Lead Engineer: "${owner.name}". Next, choose your preferred timing slot or type your custom date & time:` }
    ]);
    setStep('SELECT_TIMING');
  };

  // Handler for selecting or typing timing
  const handleSelectTiming = (timing: string) => {
    if (!currentUser) return;
    setAppointmentTiming(timing);
    setMessages((prev) => [
      ...prev,
      { id: `u_${Date.now()}`, role: 'user', senderName: fullName, text: timing },
      { id: `a_${Date.now()}`, role: 'ai', text: `Selected timing: "${timing}". Next, please fill out what you expect to build from our business to submit your reservation to ${selectedOwner.name} for approval.` }
    ]);
    setStep('ENTER_DETAILS');
  };

  const handleCustomTimingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTimingInput.trim() || !currentUser) return;
    handleSelectTiming(customTimingInput.trim());
  };

  const handlePhoneInputChange = (val: string) => {
    // Strictly block letters, symbols, spaces, and limit to max 10 digits
    const cleanDigits = val.replace(/\D/g, '').slice(0, 10);
    setMobilePhone(cleanDigits);
  };

  const handleAutofillSampleProject = () => {
    setFullName('Alex Rivera');
    setWorkEmail('alex@techstart.io');
    setCountryCode('+1');
    setMobilePhone('5550192834');
    setZipCode('94103');
    setProjectExpectations('We expect a full-stack Next.js web application with PostgreSQL database, automated AI agent workflows, and Stripe payment gateway integration.');
    setFormDetailsError('');
  };

  const handleAutofillEnterpriseSpecs = () => {
    setFullName('Elena Rostova');
    setWorkEmail('elena@enterpriseai.io');
    setCountryCode('+91');
    setMobilePhone('9876543210');
    setZipCode('REMOTE');
    setProjectExpectations('We expect a high-scale microservices architecture with LLM RAG pipelines, OpenAI and Gemini API endpoints, Docker containers, and CI/CD pipelines.');
    setFormDetailsError('');
  };

  // Handler for submitting details & saving reservation to PostgreSQL Database
  const handleSubmitDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormDetailsError('');

    if (!fullName.trim() || fullName.trim().length < 2) {
      setFormDetailsError('Full Name must be at least 2 characters.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!workEmail.trim() || !emailRegex.test(workEmail.trim())) {
      setFormDetailsError('Please enter a valid work email address (e.g. alex@techstart.io).');
      return;
    }

    const digitsOnly = mobilePhone.trim().replace(/\D/g, '');
    if (!mobilePhone.trim() || digitsOnly.length !== 10) {
      setFormDetailsError('Please enter a valid 10-digit mobile phone number (alphabets are not allowed, exactly 10 digits required).');
      return;
    }

    if (!zipCode.trim() || zipCode.trim().length < 3) {
      setFormDetailsError('Please enter a valid Zip Code or Region (e.g. 94103 or REMOTE).');
      return;
    }

    if (!projectExpectations.trim() || projectExpectations.trim().length < 10) {
      setFormDetailsError('Project expectations must be at least 10 characters describing what you expect us to build.');
      return;
    }

    const fullPhoneFormatted = `${countryCode} ${digitsOnly}`;

    const generatedLeadId = `dev_apt_${Date.now()}`;
    setCurrentLeadId(generatedLeadId);

    const leadData: Lead = {
      id: generatedLeadId,
      customer_id: `dev_${fullName.replace(/\s+/g, '_')}`,
      full_name: fullName,
      email: workEmail,
      phone: fullPhoneFormatted,
      zip_code: zipCode,
      industry_category: 'Software & Tech Consulting',
      project_type: appointmentType,
      preferred_timeline: appointmentTiming,
      scope: projectExpectations.trim(),
      dispatch_path: 'REQUIRES_HUMAN_REVIEW',
      status: 'pending_owner_approval',
      safety_flags: [],
      pricing_breakdown: pricingAssessment.pricingBreakdown,
      assigned_owner_name: selectedOwner.name,
      assigned_owner_email: selectedOwner.email,
      created_at: new Date().toISOString()
    };

    setMessages((prev) => [
      ...prev,
      {
        id: `u_${Date.now()}`,
        role: 'user',
        senderName: fullName,
        text: `Name: ${fullName} (${workEmail}) | Expectations: ${projectExpectations} | Zip: ${zipCode}`
      },
      {
        id: `a_${Date.now()}`,
        role: 'ai',
        text: `Thank you ${fullName}! Your reservation request has been submitted to Business Owner ${selectedOwner.name} (${selectedOwner.email}) and saved to PostgreSQL. Once ${selectedOwner.name} approves your request from the Owner Dashboard, your Stripe Payment Gateway will unlock below and direct messaging will activate!`
      }
    ]);
    setStep('AWAITING_OWNER_CONFIRM');

    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData)
      });
    } catch (err) {
      console.error('Error persisting lead to PostgreSQL:', err);
    }

    if (onLeadCreated) {
      onLeadCreated(leadData);
    }
  };

  // Handler for Stripe Payment Execution & Saving Confirmed Booking to PostgreSQL
  const handlePayAndBook = async () => {
    setIsProcessingPayment(true);

    const depositAmt = pricingAssessment.pricingBreakdown.deposit_amount || 75;

    // 1. Record lead state
    const appointment: BookedAppointment = {
      id: `dev_apt_${Date.now()}`,
      type: appointmentType,
      timing: appointmentTiming,
      name: fullName,
      email: workEmail,
      phone: mobilePhone,
      projectExpectations: projectExpectations,
      zip: zipCode,
      totalQuoteMin: pricingAssessment.pricingBreakdown.min_quote,
      totalQuoteMax: pricingAssessment.pricingBreakdown.max_quote,
      depositAmount: depositAmt,
      assignedOwnerName: selectedOwner.name,
      assignedOwnerEmail: selectedOwner.email,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const leadData: Lead = {
      id: appointment.id,
      customer_id: `dev_${fullName.replace(/\s+/g, '_')}`,
      full_name: fullName,
      email: workEmail,
      phone: mobilePhone,
      zip_code: zipCode,
      industry_category: 'Software & Tech Consulting',
      project_type: appointmentType,
      preferred_timeline: appointmentTiming,
      scope: projectExpectations,
      dispatch_path: 'AUTO',
      status: 'deposit_paid',
      pricing_breakdown: pricingAssessment.pricingBreakdown,
      safety_flags: [],
      assigned_owner_name: selectedOwner.name,
      assigned_owner_email: selectedOwner.email,
      created_at: new Date().toISOString()
    };

    setBookedAppointment(appointment);

    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData)
      });
    } catch (err) {
      console.error('Error saving lead to PostgreSQL:', err);
    }

    if (onLeadCreated) {
      onLeadCreated(leadData);
    }

    // 2. Redirect directly to Stripe Gateway
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'deposit',
          amount: depositAmt,
          title: `Project Kickoff Deposit - ${appointmentType}`,
          email: workEmail,
          name: fullName,
          leadId: appointment.id,
          returnUrl: '/chat'
        })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
    } catch (err) {
      console.error('Stripe redirect error:', err);
    }

    // Fallback URL redirect if API call completes
    const fallbackTarget = `/checkout/stripe?type=deposit&amount=${depositAmt}&title=${encodeURIComponent(`Project Kickoff Deposit - ${appointmentType}`)}&email=${encodeURIComponent(workEmail)}&name=${encodeURIComponent(fullName)}&leadId=${appointment.id}&returnUrl=/chat`;
    window.location.href = fallbackTarget;
  };

  // Interactive Messaging (Direct Messaging after approval & AI assistant during intake)
  const handleSendInput = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping || !currentUser) return;

    const userText = input.trim();
    setInput('');

    if (step === 'SELECT_TIMING') {
      handleSelectTiming(userText);
      return;
    }

    // Determine sender identity (Client vs Owner)
    const isOwnerRole = currentUser.role === 'owner';
    const senderRole = isOwnerRole ? 'owner' : 'user';
    const senderDisplayName = isOwnerRole ? (currentUser.name || selectedOwner.name) : (fullName || currentUser.name);

    setMessages((prev) => [
      ...prev,
      { id: `msg_${Date.now()}`, role: senderRole, senderName: senderDisplayName, text: userText }
    ]);

    // If reservation is approved/confirmed, simulate real-time direct chat response from Owner/Client!
    if (step === 'OWNER_APPROVED' || step === 'CONFIRMED') {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        if (isOwnerRole) {
          setMessages((prev) => [
            ...prev,
            {
              id: `msg_resp_${Date.now()}`,
              role: 'user',
              senderName: fullName || 'Client',
              text: `Received! Thanks ${senderDisplayName}, reviewing your message now.`
            }
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: `msg_resp_${Date.now()}`,
              role: 'owner',
              senderName: selectedOwner.name,
              text: `Got your message, ${senderDisplayName}! I am currently setting up the architecture for "${appointmentType}". I'll keep you updated on progress!`
            }
          ]);
        }
      }, 1000);
      return;
    }

    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { id: `u_${Date.now()}`, role: 'user', senderName: senderDisplayName, text: userText }]
        })
      });

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { id: `a_${Date.now()}`, role: 'ai', text: data.text || 'Message recorded.' }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `a_${Date.now()}`, role: 'ai', text: 'Message recorded.' }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Compute Current Step Index (1-4)
  const currentStepNum = 
    step === 'SELECT_TYPE' ? 1 : 
    step === 'SELECT_OWNER' ? 2 : 
    step === 'SELECT_TIMING' ? 3 : 4;

  return (
    <div className="min-h-screen w-full bg-[#03060f] text-slate-100 font-sans selection:bg-blue-600 selection:text-white flex flex-col relative">
      {/* Header Bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-800/80 bg-[#03060f]/90 px-3 sm:px-6 backdrop-blur-md">
        {/* Working Back Button */}
        <button
          onClick={onReturnHome}
          className="flex items-center space-x-1.5 sm:space-x-2 rounded-lg bg-slate-900/80 border border-slate-800 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium text-slate-300 hover:text-white hover:border-slate-700 transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to Home</span>
          <span className="sm:hidden">Back</span>
        </button>

        {/* User Profile Icon Dropdown or Confirmed Developer Appointment Badge */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {currentUser && (
            <button
              onClick={() => {
                fetchHistoryLeads();
                setIsHistoryOpen(true);
              }}
              className="flex items-center space-x-1.5 rounded-lg border border-blue-500/40 bg-blue-600/10 px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold text-blue-300 hover:bg-blue-600/20 hover:text-white transition-all cursor-pointer shadow-sm font-mono"
            >
              <Clock className="h-4 w-4 text-blue-400 shrink-0" />
              <span className="hidden sm:inline">View Work &amp; Chat History</span>
              <span className="sm:hidden">History</span>
            </button>
          )}

          {currentUser ? (
            <UserProfileDropdown session={currentUser} />
          ) : (
            <div className="flex items-center space-x-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 sm:px-3 py-1.5 font-mono text-[10px] sm:text-xs text-amber-400">
              <Lock className="h-3.5 w-3.5 animate-pulse text-amber-400 shrink-0" />
              <span className="font-semibold uppercase tracking-wider hidden xs:inline">LOGIN REQUIRED</span>
            </div>
          )}

          {bookedAppointment && (
            <div className="relative">
              <button
                onClick={() => setShowCornerModal(!showCornerModal)}
                className="flex items-center space-x-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-2.5 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="font-semibold font-mono hidden sm:inline">Dev Consultation: {bookedAppointment.timing}</span>
                <span className="font-semibold font-mono sm:hidden">Consultation</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* LOGIN REQUIRED GATE MODAL OVERLAY */}
      {!currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-3 sm:px-4 backdrop-blur-md">
          <div className="relative w-[92vw] max-w-lg rounded-2xl border border-blue-900/60 bg-[#090d18] p-5 sm:p-8 shadow-2xl space-y-5 text-slate-100 font-sans">
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 shadow-lg">
                <Lock className="h-6 w-6 text-blue-400" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">Login Required to Chat with Agent</h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Please sign in to chat with the AutonomOps DevStudio AI agent and book software engineering appointments.
              </p>
            </div>

            {/* Custom Credentials Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs">
              {authError && (
                <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-2.5 text-rose-400 text-xs font-mono">
                  {authError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 rounded-lg bg-[#03060f] p-1 border border-slate-800 font-mono text-[11px]">
                <button
                  type="button"
                  onClick={() => setAuthRole('client')}
                  className={`py-2 rounded font-semibold transition-all ${authRole === 'client' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                >
                  Client / User
                </button>
                <button
                  type="button"
                  onClick={() => setAuthRole('owner')}
                  className={`py-2 rounded font-semibold transition-all ${authRole === 'owner' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                >
                  Business Owner
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Full Name*</label>
                <input
                  type="text"
                  required
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full rounded-lg border border-slate-800 bg-[#03060f] px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Email Address*</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full rounded-lg border border-slate-800 bg-[#03060f] px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">Password*</label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-800 bg-[#03060f] px-3.5 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-blue-600 py-3 text-xs font-bold text-white hover:bg-blue-500 transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-lg shadow-blue-600/20"
              >
                <span>Sign In as {authRole === 'owner' ? 'Business Owner' : 'Client'}</span>
                <span>→</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Main Interactive Chat & Developer Engine View */}
      <main className={`mx-auto max-w-4xl w-full px-3 sm:px-4 py-4 sm:py-8 space-y-6 sm:space-y-8 flex-1 flex flex-col justify-between overflow-y-auto ${!currentUser ? 'filter blur-sm pointer-events-none' : ''}`}>
        <div className="space-y-6">
          {/* STEP PROGRESS BAR INDICATOR */}
          {step !== 'AWAITING_OWNER_CONFIRM' && step !== 'OWNER_APPROVED' && step !== 'CONFIRMED' && (
            <div className="rounded-xl border border-slate-800 bg-[#070c18] p-3 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="font-bold text-blue-400 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> STEP {currentStepNum} OF 4
                </span>
                <span className="text-[11px] sm:text-xs">
                  {currentStepNum === 1 ? 'Select Service' : currentStepNum === 2 ? 'Select Lead Engineer' : currentStepNum === 3 ? 'Timing Slot' : 'Project Details & Expectations'}
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-500"
                  style={{ width: `${(currentStepNum / 4) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* DIRECT CHAT ACTIVE BANNER AFTER APPROVAL */}
          {(step === 'OWNER_APPROVED' || step === 'CONFIRMED') && (
            <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-3.5 text-xs font-mono text-blue-300 flex items-center justify-between shadow-lg">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4 text-blue-400" />
                <span className="font-bold">💬 DIRECT CHAT ACTIVE: Client ({fullName || 'User'}) ↔ Owner ({selectedOwner.name})</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-200 font-bold uppercase">
                REAL-TIME
              </span>
            </div>
          )}

          {/* Chat Messages */}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start space-x-2.5 sm:space-x-3 ${m.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              {m.role === 'ai' && (
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 font-mono text-[10px] sm:text-xs font-bold text-white shadow-md border border-blue-400/30">
                  &lt;/&gt;
                </div>
              )}

              {m.role === 'owner' && (
                <div className="flex h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-600 to-emerald-600 font-mono text-[10px] sm:text-xs font-bold text-white shadow-md border border-amber-400/40" title="Business Owner">
                  👑
                </div>
              )}

              <div
                className={`max-w-[90%] sm:max-w-[78%] rounded-xl p-3.5 sm:p-4 text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white font-medium shadow-lg shadow-blue-600/20'
                    : m.role === 'owner'
                    ? 'border border-amber-500/40 bg-amber-950/20 text-slate-100 shadow-xl'
                    : 'border border-slate-800 bg-[#090d18] text-slate-200 shadow-xl'
                }`}
              >
                {m.senderName && (
                  <span className="block text-[10px] font-mono font-bold mb-1 opacity-80 uppercase tracking-wider">
                    {m.role === 'owner' ? `👑 ${m.senderName} (Owner)` : m.senderName}
                  </span>
                )}
                <p className="whitespace-pre-wrap">{m.text}</p>
              </div>
            </div>
          ))}

          {/* STEP 1: OPTIONS FOR SERVICES WE PROVIDE */}
          {step === 'SELECT_TYPE' && (
            <div className="pl-0 sm:pl-11 space-y-3">
              <p className="text-[11px] font-mono uppercase text-slate-400 tracking-wider font-semibold">
                Services We Provide — Choose an Option:
              </p>
              <div className="grid grid-cols-1 gap-3">
                {SERVICES_PROVIDED.map((s) => {
                  const IconComponent = s.icon;
                  return (
                    <button
                      key={s.id}
                      onClick={() => handleSelectType(s.title)}
                      className="flex items-center justify-between rounded-xl border border-slate-800 bg-[#070c18] p-4 text-xs text-slate-200 hover:border-blue-500 hover:bg-blue-600/10 hover:text-white transition-all text-left group cursor-pointer shadow-lg"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors mt-0.5">
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-semibold text-white block mb-0.5">{s.title}</span>
                          <span className="text-[11px] text-slate-400 font-sans">{s.desc}</span>
                        </div>
                      </div>
                      <span className="text-slate-500 group-hover:text-blue-400 font-mono text-lg pl-3">→</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: SELECT BUSINESS OWNER & LEAD ENGINEER MATCHED TO CLIENT'S CHOSEN WORK */}
          {step === 'SELECT_OWNER' && (
            <div className="pl-11 space-y-3">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-[11px] uppercase text-blue-400 font-bold tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                  Assigned Specialist for: {appointmentType}
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 uppercase font-bold">
                  MATCHED BY WORK
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {getMatchedOwnersForWork(appointmentType).map((owner) => (
                  <div
                    key={owner.id}
                    className="rounded-xl border border-blue-500/40 bg-[#070c18] p-4 space-y-3 hover:border-blue-400 transition-all shadow-lg text-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 font-bold text-white text-sm shadow">
                          {owner.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-white flex items-center gap-1.5 text-sm">
                            {owner.name} <Crown className="h-4 w-4 text-amber-400" />
                          </h4>
                          <p className="text-[11px] text-blue-400 font-mono font-bold mt-0.5">{owner.role}</p>
                          <p className="text-[10px] text-slate-300 mt-1 font-sans font-semibold">🎯 Domain: {owner.specialty}</p>
                        </div>
                      </div>
                      <span className="font-mono text-[10px] text-amber-300 font-bold bg-amber-950/80 px-2.5 py-1 rounded border border-amber-800">
                        {owner.rating}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-3 font-mono text-[10px] text-slate-300">
                        <span className="flex items-center gap-1 text-slate-400"><ShieldCheck className="h-3 w-3 text-blue-400" /> Verified Business Owner</span>
                      </div>

                      {selectedOwner && selectedOwner.id === owner.id ? (
                        <div className="flex flex-col space-y-2 w-full sm:w-auto">
                          <button
                            disabled={true}
                            className="rounded-lg bg-emerald-950/80 border border-emerald-500/50 px-4 py-2 text-xs font-bold text-emerald-300 cursor-not-allowed opacity-90 shadow font-mono flex items-center justify-center space-x-1.5"
                          >
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            <span>Specialist {owner.name} Assigned — Complete Form for Approval</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleSelectOwner(owner)}
                          className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition-colors cursor-pointer shadow flex items-center space-x-1 font-mono"
                        >
                          <span>Confirm &amp; Assign Work</span>
                          <span>→</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* APPROVED OWNER CONNECTION BANNER (ONLY DISPLAYED AFTER OWNER APPROVAL) */}
          {selectedOwner && (step === 'OWNER_APPROVED' || step === 'CONFIRMED') && (
            <div className="pl-11 mb-2">
              <div className="rounded-xl border border-emerald-500/30 bg-[#070c1e] p-3.5 text-xs font-mono text-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-md">
                <div className="flex items-center space-x-2">
                  <Crown className="h-4 w-4 text-amber-400 flex-shrink-0" />
                  <span>Owner <strong>{selectedOwner.name}</strong> (<a href={`mailto:${selectedOwner.email}`} className="text-emerald-300 underline font-bold">{selectedOwner.email}</a>) has approved your request and will connect with you shortly.</span>
                </div>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2.5 py-0.5 rounded font-bold uppercase flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" /> OWNER APPROVED &amp; CONNECTED
                </span>
              </div>
            </div>
          )}

          {/* STEP 3: PRESET TIMING SLOTS OR CUSTOM TIMING INPUT */}
          {step === 'SELECT_TIMING' && (
            <div className="pl-11 space-y-4">
              <p className="text-[11px] font-mono uppercase text-slate-400 tracking-wider font-semibold">
                Select a Preset Slot OR Enter Your Own Custom Timing:
              </p>
              
              {/* Preset Slot Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TIMING_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => handleSelectTiming(slot)}
                    className="flex items-center space-x-2.5 rounded-xl border border-slate-800 bg-[#070c18] p-3.5 text-xs text-slate-200 hover:border-blue-500 hover:bg-blue-600/10 hover:text-white transition-all cursor-pointer shadow-md font-medium"
                  >
                    <Clock className="h-4 w-4 text-blue-400" />
                    <span className="font-mono">{slot}</span>
                  </button>
                ))}
              </div>

              {/* Custom Timing Input Form */}
              <form onSubmit={handleCustomTimingSubmit} className="flex space-x-2 pt-1">
                <div className="relative flex-1">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={customTimingInput}
                    onChange={(e) => setCustomTimingInput(e.target.value)}
                    placeholder="Or type custom timing (e.g. Next Monday at 4:30 PM EST)..."
                    className="w-full rounded-xl border border-slate-800 bg-[#070c18] pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none font-mono"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!customTimingInput.trim()}
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors disabled:opacity-40 cursor-pointer font-mono flex items-center space-x-1"
                >
                  <span>Confirm</span>
                  <span>→</span>
                </button>
              </form>
            </div>
          )}

          {/* STEP 4: DEVELOPER DETAILS & PROJECT EXPECTATIONS FORM (PREMIUM GLASSMORPHISM UI/UX) */}
          {step === 'ENTER_DETAILS' && (
            <div className="pl-11 space-y-4">
              <div className="rounded-2xl border border-blue-500/40 bg-gradient-to-b from-[#0a1022] to-[#040814] p-6 shadow-2xl space-y-5 relative overflow-hidden backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
                      <Terminal className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm tracking-tight">Project Details &amp; Expectations</h3>
                      <p className="text-[11px] text-slate-400 font-mono">Assigned to Business Owner: {selectedOwner.name}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase">
                    STEP 4 OF 4
                  </span>
                </div>

                <form onSubmit={handleSubmitDetails} className="space-y-4 text-xs">
                  {/* Quick Project Credentials & Specs Preset Buttons */}
                  <div className="rounded-xl border border-slate-800 bg-[#03060f]/90 p-3.5 space-y-2 font-mono text-xs shadow-inner">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-sans font-bold uppercase">
                      <span className="flex items-center gap-1.5"><Key className="h-3.5 w-3.5 text-blue-400" /> 1-Click Fill Credentials &amp; Project Specs:</span>
                      <span className="text-blue-400 font-mono">AUTOPILOT</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={handleAutofillSampleProject}
                        className="p-2.5 rounded-lg bg-[#070c18] border border-slate-800 text-left hover:border-blue-500 transition-all cursor-pointer group"
                      >
                        <span className="block font-bold text-white text-[11px] font-sans group-hover:text-blue-400">⚡ Full-Stack Next.js App</span>
                        <span className="text-[10px] text-slate-400 block font-mono">Alex Rivera • alex@techstart.io</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleAutofillEnterpriseSpecs}
                        className="p-2.5 rounded-lg bg-[#070c18] border border-slate-800 text-left hover:border-amber-500 transition-all cursor-pointer group"
                      >
                        <span className="block font-bold text-white text-[11px] font-sans group-hover:text-amber-400">🤖 AI Agent &amp; LLM RAG Pipeline</span>
                        <span className="text-[10px] text-slate-400 block font-mono">Elena Rostova • elena@enterpriseai.io</span>
                      </button>
                    </div>
                  </div>

                  {formDetailsError && (
                    <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-rose-400 font-mono text-xs flex items-center space-x-2 animate-fade-in">
                      <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />
                      <span>{formDetailsError}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono text-[10px] uppercase text-slate-400 mb-1.5 font-semibold">
                        Developer / Client Full Name*
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Alex Rivera"
                          className="w-full rounded-xl border border-slate-800 bg-[#03060f]/80 pl-9 pr-4 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-mono text-[10px] uppercase text-slate-400 mb-1.5 font-semibold">
                        Work Email Address*
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                        <input
                          type="email"
                          required
                          value={workEmail}
                          onChange={(e) => setWorkEmail(e.target.value)}
                          placeholder="alex@techstart.io"
                          className="w-full rounded-xl border border-slate-800 bg-[#03060f]/80 pl-9 pr-4 py-2.5 text-xs text-white focus:border-blue-500 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono text-[10px] uppercase text-slate-400 mb-1.5 font-semibold">
                        Mobile / WhatsApp Number* <span className="text-[9px] text-blue-400 font-mono">(Digits only, max 10)</span>
                      </label>
                      <div className="flex space-x-2">
                        <select
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          className="rounded-xl border border-slate-800 bg-[#03060f]/90 px-3 py-2.5 text-xs text-blue-300 font-mono focus:border-blue-500 focus:outline-none cursor-pointer"
                        >
                          {COUNTRY_CODES.map((c) => (
                            <option key={c.code} value={c.code} className="bg-[#040814] text-white">
                              {c.label}
                            </option>
                          ))}
                        </select>
                        <div className="relative flex-1">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                          <input
                            type="tel"
                            required
                            maxLength={10}
                            value={mobilePhone}
                            onChange={(e) => handlePhoneInputChange(e.target.value)}
                            placeholder="9876543210 (10 digits)"
                            className="w-full rounded-xl border border-slate-800 bg-[#03060f]/80 pl-9 pr-4 py-2.5 text-xs text-white font-mono focus:border-blue-500 focus:outline-none transition-colors"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block font-mono text-[10px] uppercase text-slate-400 mb-1.5 font-semibold">
                        Zip Code / Region*
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                        <input
                          type="text"
                          required
                          value={zipCode}
                          onChange={(e) => setZipCode(e.target.value)}
                          placeholder="94103 (or REMOTE)"
                          className="w-full rounded-xl border border-slate-800 bg-[#03060f]/80 pl-9 pr-4 py-2.5 text-xs text-white font-mono focus:border-blue-500 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* REQUIRED PROJECT EXPECTATIONS TEXTAREA */}
                  <div>
                    <label className="block font-mono text-[10px] uppercase text-blue-400 mb-1.5 font-bold flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-blue-400" /> What do you expect to build from our business?*
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={projectExpectations}
                      onChange={(e) => setProjectExpectations(e.target.value)}
                      placeholder="Describe what application, features, tech stack, or custom engineering output you expect us to build for your business..."
                      className="w-full rounded-xl border border-slate-800 bg-[#03060f]/80 p-3.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none font-sans leading-relaxed transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-xs font-bold text-white hover:from-blue-500 hover:to-indigo-500 transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-blue-600/25 font-mono"
                  >
                    <Database className="h-4 w-4" />
                    <span>Assign Work to Owner {selectedOwner.name} &amp; Submit</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* STEP 5: AWAITING OWNER CONFIRMATION CARD (NO OWNER ACTION BUTTON DISPLAYED TO CLIENT) */}
          {step === 'AWAITING_OWNER_CONFIRM' && (
            <div className="pl-11 space-y-4">
              <div className="rounded-xl border border-amber-500/30 bg-amber-950/10 p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                  <div className="flex items-center space-x-2 text-xs font-bold text-amber-400 font-mono">
                    <Hourglass className="h-4 w-4 animate-spin text-amber-400" />
                    <span>STATUS: AWAITING OWNER ({selectedOwner.name.toUpperCase()}) CONFIRMATION</span>
                  </div>
                  <span className="text-[10px] px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono flex items-center gap-1">
                    <Database className="h-3 w-3" /> SAVED IN POSTGRES
                  </span>
                </div>

                <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
                  <p>Your appointment request for <strong>{appointmentType}</strong> ({appointmentTiming}) has been submitted to Business Owner <strong>{selectedOwner.name}</strong>.</p>
                  <p className="text-slate-300"><strong>Expectations:</strong> "{projectExpectations}"</p>
                  <p className="text-amber-400 font-mono text-[11px]">⏳ Once {selectedOwner.name} approves your reservation from the Owner Dashboard, their email address will be revealed below and direct messaging will activate!</p>
                </div>

                {/* Owner Email Locked Notice */}
                <div className="rounded-lg border border-amber-900/40 bg-[#03060f] p-3 text-xs flex items-center space-x-2 font-mono text-amber-300">
                  <Lock className="h-4 w-4 text-amber-400 flex-shrink-0" />
                  <span>Owner email address is protected and will be unlocked automatically upon owner approval.</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6 & 7: OWNER APPROVED & STRIPE PAYMENT GATEWAY */}
          {(step === 'OWNER_APPROVED' || step === 'CONFIRMED') && (
            <div className="pl-11 space-y-6">
              {/* Owner Approval Banner */}
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-xs font-mono text-emerald-400 flex items-center justify-between shadow-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <span className="font-bold">RESERVATION APPROVED BY OWNER {selectedOwner.name.toUpperCase()}! STRIPE GATEWAY UNLOCKED</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold flex items-center gap-1">
                  <Database className="h-3 w-3" /> POSTGRES UPDATED
                </span>
              </div>

              {/* Autofilled Developer Profile */}
              <div className="rounded-xl border border-blue-950/60 bg-[#070c18] p-6 shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                  <div className="flex items-center space-x-2 font-mono text-xs text-blue-400">
                    <Code className="h-4 w-4 text-blue-400" />
                    <span className="tracking-widest uppercase font-semibold">APPROVED DEVELOPER PROFILE &amp; ASSIGNED OWNER</span>
                  </div>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    ASSIGNED: {selectedOwner.name.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="space-y-1 bg-[#03060f] p-3 rounded-lg border border-slate-800/60">
                    <span className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1 font-sans">
                      <Crown className="h-3 w-3 text-amber-400" /> Assigned Owner / Lead Engineer
                    </span>
                    <p className="font-semibold text-white font-sans">{selectedOwner.name} ({selectedOwner.email})</p>
                  </div>

                  <div className="space-y-1 bg-[#03060f] p-3 rounded-lg border border-slate-800/60">
                    <span className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1 font-sans">
                      <Tag className="h-3 w-3 text-blue-400" /> Service Module
                    </span>
                    <p className="font-semibold text-slate-200 font-sans">{appointmentType}</p>
                  </div>

                  <div className="space-y-1 bg-[#03060f] p-3 rounded-lg border border-slate-800/60">
                    <span className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1 font-sans">
                      <Clock className="h-3 w-3 text-blue-400" /> Consultation Time
                    </span>
                    <p className="font-semibold text-slate-200">{appointmentTiming}</p>
                  </div>

                  <div className="space-y-1 bg-[#03060f] p-3 rounded-lg border border-slate-800/60">
                    <span className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1 font-sans">
                      <User className="h-3 w-3 text-blue-400" /> Developer Contact
                    </span>
                    <p className="font-medium text-slate-200">{fullName} ({workEmail})</p>
                  </div>
                </div>

                {/* Project Expectations Summary */}
                <div className="rounded-lg border border-slate-800 bg-[#03060f] p-3.5 space-y-1 text-xs font-mono">
                  <span className="text-[10px] text-slate-400 uppercase font-sans font-semibold flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-blue-400" /> Project Expectations
                  </span>
                  <p className="text-slate-200 font-sans leading-relaxed">{projectExpectations}</p>
                </div>

                {/* Direct Owner Action Buttons Bar */}
                <div className="rounded-xl border border-blue-900/60 bg-blue-950/20 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-2">
                    <Crown className="h-5 w-5 text-amber-400" />
                    <div>
                      <span className="font-bold text-white block">Give Work Directly to {selectedOwner.name}</span>
                      <span className="text-[11px] text-slate-400">{selectedOwner.role}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <a
                      href={`mailto:${selectedOwner.email}`}
                      className="flex items-center space-x-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition-colors shadow"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      <span>Email Owner</span>
                    </a>
                  </div>
                </div>

                {/* Owner Software Engineering Pricing Calculation Card */}
                <div className="rounded-lg border border-blue-500/20 bg-blue-950/10 p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono text-blue-400">
                    <span className="font-semibold flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5" /> OWNER APPROVED PRICING
                    </span>
                    <span>AUTOMATED SPRINT QUOTE</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-[#03060f]/60 p-2.5 rounded border border-slate-800">
                      <span className="block text-[9px] font-mono text-slate-400">BASE KICKOFF FEE</span>
                      <span className="font-bold text-slate-200">${pricingAssessment.pricingBreakdown.base_fee}.00</span>
                    </div>
                    <div className="bg-[#03060f]/60 p-2.5 rounded border border-slate-800">
                      <span className="block text-[9px] font-mono text-slate-400">ESTIMATED SPRINT QUOTE</span>
                      <span className="font-bold text-slate-200">${pricingAssessment.pricingBreakdown.min_quote} - ${pricingAssessment.pricingBreakdown.max_quote}</span>
                    </div>
                    <div className="bg-emerald-500/10 p-2.5 rounded border border-emerald-500/30">
                      <span className="block text-[9px] font-mono text-emerald-400 font-semibold">20% DEPOSIT DUE</span>
                      <span className="font-bold text-emerald-400">${pricingAssessment.pricingBreakdown.deposit_amount}</span>
                    </div>
                  </div>
                </div>

                {/* Stripe Payment Gateway Component */}
                {step !== 'CONFIRMED' && (
                  <div className="rounded-xl border border-emerald-500/30 bg-[#090d18] p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center space-x-2 text-xs font-semibold text-white">
                        <CreditCard className="h-4 w-4 text-emerald-400" />
                        <span>Owner Stripe Payment Gateway (UNLOCKED)</span>
                      </div>
                      <div className="flex items-center space-x-1 font-mono text-[10px] text-slate-400">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                        <span>256-BIT ENCRYPTED</span>
                      </div>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block text-[10px] font-mono text-slate-400 mb-1">CARD NUMBER</label>
                        <input
                          type="text"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full rounded border border-slate-800 bg-[#03060f] px-3 py-2 font-mono text-xs text-white focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 mb-1">EXPIRATION</label>
                          <input
                            type="text"
                            value={cardExp}
                            onChange={(e) => setCardExp(e.target.value)}
                            className="w-full rounded border border-slate-800 bg-[#03060f] px-3 py-2 font-mono text-xs text-white focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-slate-400 mb-1">CVC</label>
                          <input
                            type="text"
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value)}
                            className="w-full rounded border border-slate-800 bg-[#03060f] px-3 py-2 font-mono text-xs text-white focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <button
                          onClick={handlePayAndBook}
                          disabled={isProcessingPayment}
                          className="w-full rounded-lg bg-emerald-600 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 font-mono"
                        >
                          {isProcessingPayment ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Processing Stripe Payment...</span>
                            </>
                          ) : (
                            <>
                              <span>Pay ${pricingAssessment.pricingBreakdown.deposit_amount} Deposit &amp; Confirm Booking</span>
                              <span>→</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={async () => {
                            const depositAmt = pricingAssessment.pricingBreakdown.deposit_amount || 75;
                            try {
                              const res = await fetch('/api/stripe/checkout', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  type: 'deposit',
                                  amount: depositAmt,
                                  title: `Project Kickoff Deposit - ${appointmentType}`,
                                  email: workEmail,
                                  name: fullName,
                                  leadId: currentLeadId,
                                  returnUrl: '/chat'
                                })
                              });
                              const data = await res.json();
                              if (data.url) {
                                window.location.href = data.url;
                              }
                            } catch (err) {
                              const targetUrl = `/checkout/stripe?type=deposit&amount=${depositAmt}&title=${encodeURIComponent(`Project Kickoff Deposit - ${appointmentType}`)}&email=${encodeURIComponent(workEmail)}&name=${encodeURIComponent(fullName)}&leadId=${currentLeadId}&returnUrl=/chat`;
                              window.location.href = targetUrl;
                            }
                          }}
                          className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 py-3 text-xs font-bold text-white shadow-lg hover:from-indigo-500 hover:to-purple-500 transition-all flex items-center justify-center space-x-2 cursor-pointer font-mono"
                        >
                          <CreditCard className="h-4 w-4 text-emerald-400" />
                          <span>Redirect to Official Stripe Gateway Checkout Page (${pricingAssessment.pricingBreakdown.deposit_amount})</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 font-mono text-xs font-bold text-white shadow-md border border-blue-400/30">
                &lt;/&gt;
              </div>
              <div className="rounded-xl border border-slate-800 bg-[#090d18] px-4 py-3 text-xs text-slate-400 font-mono flex items-center space-x-2 shadow-xl">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
                <span>AutonomOps is typing...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Working Interactive Chat Input Form */}
        <form onSubmit={handleSendInput} className="flex space-x-2 pt-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping || !currentUser}
            placeholder={!currentUser ? "Sign in to chat with agent..." : isTyping ? "AutonomOps is typing..." : "Type your message or project question..."}
            className="flex-1 rounded-lg border border-slate-800 bg-[#070c18] px-4 py-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none font-sans disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isTyping || !input.trim() || !currentUser}
            className="rounded-lg bg-blue-600 px-5 py-3 text-xs font-semibold text-white hover:bg-blue-500 transition-colors flex items-center space-x-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTyping ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>Send</span>
                <Send className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>
      </main>

      {/* PREVIOUS CHAT & WORK HISTORY MODAL DRAWER */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="h-full w-full max-w-xl bg-[#070c19] border-l border-slate-800 p-6 flex flex-col justify-between shadow-2xl overflow-y-auto space-y-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Previous Work &amp; Chat History</h3>
                    <p className="text-xs text-slate-400 font-mono">Client: {currentUser?.name || fullName} ({currentUser?.email || workEmail})</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {historyLeads.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-xs text-slate-400 font-mono space-y-2">
                  <p className="font-semibold text-slate-300">No previous work history or bookings found.</p>
                  <p className="text-[11px] text-slate-500">Submit a project detail form to view your live reservations here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {historyLeads.map((lead) => {
                    const isApproved = lead.status === 'owner_approved_awaiting_payment' || lead.status === 'deposit_paid';
                    const isCancelled = lead.status === 'declined_out_of_area';

                    return (
                      <div
                        key={lead.id}
                        className={`rounded-2xl border p-5 space-y-3 shadow-lg transition-all ${
                          isApproved
                            ? 'border-emerald-500/40 bg-emerald-950/20'
                            : isCancelled
                            ? 'border-rose-500/40 bg-rose-950/20'
                            : 'border-amber-500/40 bg-amber-950/20'
                        }`}
                      >
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                          <div>
                            <span className="font-bold text-white text-xs block">{lead.project_type}</span>
                            <span className="text-[11px] text-slate-400 font-mono block">Submitted: {new Date(lead.created_at || Date.now()).toLocaleDateString()}</span>
                          </div>
                          <span
                            className={`font-mono text-[10px] font-bold px-2.5 py-1 rounded ${
                              isApproved
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : isCancelled
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {isApproved
                              ? '✓ APPROVED BY OWNER'
                              : isCancelled
                              ? '❌ CANCELLED'
                              : 'PENDING APPROVAL'}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs font-mono text-slate-300">
                          <p><strong className="text-slate-400">Assigned Owner:</strong> Sujal Garg (Founder &amp; Architect)</p>
                          <p><strong className="text-slate-400">Scheduled Timing:</strong> {lead.preferred_timeline}</p>
                          <p><strong className="text-slate-400">Deposit Paid/Due:</strong> ${lead.pricing_breakdown?.deposit_amount || 75.00}</p>
                        </div>

                        <div className="rounded-xl bg-[#03060f] p-3 text-xs border border-slate-800 space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase font-mono block">Project Scope:</span>
                          <p className="text-slate-200">{lead.scope || 'Full-Stack Software Engineering'}</p>
                        </div>

                        {/* CHAT MESSAGES SNIPPET */}
                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <MessageSquare className="h-3.5 w-3.5 text-blue-400" /> Owner Direct Chat Active
                          </span>
                          <button
                            onClick={() => {
                              setIsHistoryOpen(false);
                              setStep('ENTER_DETAILS');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-300 hover:bg-blue-600 hover:text-white transition-all text-xs font-bold"
                          >
                            Open Live Chat
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="w-full rounded-xl bg-slate-800 py-3 text-xs font-bold text-white hover:bg-slate-700 transition-colors"
              >
                Close History Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
