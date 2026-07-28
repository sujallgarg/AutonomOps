'use client';

import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  CreditCard, 
  Calendar, 
  Loader2, 
  Upload,
  Code,
  Wrench,
  Zap,
  Thermometer,
  Scale,
  Car,
  Home as HomeIcon,
  Sparkle,
  Paintbrush,
  Dog,
  Plus
} from 'lucide-react';
import { getOrCreatePricingMatrix, POPULAR_CATEGORY_PRESETS } from '@/lib/agent/pricingEngine';
import { Lead } from '@/types/agent';

interface IntakeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadCreated?: (lead: Lead) => void;
}

export function IntakeFormModal({ isOpen, onClose, onLeadCreated }: IntakeFormModalProps) {
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>('software_engineering');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);

  const [fullName, setFullName] = useState('Alex Rivera');
  const [email, setEmail] = useState('alex@techstartup.com');
  const [phone, setPhone] = useState('555-0199');
  const [zipCode, setZipCode] = useState('94107');
  const [projectType, setProjectType] = useState('Full-Stack Software Engineer Staffing');
  const [timeline, setTimeline] = useState('ASAP, within 2 weeks');
  const [scope, setScope] = useState('Senior React / Node / Python Software Engineer for AI Agent platform build · Next.js · Remote / 94107');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80'
  );

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'processing' | 'result'>('form');
  const [resultData, setResultData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'estimate' | 'checkout' | 'json'>('estimate');

  if (!isOpen) return null;

  const activeCategoryName = isCustom && customCategory.trim()
    ? customCategory.trim()
    : POPULAR_CATEGORY_PRESETS[selectedPresetKey]?.industry_category || 'General Service';

  const handleSelectPreset = (key: string) => {
    setIsCustom(false);
    setSelectedPresetKey(key);
    const preset = POPULAR_CATEGORY_PRESETS[key];
    if (preset) {
      setProjectType(`${preset.industry_category} Project`);
      if (key === 'software_engineering') {
        setZipCode('94107');
        setScope('Senior React / Node Software Engineer to build AI Agent orchestration platform');
        setPhotoUrl('https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80');
      } else if (key === 'plumbing') {
        setZipCode('12202');
        setScope('plumber · for leakage · wall · 12202 · asap');
        setPhotoUrl('https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80');
      } else if (key === 'auto_detailing') {
        setZipCode('12201');
        setScope('Full exterior ceramic coating and interior deep detailing for sedan');
        setPhotoUrl('https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=600&q=80');
      } else if (key === 'roofing_construction') {
        setZipCode('12203');
        setScope('Roof shingle replacement and gutter inspection after storm');
        setPhotoUrl('https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80');
      } else {
        setZipCode('12202');
        setScope(`Standard inquiry for ${preset.industry_category}`);
        setPhotoUrl(undefined);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStep('processing');

    const activeMatrix = getOrCreatePricingMatrix(activeCategoryName);

    try {
      const response = await fetch('/api/agent/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone,
          zip_code: zipCode,
          industry_category: activeCategoryName,
          project_type: projectType,
          preferred_timeline: timeline,
          scope,
          photo_url: photoUrl,
          pricing_matrix: activeMatrix,
          business_name: `AutonomOps (${activeCategoryName})`
        })
      });

      const data = await response.json();
      setResultData(data);
      setStep('result');
      if (data.lead && onLeadCreated) {
        onLeadCreated(data.lead);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to execute intake agent.');
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-blue-900/60 bg-[#0b101c] p-6 shadow-2xl my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {step === 'form' && (
          <div>
            {/* Header */}
            <div className="flex items-center space-x-2 font-mono text-xs text-blue-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>UNIVERSAL AI INTAKE FOR ANY BUSINESS</span>
            </div>
            <h2 className="mt-1 text-2xl font-bold text-white">Select or Enter Business Category</h2>

            {/* Popular Presets Grid */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => handleSelectPreset('software_engineering')}
                className={`flex items-center space-x-1.5 p-2 rounded border transition-all ${
                  !isCustom && selectedPresetKey === 'software_engineering'
                    ? 'border-blue-500 bg-blue-950/60 text-white'
                    : 'border-slate-800 bg-[#060911] text-slate-400 hover:text-white'
                }`}
              >
                <Code className="h-3.5 w-3.5 text-blue-400" />
                <span>Software &amp; Tech</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('plumbing')}
                className={`flex items-center space-x-1.5 p-2 rounded border transition-all ${
                  !isCustom && selectedPresetKey === 'plumbing'
                    ? 'border-blue-500 bg-blue-950/60 text-white'
                    : 'border-slate-800 bg-[#060911] text-slate-400 hover:text-white'
                }`}
              >
                <Wrench className="h-3.5 w-3.5 text-emerald-400" />
                <span>Plumbing</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('hvac')}
                className={`flex items-center space-x-1.5 p-2 rounded border transition-all ${
                  !isCustom && selectedPresetKey === 'hvac'
                    ? 'border-blue-500 bg-blue-950/60 text-white'
                    : 'border-slate-800 bg-[#060911] text-slate-400 hover:text-white'
                }`}
              >
                <Thermometer className="h-3.5 w-3.5 text-amber-400" />
                <span>HVAC</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('electrical')}
                className={`flex items-center space-x-1.5 p-2 rounded border transition-all ${
                  !isCustom && selectedPresetKey === 'electrical'
                    ? 'border-blue-500 bg-blue-950/60 text-white'
                    : 'border-slate-800 bg-[#060911] text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="h-3.5 w-3.5 text-yellow-400" />
                <span>Electrical</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('auto_detailing')}
                className={`flex items-center space-x-1.5 p-2 rounded border transition-all ${
                  !isCustom && selectedPresetKey === 'auto_detailing'
                    ? 'border-blue-500 bg-blue-950/60 text-white'
                    : 'border-slate-800 bg-[#060911] text-slate-400 hover:text-white'
                }`}
              >
                <Car className="h-3.5 w-3.5 text-cyan-400" />
                <span>Auto Detailing</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('roofing_construction')}
                className={`flex items-center space-x-1.5 p-2 rounded border transition-all ${
                  !isCustom && selectedPresetKey === 'roofing_construction'
                    ? 'border-blue-500 bg-blue-950/60 text-white'
                    : 'border-slate-800 bg-[#060911] text-slate-400 hover:text-white'
                }`}
              >
                <HomeIcon className="h-3.5 w-3.5 text-orange-400" />
                <span>Roofing</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('legal_financial')}
                className={`flex items-center space-x-1.5 p-2 rounded border transition-all ${
                  !isCustom && selectedPresetKey === 'legal_financial'
                    ? 'border-blue-500 bg-blue-950/60 text-white'
                    : 'border-slate-800 bg-[#060911] text-slate-400 hover:text-white'
                }`}
              >
                <Scale className="h-3.5 w-3.5 text-purple-400" />
                <span>Legal &amp; Advisory</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsCustom(true);
                  if (!customCategory) setCustomCategory('House Cleaning');
                }}
                className={`flex items-center space-x-1.5 p-2 rounded border transition-all ${
                  isCustom
                    ? 'border-blue-500 bg-blue-950/60 text-white'
                    : 'border-slate-800 bg-[#060911] text-slate-400 hover:text-white'
                }`}
              >
                <Plus className="h-3.5 w-3.5 text-pink-400" />
                <span>+ Custom Category</span>
              </button>
            </div>

            {/* Custom Category Input Field */}
            {isCustom && (
              <div className="mt-3 rounded border border-blue-500/40 bg-blue-950/30 p-3 space-y-1">
                <label className="block font-mono text-[10px] uppercase text-blue-400 font-bold">
                  TYPE ANY CUSTOM BUSINESS OR SERVICE CATEGORY NAME:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Car Detailing, Pet Grooming, Fitness Coaching, Graphic Design..."
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full rounded border border-blue-800 bg-[#060911] px-3 py-1.5 text-xs text-white font-mono focus:outline-none"
                />
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[10px] tracking-wider uppercase text-slate-400 mb-1">
                    FULL NAME*
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded border border-slate-800 bg-[#060911] px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] tracking-wider uppercase text-slate-400 mb-1">
                    EMAIL*
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded border border-slate-800 bg-[#060911] px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[10px] tracking-wider uppercase text-slate-400 mb-1">
                    PHONE
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded border border-slate-800 bg-[#060911] px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] tracking-wider uppercase text-slate-400 mb-1">
                    LOCATION / ZIP CODE* (OR REMOTE)
                  </label>
                  <input
                    type="text"
                    required
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    className="w-full rounded border border-slate-800 bg-[#060911] px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-mono text-[10px] tracking-wider uppercase text-slate-400 mb-1">
                    PROJECT / JOB TYPE*
                  </label>
                  <input
                    type="text"
                    required
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                    className="w-full rounded border border-slate-800 bg-[#060911] px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[10px] tracking-wider uppercase text-slate-400 mb-1">
                    PREFERRED TIMELINE
                  </label>
                  <input
                    type="text"
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    className="w-full rounded border border-slate-800 bg-[#060911] px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10px] tracking-wider uppercase text-slate-400 mb-1">
                  PROJECT SCOPE &amp; JOB DETAILS*
                </label>
                <textarea
                  rows={3}
                  required
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  className="w-full rounded border border-slate-800 bg-[#060911] px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none font-mono"
                />
              </div>

              {/* Photo Upload Simulator */}
              <div>
                <label className="block font-mono text-[10px] tracking-wider uppercase text-slate-400 mb-1">
                  JOB SITE PHOTO / SPECIFICATION ATTACHMENT (OPTIONAL)
                </label>
                <div className="flex items-center space-x-3 rounded border border-slate-800 bg-[#060911] p-2">
                  {photoUrl ? (
                    <img src={photoUrl} alt="Preview" className="h-12 w-12 rounded object-cover border border-slate-700" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded border border-dashed border-slate-700 text-slate-500">
                      <Upload className="h-4 w-4" />
                    </div>
                  )}
                  <div className="text-xs text-slate-400 flex-1">
                    <p className="font-medium text-slate-200">Specification photo / file attached</p>
                    <p className="text-[11px] text-slate-500">Gemini 3 Pro visual &amp; scope estimation enabled</p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 active:scale-[0.99] transition-all flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Evaluating [{activeCategoryName}] Pricing Matrix...</span>
                    </>
                  ) : (
                    <span>Generate Instant Quote for {activeCategoryName}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 'processing' && (
          <div className="py-12 text-center space-y-4">
            <Loader2 className="mx-auto h-10 w-10 text-blue-500 animate-spin" />
            <h3 className="text-lg font-bold text-white">AutonomOps Universal AI Agents</h3>
            <div className="max-w-md mx-auto space-y-2 text-xs font-mono text-slate-400 text-left bg-[#060911] p-4 rounded border border-slate-800">
              <p className="text-emerald-400 flex items-center space-x-2">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>1. Discovery Agent: Validating [{activeCategoryName}] location...</span>
              </p>
              <p className="text-blue-400 flex items-center space-x-2 animate-pulse">
                <Sparkles className="h-3.5 w-3.5" />
                <span>2. Estimator Agent: Calculating rates, hours &amp; complexity...</span>
              </p>
              <p className="text-slate-500 flex items-center space-x-2">
                <CreditCard className="h-3.5 w-3.5" />
                <span>3. Operations Agent: Stripe Deposit Invoice &amp; Booking...</span>
              </p>
            </div>
          </div>
        )}

        {step === 'result' && resultData && (
          <div>
            {/* Out of Area Result */}
            {!resultData.success ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-rose-500/30 bg-rose-950/30 p-4 text-rose-300">
                  <div className="flex items-center space-x-2 font-bold text-rose-400">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Out of Active Coverage Area</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                    {resultData.message}
                  </p>
                </div>
                <div className="bg-[#060911] p-4 rounded border border-slate-800">
                  <p className="font-mono text-xs text-slate-400 mb-2">Structured Execution Log:</p>
                  <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto p-2 bg-slate-950 rounded">
                    {JSON.stringify(resultData.log, null, 2)}
                  </pre>
                </div>
                <button
                  onClick={() => setStep('form')}
                  className="w-full rounded bg-slate-800 py-2.5 text-xs font-semibold text-white hover:bg-slate-700"
                >
                  Try Remote or another location
                </button>
              </div>
            ) : (
              /* Success Result */
              <div className="space-y-6">
                {/* Result Navigation Tabs */}
                <div className="flex border-b border-slate-800 text-xs font-mono">
                  <button
                    onClick={() => setActiveTab('estimate')}
                    className={`px-4 py-2 border-b-2 font-medium ${
                      activeTab === 'estimate'
                        ? 'border-blue-500 text-white'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    01. Estimate &amp; Dispatch Path
                  </button>
                  <button
                    onClick={() => setActiveTab('checkout')}
                    className={`px-4 py-2 border-b-2 font-medium ${
                      activeTab === 'checkout'
                        ? 'border-blue-500 text-white'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    02. Stripe &amp; Booking
                  </button>
                  <button
                    onClick={() => setActiveTab('json')}
                    className={`px-4 py-2 border-b-2 font-medium ${
                      activeTab === 'json'
                        ? 'border-blue-500 text-white'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    03. Execution Audit Trace
                  </button>
                </div>

                {/* TAB 1: Estimate & Dispatch */}
                {activeTab === 'estimate' && (
                  <div className="space-y-4">
                    {/* Dispatch Path Banner */}
                    <div
                      className={`rounded-lg border p-4 ${
                        resultData.assessment.dispatchPath === 'AUTO'
                          ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-200'
                          : 'border-amber-500/40 bg-amber-950/20 text-amber-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold uppercase tracking-wider">DISPATCH PATH:</span>
                          <span
                            className={`rounded px-2 py-0.5 font-mono text-xs font-bold ${
                              resultData.assessment.dispatchPath === 'AUTO'
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-amber-500 text-slate-950'
                            }`}
                          >
                            {resultData.assessment.dispatchPath}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-slate-400 uppercase font-bold">
                          {resultData.lead.industry_category}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-300">
                        {resultData.assessment.decisionReason}
                      </p>
                    </div>

                    {/* Estimate Quote Card matching screenshot */}
                    <div className="rounded-lg border border-slate-800 bg-[#060911] p-5">
                      <span className="font-mono text-xs text-slate-400">CALCULATED ESTIMATE RANGE [{activeCategoryName.toUpperCase()}]</span>
                      <div className="mt-1 flex items-baseline space-x-2">
                        <span className="text-3xl font-extrabold text-blue-400">
                          ${resultData.assessment.pricingBreakdown.min_quote}
                        </span>
                        <span className="text-xl font-bold text-slate-400">
                          - ${resultData.assessment.pricingBreakdown.max_quote}
                        </span>
                      </div>

                      {/* Pricing Breakdown items */}
                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs border-t border-slate-800/80 pt-3">
                        <div>
                          <span className="text-slate-500 block text-[10px]">BASE FEE</span>
                          <span className="font-mono text-slate-200">${resultData.assessment.pricingBreakdown.base_fee}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">ESTIMATED HOURS</span>
                          <span className="font-mono text-slate-200">{resultData.assessment.pricingBreakdown.estimated_hours} hrs @ ${resultData.assessment.pricingBreakdown.hourly_rate}/hr</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">COMPLEXITY MULTIPLIER</span>
                          <span className="font-mono text-blue-400">{resultData.assessment.pricingBreakdown.complexity_factor}x</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px]">DEPOSIT REQUIRED</span>
                          <span className="font-mono text-emerald-400">${resultData.assessment.pricingBreakdown.deposit_amount}</span>
                        </div>
                      </div>

                      {/* Safety / Risk flags alert */}
                      {resultData.assessment.safetyFlags.length > 0 && (
                        <div className="mt-3 rounded bg-amber-950/40 border border-amber-500/30 p-2.5 text-xs text-amber-300 flex items-center space-x-2">
                          <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0" />
                          <span>Detected Domain Risk Flags: <b>{resultData.assessment.safetyFlags.join(', ')}</b></span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: Stripe & Booking */}
                {activeTab === 'checkout' && (
                  <div className="space-y-4">
                    {resultData.stripeInvoice ? (
                      <div className="rounded-lg border border-slate-800 bg-[#060911] p-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                          <div className="flex items-center space-x-2 text-blue-400 font-medium text-sm">
                            <CreditCard className="h-4 w-4" />
                            <span>Stripe Checkout Deposit Invoice</span>
                          </div>
                          <span className="font-mono text-xs text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                            READY TO COLLECT
                          </span>
                        </div>

                        <div className="text-xs text-slate-300 space-y-1">
                          <p>Invoice ID: <span className="font-mono text-slate-100">{resultData.stripeInvoice.invoice_id}</span></p>
                          <p>Deposit Amount: <span className="font-mono font-bold text-emerald-400">${resultData.stripeInvoice.deposit_amount}</span></p>
                          <p>Reserved Calendar Slot: <span className="font-mono text-blue-400">{resultData.autoReservedSlot?.formatted_time}</span></p>
                        </div>

                        <a
                          href={resultData.stripeInvoice.checkout_url}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full block text-center rounded bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg hover:bg-emerald-500 transition-all"
                        >
                          Pay ${resultData.stripeInvoice.deposit_amount} Deposit via Stripe Checkout →
                        </a>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-amber-800/40 bg-amber-950/20 p-5 text-xs text-amber-200">
                        <p className="font-bold">Automated invoice withheld.</p>
                        <p className="mt-1 text-slate-300">
                          Because this project was escalated to human review, deposit billing will be sent manually after an owner or principal partner conducts a scope review.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: Execution JSON Logs */}
                {activeTab === 'json' && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-400">
                      Structured audit trace logs persisted to system log storage:
                    </p>
                    <div className="rounded-lg border border-slate-800 bg-[#060911] p-3 max-h-60 overflow-y-auto font-mono text-[11px] text-slate-300">
                      <pre>{JSON.stringify(resultData, null, 2)}</pre>
                    </div>
                  </div>
                )}

                <div className="flex justify-between border-t border-slate-800 pt-4">
                  <button
                    onClick={() => setStep('form')}
                    className="rounded border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                  >
                    ← Test Another Inquiry
                  </button>
                  <button
                    onClick={onClose}
                    className="rounded bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
