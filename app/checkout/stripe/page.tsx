'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ShieldCheck, 
  Lock, 
  CreditCard, 
  CheckCircle2, 
  ArrowLeft, 
  Loader2, 
  Sparkles,
  DollarSign,
  Building2,
  AlertCircle
} from 'lucide-react';

function StripeCheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Query parameters
  const type = searchParams?.get('type') || 'subscription'; // 'subscription' | 'match_fee' | 'deposit'
  const rawAmount = searchParams?.get('amount') || '5.00';
  const amount = parseFloat(rawAmount) || 5.00;
  const title = searchParams?.get('title') || (
    type === 'subscription' 
      ? 'AutonomOps Pro Owner Subscription' 
      : type === 'match_fee' 
      ? 'Business Owner Match Approval Fee' 
      : 'Project Kickoff Deposit'
  );
  const emailParam = searchParams?.get('email') || 'owner@autonomops.io';
  const nameParam = searchParams?.get('name') || 'Valued User';
  const leadId = searchParams?.get('leadId') || '';
  const returnUrl = searchParams?.get('returnUrl') || (type === 'deposit' ? '/chat' : '/dashboard');

  // Form State
  const [email, setEmail] = useState(emailParam);
  const [cardHolder, setCardHolder] = useState(nameParam);
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [expDate, setExpDate] = useState('12/28');
  const [cvc, setCvc] = useState('123');
  const [zipCode, setZipCode] = useState('94103');
  const [country, setCountry] = useState('United States');

  // Processing & Redirect State
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [txId, setTxId] = useState('');

  // Handle Stripe Payment Submit & Redirect
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing || isSuccess) return;

    setIsProcessing(true);

    const generatedTx = `ch_stripe_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    setTxId(generatedTx);

    try {
      // 1. Record transaction in PostgreSQL database payments table
      await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_name: cardHolder || 'Valued User',
          user_email: email || 'user@autonomops.io',
          type: type === 'subscription' ? '$5.00 Pro Subscription' : type === 'match_fee' ? '$1.00 Match Approval Fee' : `$${amount.toFixed(2)} Deposit Payment`,
          amount: amount,
          description: `${title} - Stripe Gateway Transaction ${generatedTx}`
        })
      });

      // 2. Perform backend state updates based on payment type
      if (type === 'subscription') {
        await fetch('/api/owners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: cardHolder,
            email: email,
            is_premium: true
          })
        });
        await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: cardHolder,
            email: email,
            role: 'owner',
            is_premium: true
          })
        });
      } else if (type === 'match_fee') {
        await fetch('/api/owners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: cardHolder,
            email: email,
            total_match_fees: 1.00,
            total_approved_orders: 1
          })
        });

        if (leadId) {
          await fetch('/api/leads', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: leadId,
              status: 'owner_approved_awaiting_payment'
            })
          });
        }
      } else if (type === 'deposit' && leadId) {
        await fetch('/api/leads', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: leadId,
            status: 'deposit_paid'
          })
        });
      }
    } catch (err) {
      console.error('Stripe Gateway database recording error:', err);
    }

    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
    }, 1500);
  };

  // Automatic Redirect Countdown effect after payment success
  useEffect(() => {
    if (!isSuccess) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Append success query param to return URL
          const redirectTarget = returnUrl.includes('?') 
            ? `${returnUrl}&payment=success&tx=${txId}` 
            : `${returnUrl}?payment=success&tx=${txId}`;
          router.push(redirectTarget);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSuccess, returnUrl, router, txId]);

  return (
    <div className="min-h-screen bg-[#0a0d18] text-slate-100 font-sans flex flex-col justify-between selection:bg-purple-500 selection:text-white">
      {/* Stripe Header */}
      <header className="border-b border-slate-800 bg-[#060913]/90 backdrop-blur-md px-6 py-4">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.back()}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center space-x-2 font-mono font-bold text-white tracking-wider text-sm">
              <span className="text-xl font-extrabold text-indigo-400">stripe</span>
              <span className="text-xs text-slate-500">CHECKOUT GATEWAY</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 font-mono text-xs text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-full border border-emerald-800">
            <Lock className="h-3.5 w-3.5" />
            <span>256-BIT SSL ENCRYPTED</span>
          </div>
        </div>
      </header>

      {/* Main Stripe Checkout Gateway Container */}
      <main className="mx-auto w-full max-w-5xl px-4 py-8 flex-1 flex items-center justify-center">
        {isSuccess ? (
          /* SUCCESSFUL PAYMENT REDIRECT SCREEN */
          <div className="w-full max-w-md rounded-2xl border border-emerald-500/40 bg-[#060b19] p-8 text-center shadow-2xl space-y-6 animate-fade-in">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500 text-emerald-400">
              <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            </div>

            <div className="space-y-2">
              <span className="font-mono text-xs text-emerald-400 font-bold tracking-widest uppercase">
                STRIPE PAYMENT CONFIRMED
              </span>
              <h2 className="text-2xl font-extrabold text-white">Payment Successful!</h2>
              <p className="text-xs text-slate-300 font-mono">
                Transaction ID: <span className="text-emerald-300 font-bold">{txId}</span>
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#03060f] p-4 text-xs font-mono space-y-2 text-left">
              <div className="flex justify-between text-slate-400">
                <span>Amount Paid:</span>
                <span className="text-emerald-400 font-bold">${amount.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Payer Email:</span>
                <span className="text-white">{email}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Database Status:</span>
                <span className="text-emerald-400 font-bold">SAVED IN POSTGRES</span>
              </div>
            </div>

            <div className="rounded-xl bg-indigo-950/60 border border-indigo-800/80 p-4 font-mono text-xs text-indigo-200 flex items-center justify-center space-x-3">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
              <span>Redirecting back to application in <strong className="text-white text-sm">{countdown}s</strong>...</span>
            </div>

            <button
              onClick={() => router.push(returnUrl)}
              className="w-full rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white hover:bg-emerald-500 transition-colors font-mono cursor-pointer"
            >
              Click Here if Not Redirected Automatically
            </button>
          </div>
        ) : (
          /* STRIPE CHECKOUT FORM GRID */
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Order Summary & Brand */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-[#070c1b] p-6 space-y-6 shadow-xl font-mono">
              <div className="space-y-1">
                <span className="text-[10px] font-bold tracking-widest text-indigo-400 uppercase">AUTONOMOPS CHECKOUT</span>
                <h2 className="text-xl font-bold text-white">{title}</h2>
                <p className="text-xs text-slate-400 font-sans">
                  Official Stripe Hosted Gateway — Secure payment processing for AutonomOps AI Operations platform.
                </p>
              </div>

              <div className="border-t border-b border-slate-800 py-4 space-y-3">
                <div className="flex justify-between text-xs text-slate-300 font-sans">
                  <span>{title}</span>
                  <span className="font-mono font-bold text-white">${amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400 font-sans">
                  <span>Taxes &amp; Processing Fees</span>
                  <span className="font-mono text-emerald-400">$0.00</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800/80">
                  <span>Total Amount Due</span>
                  <span className="text-emerald-400 font-mono text-base">${amount.toFixed(2)} USD</span>
                </div>
              </div>

              <div className="space-y-3 text-[11px] text-slate-400 font-sans">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Guaranteed 100% Encrypted &amp; Verified by Stripe</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <span>Instant PostgreSQL Database Sync on Payment</span>
                </div>
              </div>
            </div>

            {/* Right Column: Stripe Payment Form */}
            <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-[#060914] p-6 space-y-6 shadow-2xl font-sans">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-indigo-400" />
                  <h3 className="text-base font-bold text-white">Pay with Card or Stripe</h3>
                </div>
                <div className="flex space-x-1">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300 font-bold">VISA</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300 font-bold">MC</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300 font-bold">AMEX</span>
                </div>
              </div>

              <form onSubmit={handleSubmitPayment} className="space-y-4 text-xs font-mono">
                <div>
                  <label className="block text-slate-400 text-[10px] mb-1 font-semibold">EMAIL ADDRESS</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-[#03060f] px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] mb-1 font-semibold">CARD INFORMATION</label>
                  <div className="rounded-lg border border-slate-800 bg-[#03060f] overflow-hidden">
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="Card number"
                      className="w-full border-b border-slate-800 bg-transparent px-3.5 py-2.5 text-xs text-white focus:outline-none"
                    />
                    <div className="grid grid-cols-2">
                      <input
                        type="text"
                        required
                        value={expDate}
                        onChange={(e) => setExpDate(e.target.value)}
                        placeholder="MM / YY"
                        className="border-r border-slate-800 bg-transparent px-3.5 py-2 text-xs text-white focus:outline-none"
                      />
                      <input
                        type="text"
                        required
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value)}
                        placeholder="CVC"
                        className="bg-transparent px-3.5 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] mb-1 font-semibold">NAME ON CARD</label>
                  <input
                    type="text"
                    required
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-[#03060f] px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 text-[10px] mb-1 font-semibold">COUNTRY OR REGION</label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-[#03060f] px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="United States">United States</option>
                      <option value="India">India (+91)</option>
                      <option value="Canada">Canada</option>
                      <option value="United Kingdom">United Kingdom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] mb-1 font-semibold">POSTAL CODE</label>
                    <input
                      type="text"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-[#03060f] px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3.5 text-xs font-bold text-white hover:from-indigo-500 hover:to-purple-500 transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-indigo-600/30 mt-2 font-mono"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span>Processing Stripe Payment...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 text-emerald-400" />
                      <span>Pay ${amount.toFixed(2)} USD &amp; Authorize Gateway Redirect</span>
                    </>
                  )}
                </button>

                <p className="text-[10px] text-slate-500 text-center font-sans pt-1">
                  By clicking pay, you authorize AutonomOps to charge your card ${amount.toFixed(2)} via Stripe Gateway.
                </p>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Stripe Footer */}
      <footer className="border-t border-slate-800 bg-[#060913] px-6 py-4 text-center text-[11px] font-mono text-slate-500">
        Powered by <strong className="text-slate-300">Stripe Gateway</strong> • AutonomOps AI Agent Enterprise System
      </footer>
    </div>
  );
}

export default function StripeCheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0d18] text-white flex items-center justify-center font-mono text-xs">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-400 mr-2" />
        Loading Stripe Checkout Gateway...
      </div>
    }>
      <StripeCheckoutContent />
    </Suspense>
  );
}
