import React, { useState } from 'react';
import { 
  Calendar, 
  UserCheck, 
  Bell, 
  PlusCircle, 
  Menu, 
  X, 
  ChevronDown, 
  ShieldCheck,
  GraduationCap,
  Database
} from 'lucide-react';
import { db } from '../../services/db';
import { Profile } from '../../types';
import { getSupabaseCredentials } from '../../lib/supabase';
import { DatabaseModal } from './DatabaseModal';

interface HeaderProps {
  currentProfile?: Profile;
  currentUser?: Profile;
  onOpenBookModal: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  currentProfile: currentProfileProp,
  currentUser, 
  onOpenBookModal, 
  onToggleSidebar, 
  isSidebarOpen 
}) => {
  const profile = currentProfileProp || currentUser || db.getCurrentProfile();
  const currentProfile = profile;
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDatabaseModal, setShowDatabaseModal] = useState(false);

  const profiles = db.getProfiles();
  const bookings = db.getBookings();
  const pendingCount = bookings.filter(b => b.status === 'Pending').length;
  const { isConfigured } = getSupabaseCredentials();

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2">
            
            {/* Left: Mobile Toggle & Brand */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={onToggleSidebar}
                className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                aria-label="Toggle menu"
              >
                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-950 via-blue-900 to-teal-700 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">
                      Nitte EventSync
                    </span>
                    <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200/80">
                      Unified Portal
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                    NMAMIT &bull; Nitte University
                  </p>
                </div>
              </div>
            </div>

            {/* Center: Campus Filter Tags */}
            <div className="hidden lg:flex items-center gap-2 bg-slate-100/90 p-1 rounded-xl border border-slate-200 text-xs">
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
                currentProfile.institution_id === '11111111-1111-1111-1111-111111111111' 
                  ? 'bg-white text-blue-950 shadow-xs font-semibold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}>
                <span className="w-2 h-2 rounded-full bg-blue-900"></span>
                <span>NMAMIT (nmamit.in)</span>
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
                currentProfile.institution_id === '22222222-2222-2222-2222-222222222222' 
                  ? 'bg-white text-teal-900 shadow-xs font-semibold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}>
                <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                <span>Nitte University (nitte.edu)</span>
              </div>
            </div>

            {/* Right: Database Pill, Book Button, Persona Switcher */}
            <div className="flex items-center gap-2 shrink-0">
              
              {/* Database Connection Pill */}
              <button
                onClick={() => setShowDatabaseModal(true)}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all text-slate-700 hover:bg-slate-100 bg-white border-slate-200 shadow-2xs"
                title="Database Status & Configuration"
              >
                <Database className="w-3.5 h-3.5 text-teal-600" />
                <span className="hidden md:inline">Database</span>
                <span className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
              </button>

              {/* Book Venue CTA */}
              <button
                onClick={onOpenBookModal}
                className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-900 to-teal-700 hover:from-blue-950 hover:to-teal-800 rounded-xl shadow-xs hover:shadow transition-all transform hover:-translate-y-0.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Book Venue</span>
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {pendingCount > 0 && (
                    <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-amber-500 rounded-full animate-pulse">
                      {pendingCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800">Pending Approvals</span>
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                        {pendingCount} Pending
                      </span>
                    </div>
                    <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                      {bookings.filter(b => b.status === 'Pending').slice(0, 4).map(b => (
                        <div key={b.id} className="p-3 hover:bg-slate-50 transition-colors">
                          <p className="text-xs font-bold text-slate-900 line-clamp-1">{b.event_title}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{b.event_date} &bull; {b.start_time} - {b.end_time}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">By {b.organizer_name} ({b.department})</p>
                        </div>
                      ))}
                      {pendingCount === 0 && (
                        <div className="p-4 text-center text-xs text-slate-500">
                          All approvals up to date!
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Persona Switcher Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                  className="flex items-center gap-1.5 p-1 sm:p-1.5 sm:pl-2 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {currentProfile.role === 'admin' ? (
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                    ) : currentProfile.role === 'faculty' ? (
                      <UserCheck className="w-4 h-4 text-teal-400" />
                    ) : (
                      <GraduationCap className="w-4 h-4 text-blue-300" />
                    )}
                  </div>
                  <div className="hidden xl:block text-left">
                    <p className="text-xs font-bold text-slate-800 line-clamp-1">{currentProfile.full_name}</p>
                    <p className="text-[10px] text-slate-500 font-medium uppercase">{currentProfile.role}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>

                {showRoleDropdown && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Switch Testing Persona</p>
                      <p className="text-xs text-slate-600 mt-0.5">Switch role to test student vs approver views</p>
                    </div>
                    <div className="space-y-1">
                      {profiles.map(p => (
                        <button
                          key={p.id}
                          onClick={() => {
                            db.setCurrentProfile(p.id);
                            setShowRoleDropdown(false);
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors text-xs ${
                            p.id === currentProfile.id 
                              ? 'bg-blue-50 text-blue-950 font-bold border border-blue-200' 
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="truncate mr-2">
                            <p className="font-semibold text-slate-900 truncate">{p.full_name}</p>
                            <p className="text-[10px] text-slate-500 truncate">{p.email}</p>
                          </div>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase shrink-0 ${
                            p.role === 'admin' ? 'bg-amber-100 text-amber-800' :
                            p.role === 'faculty' ? 'bg-teal-100 text-teal-800' :
                            'bg-blue-100 text-blue-900'
                          }`}>
                            {p.role}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </header>

      {/* Database Setup & Inspection Modal */}
      <DatabaseModal
        isOpen={showDatabaseModal}
        onClose={() => setShowDatabaseModal(false)}
      />
    </>
  );
};
