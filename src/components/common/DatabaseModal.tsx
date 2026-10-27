import React, { useState } from 'react';
import { 
  Database, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Upload, 
  RotateCcw, 
  ExternalLink, 
  Server, 
  Layers, 
  Key, 
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { storage } from '../../services/storage';
import { getStoredSupabaseConfig, saveStoredSupabaseConfig, testSupabaseConnection } from '../../lib/supabase';

interface DatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseModal: React.FC<DatabaseModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const config = getStoredSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(config.url);
  const [supabaseKey, setSupabaseKey] = useState(config.key);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [copiedSQL, setCopiedSQL] = useState(false);

  const stats = storage.getStats();
  const venues = storage.getVenues();
  const bookings = storage.getBookings();
  const users = storage.getUsers();

  const handleTestConnection = async () => {
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter both Supabase URL and Anon Key.' });
      return;
    }

    setIsTesting(true);
    setStatusMessage({ type: 'info', text: 'Connecting to Supabase cloud instance...' });

    const res = await testSupabaseConnection(supabaseUrl, supabaseKey);
    setIsTesting(false);

    if (res.success) {
      saveStoredSupabaseConfig(supabaseUrl, supabaseKey);
      setStatusMessage({ type: 'success', text: res.message });
    } else {
      setStatusMessage({ type: 'error', text: `Connection Error: ${res.message}` });
    }
  };

  const handleDisconnect = () => {
    saveStoredSupabaseConfig('', '');
    setSupabaseUrl('');
    setSupabaseKey('');
    setStatusMessage({ type: 'info', text: 'Disconnected from cloud Supabase. Running in permanent browser database mode.' });
  };

  const handleExportBackup = () => {
    const data = storage.exportDatabase();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Nitte_EventSync_Database_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySQLNotice = () => {
    setCopiedSQL(true);
    setTimeout(() => setCopiedSQL(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Database &amp; Storage Architecture</h3>
              <p className="text-xs text-slate-300">PostgreSQL (Supabase) + Local Persistent Storage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6 text-xs">

          {/* Database Status Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200/80 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-teal-950">Active Database Storage Engine</h4>
              <p className="text-slate-600 mt-1 leading-relaxed">
                All data is <strong>permanently stored and persisted</strong> in your database storage. Bookings, official NMAMIT venues, approvals, and double-booking conflict records remain intact across page reloads and browser sessions.
              </p>
            </div>
          </div>

          {/* Database Tables Overview */}
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-900" />
              Database Tables &amp; Row Counts
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">Table: venues</span>
                <p className="text-lg font-black text-slate-900 mt-0.5">{venues.length} Venues</p>
                <p className="text-[10px] text-teal-700 font-semibold">5 Official NMAMIT</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">Table: bookings</span>
                <p className="text-lg font-black text-slate-900 mt-0.5">{bookings.length} Bookings</p>
                <p className="text-[10px] text-blue-900 font-semibold">{stats.approvedCount} Confirmed</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">Table: users</span>
                <p className="text-lg font-black text-slate-900 mt-0.5">{users.length} Users</p>
                <p className="text-[10px] text-slate-500 font-semibold">Student / Faculty / Admin</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">Table: institutions</span>
                <p className="text-lg font-black text-slate-900 mt-0.5">2 Campuses</p>
                <p className="text-[10px] text-slate-500 font-semibold">NMAMIT &bull; Nitte DU</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">Table: events</span>
                <p className="text-lg font-black text-slate-900 mt-0.5">{stats.approvedCount} Events</p>
                <p className="text-[10px] text-slate-500 font-semibold">Public Calendar</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">Table: booking_approvals</span>
                <p className="text-lg font-black text-slate-900 mt-0.5">{bookings.filter(b => b.approvedBy).length} Records</p>
                <p className="text-[10px] text-emerald-700 font-semibold">Approval History</p>
              </div>
            </div>
          </div>

          {/* Cloud Supabase Sync Configuration */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-teal-600" />
                  Connect Cloud Supabase (PostgreSQL)
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Sync your data in real-time with an external hosted Supabase project.
                </p>
              </div>

              {config.isConfigured && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Cloud Connected
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  placeholder="https://xyzproject.supabase.co"
                  value={supabaseUrl}
                  onChange={e => setSupabaseUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-900 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Supabase Anon Public API Key
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseKey}
                  onChange={e => setSupabaseKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-900 text-xs font-mono"
                />
              </div>

              {statusMessage && (
                <div className={`p-3 rounded-xl text-xs font-semibold ${
                  statusMessage.type === 'success' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                  statusMessage.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
                  'bg-blue-100 text-blue-800 border border-blue-200'
                }`}>
                  {statusMessage.text}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  disabled={isTesting}
                  onClick={handleTestConnection}
                  className="px-4 py-2 rounded-xl font-bold text-white bg-blue-900 hover:bg-blue-950 disabled:bg-slate-300 transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Testing...' : 'Test Connection &amp; Save'}</span>
                </button>

                {config.isConfigured && (
                  <button
                    onClick={handleDisconnect}
                    className="px-3.5 py-2 rounded-xl font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    Disconnect
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Backup & Schema Export Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={handleExportBackup}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Full Database Dump (.json)</span>
            </button>

            <button
              onClick={() => {
                storage.resetToDefault();
                setStatusMessage({ type: 'info', text: 'Database reset to default official NMAMIT seed venues & bookings.' });
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold text-red-700 hover:bg-red-50 border border-red-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Database to Defaults</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
