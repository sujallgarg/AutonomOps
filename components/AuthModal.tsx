'use client';

import React, { useState } from 'react';
import { ShieldCheck, UserCheck, Key, Lock, Mail, ArrowRight, X, Sparkles, CheckCircle2, User, AlertCircle } from 'lucide-react';
import { setStoredSession, UserSession, verifyAccountCredentials, saveRegisteredAccount } from '@/lib/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (role: 'owner' | 'client', email: string) => void;
}

export function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const [role, setRole] = useState<'owner' | 'client'>('client');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleRoleToggle = (selectedRole: 'owner' | 'client') => {
    setRole(selectedRole);
    setError('');
    setSuccessMsg('');
  };

  const validateForm = (): boolean => {
    if (!name.trim() || name.trim().length < 2) {
      setError('❌ Validation Error: Full Name must be at least 2 characters.');
      return false;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setError('❌ Validation Error: Invalid email address format (e.g. name@company.com).');
      return false;
    }

    if (!password || password.length < 6) {
      setError('❌ Validation Error: Password must be at least 6 characters long.');
      return false;
    }

    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!validateForm()) return;

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    // Check registered account credentials for existing users
    const verification = verifyAccountCredentials(trimmedEmail, password);
    if (!verification.valid) {
      setError(`❌ Authentication Failed: ${verification.error || 'Incorrect email or password entered.'}`);
      return; // STOP! DO NOT LOG IN
    }

    // Save or update account credentials
    saveRegisteredAccount(trimmedName, trimmedEmail, password, role);

    const session: UserSession = { name: trimmedName, email: trimmedEmail, role };
    setStoredSession(session);

    try {
      // Record login details & free trial status in PostgreSQL Database
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName, email: trimmedEmail, role, is_premium: false })
      });

      if (role === 'owner') {
        await fetch('/api/owners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: trimmedName, email: trimmedEmail, is_premium: false })
        });
      }
    } catch (err) {
      console.error('Error saving user/owner login to database:', err);
    }

    setSuccessMsg(`✅ Welcome back ${trimmedName}! Authenticated as ${role === 'owner' ? 'Business Owner' : 'Client'}. Redirecting...`);
    setTimeout(() => {
      onLoginSuccess(role, trimmedEmail);
      onClose();
      if (role === 'owner') {
        window.location.href = '/dashboard';
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-md font-sans">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-[#090d18] p-6 shadow-2xl space-y-5 text-slate-100 font-sans">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2 font-mono text-xs text-blue-400">
            <Sparkles className="h-4 w-4" />
            <span className="tracking-widest uppercase font-semibold">AUTHENTICATION PORTAL</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Sign In to Your Account</h2>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#03060f] p-1.5 border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => handleRoleToggle('client')}
            className={`flex items-center justify-center space-x-2 rounded-lg py-2.5 font-semibold transition-all cursor-pointer ${
              role === 'client'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="h-4 w-4" />
            <span>User / Client</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleToggle('owner')}
            className={`flex items-center justify-center space-x-2 rounded-lg py-2.5 font-semibold transition-all cursor-pointer ${
              role === 'owner'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Business Owner</span>
          </button>
        </div>



        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-3 text-xs">
          {error && (
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-2.5 text-rose-400 text-xs font-mono flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-emerald-400 text-xs font-mono flex items-center space-x-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="block font-mono text-[10px] uppercase text-slate-400 font-semibold">Full Name*</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Rivera"
                className="w-full rounded-lg border border-slate-800 bg-[#03060f] pl-9 pr-4 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block font-mono text-[10px] uppercase text-slate-400 font-semibold">Email Address*</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full rounded-lg border border-slate-800 bg-[#03060f] pl-9 pr-4 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block font-mono text-[10px] uppercase text-slate-400 font-semibold">Password* (min 6 chars)</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-800 bg-[#03060f] pl-9 pr-4 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 py-3 text-xs font-bold text-white hover:bg-blue-500 transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-blue-600/20 font-mono"
          >
            <span>Sign In as {role === 'owner' ? 'Business Owner' : 'Client User'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
