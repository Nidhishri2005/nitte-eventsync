import React, { useState } from 'react';
import { 
  Calendar, 
  Bell, 
  PlusCircle, 
  Menu, 
  X, 
  ChevronDown, 
  LogOut,
  Building,
  User,
  CheckCircle2
} from 'lucide-react';
import { db } from '../../services/db';
import { Profile } from '../../types';

interface HeaderProps {
  currentUser?: Profile | null;
  currentProfile?: Profile | null;
  onOpenBookModal: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  currentUser,
  currentProfile: currentProfileProp,
  onOpenBookModal, 
  onToggleSidebar, 
  isSidebarOpen,
  onLogout 
}) => {
  const currentProfile = currentProfileProp || currentUser || db.getCurrentProfile();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const bookings = db.getBookings();
  const userBookings = bookings.filter(b => 
    (b.organizer_id === currentProfile?.id || (b.organizer_email || '').toLowerCase() === (currentProfile?.email || '').toLowerCase()) &&
    b.status === 'Confirmed'
  );

  const isNitte = currentProfile?.email?.toLowerCase().endsWith('@nitte.edu') || 
                  currentProfile?.institution_id === '22222222-2222-2222-2222-222222222222';

  const userDisplayName = currentProfile?.full_name || currentProfile?.name || 'Campus Member';
  const userEmail = currentProfile?.email || '';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          
          {/* Left: Mobile Toggle & Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
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
                    <span className="hidden sm:inline">Nitte </span>EventSync
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

          {/* Center: Campus Affiliation Badges */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-100/90 p-1 rounded-xl border border-slate-200 text-xs">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
              !isNitte 
                ? 'bg-white text-blue-950 shadow-xs font-semibold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}>
              <span className="w-2 h-2 rounded-full bg-blue-900"></span>
              <span>NMAMIT (nmamit.in)</span>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
              isNitte 
                ? 'bg-white text-teal-900 shadow-xs font-semibold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}>
              <span className="w-2 h-2 rounded-full bg-teal-600"></span>
              <span>Nitte University (nitte.edu)</span>
            </div>
          </div>

          {/* Right: Book Venue CTA, Notifications, User Profile & Logout */}
          <div className="flex items-center gap-2.5 shrink-0">
            
            {/* Direct Book Venue CTA Button */}
            <button
              onClick={onOpenBookModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-900 to-teal-700 hover:from-blue-950 hover:to-teal-800 rounded-xl shadow-xs hover:shadow transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Book Venue</span>
            </button>

            {/* Confirmed Reservations Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="My Reservations"
              >
                <Bell className="w-5 h-5" />
                {userBookings.length > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-teal-600 rounded-full">
                    {userBookings.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800">
                      My Confirmed Reservations
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      {userBookings.length} Active
                    </span>
                  </div>
                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                    {userBookings.slice(0, 5).map(b => (
                      <div key={b.id} className="p-3 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-slate-900 line-clamp-1">{b.event_title}</p>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            Confirmed
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{b.event_date} &bull; {b.start_time} - {b.end_time}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{b.venue_name}</p>
                      </div>
                    ))}
                    {userBookings.length === 0 && (
                      <div className="p-4 text-center text-xs text-slate-500">
                        No active reservations yet. Click &quot;Book Venue&quot; to reserve.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Authenticated User Profile & Logout */}
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all text-left cursor-pointer"
                title="Your Account"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  <User className="w-4 h-4 text-teal-400" />
                </div>
                <div className="hidden sm:block text-left max-w-[140px]">
                  <p className="text-xs font-bold text-slate-800 truncate">{userDisplayName}</p>
                  <p className="text-[10px] text-slate-500 truncate">{userEmail}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-100">
                  
                  {/* User Profile Header Card */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center text-sm font-bold shrink-0">
                        <User className="w-5 h-5 text-teal-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate">{userDisplayName}</p>
                        <p className="text-[11px] text-slate-500 truncate">{userEmail}</p>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>{isNitte ? 'Nitte University' : 'NMAMIT Campus'}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full font-bold text-[9px] bg-teal-100 text-teal-800">
                        {isNitte ? 'nitte.edu' : 'nmamit.in'}
                      </span>
                    </div>
                  </div>

                  {/* Department & Campus Info */}
                  <div className="px-2 py-2 text-[11px] text-slate-500 space-y-1">
                    <p><strong className="text-slate-700">Department:</strong> {currentProfile?.department || 'Engineering & Sciences'}</p>
                    <p><strong className="text-slate-700">Campus:</strong> {isNitte ? 'Derlakatte Campus' : 'Nitte Campus'}</p>
                  </div>

                  {/* Logout Button */}
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setShowProfileDropdown(false);
                        onLogout?.();
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 font-bold text-xs transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>

                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};
