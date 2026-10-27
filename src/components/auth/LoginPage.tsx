import React, { useState } from 'react';
import { Calendar, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { storage } from '../../services/storage';
import { Profile } from '../../types';

interface LoginPageProps {
  onLoginSuccess: (user: Profile) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your institutional email address.');
      return;
    }

    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    const lower = trimmedEmail.toLowerCase();
    const isDomainValid = lower.endsWith('@nmamit.in') || lower.endsWith('@nitte.edu');
    if (!isDomainValid) {
      setError('Please use your NMAMIT or Nitte University institutional email address.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await storage.loginDemo(trimmedEmail, password);
      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setError(result.error || 'Authentication failed. Please verify your credentials.');
      }
    } catch {
      setError('An unexpected error occurred during login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-teal-500 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        
        {/* Brand Header */}
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-950 via-blue-900 to-teal-700 text-white flex items-center justify-center shadow-md">
            <Calendar className="w-8 h-8" />
          </div>
        </div>

        <h2 className="mt-4 text-center text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Nitte EventSync
        </h2>
        
        <p className="mt-1 text-center text-xs sm:text-sm text-slate-600 font-medium">
          Unified Event &amp; Venue Booking Portal
        </p>

        {/* Institution Badges */}
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-900 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-900"></span>
            NMAMIT (nmamit.in)
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
            Nitte DU (nitte.edu)
          </span>
        </div>
      </div>

      {/* Login Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-slate-200/90 rounded-2xl sm:rounded-3xl">
          
          <form className="space-y-5" onSubmit={handleSubmit}>
            
            {/* Error Message Alert */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p className="font-medium leading-relaxed">{error}</p>
              </div>
            )}

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
                Institutional Email Address
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="e.g. nidhishri@nmamit.in"
                  className="block w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all placeholder:text-slate-400 font-medium text-slate-900"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Only <code className="text-blue-900 font-semibold">@nmamit.in</code> and <code className="text-teal-700 font-semibold">@nitte.edu</code> institutional emails are authorized.
              </p>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
                Password
              </label>
              <div className="relative rounded-xl shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Enter your password"
                  className="block w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all placeholder:text-slate-400 font-medium text-slate-900"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-950 via-blue-900 to-teal-800 hover:from-blue-900 hover:to-teal-700 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:pointer-events-none cursor-pointer"
            >
              <span>{isLoading ? 'Signing In...' : 'Sign In to EventSync'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Helper */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Demo Login Quick-Fill:</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setEmail('nidhishri@nmamit.in');
                  setPassword('demo123');
                  setError(null);
                }}
                className="p-2 rounded-xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50/50 text-left transition-colors cursor-pointer"
              >
                <p className="font-bold text-slate-900 truncate">nidhishri@nmamit.in</p>
                <p className="text-[10px] text-slate-500">NMAMIT Campus</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail('student@nitte.edu');
                  setPassword('demo123');
                  setError(null);
                }}
                className="p-2 rounded-xl border border-slate-200 hover:border-teal-300 hover:bg-teal-50/50 text-left transition-colors cursor-pointer"
              >
                <p className="font-bold text-slate-900 truncate">student@nitte.edu</p>
                <p className="text-[10px] text-slate-500">Nitte DU Campus</p>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
