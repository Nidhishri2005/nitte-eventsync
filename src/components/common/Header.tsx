import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Menu, 
  PlusCircle, 
  User, 
  LogOut, 
  ChevronDown, 
  Bell, 
  CheckCircle2, 
  Building
} from 'lucide-react';
import { Profile, Booking } from '../../types';
import { db, getUserDisplayName } from '../../services/db';

interface HeaderProps {
  currentUser?: Profile | null;
  onOpenBookModal: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser: propUser,
  onOpenBookModal,
  onToggleSidebar,
  isSidebarOpen,
  onLogout,
}) => {
  const currentProfile = propUser || db.getCurrentProfile();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userBookings, setUserBookings] = useState<Booking[]>([]);

  // Subscribe to reactive database updates
  useEffect(() => {
    const updateReservations = () => {
      const all = db.getBookings();
      if (!currentProfile) {
        setUserBookings([]);
        return;
      }
      const myActive = all.filter(b => {
        const matchOwner = (b.organizer_id === currentProfile.id || b.userId === currentProfile.id) ||
                           (b.organizer_email?.toLowerCase() === currentProfile.email?.toLowerCase());
        const isConfirmed = b.status === 'Confirmed' || b.status === 'Approved';
        return matchOwner && isConfirmed;
      });
      setUserBookings(myActive);
    };

    updateReservations();
    const unsubscribe = db.subscribe(updateReservations);
    return () => unsubscribe();
  }, [currentProfile]);

  const userDisplayName = getUserDisplayName(currentProfile);
  const userEmail = currentProfile?.email || 'student@nitte.edu';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Left: Mobile Sidebar Trigger + Logo Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden transition-colors cursor-pointer"
              aria-label="Toggle navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-950 via-blue-900 to-teal-700 text-white flex items-center justify-center shadow-xs">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">
                    <span className="hidden sm:inline">Nitte </span>EventSync
                  </span>
                  <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200/80">
                    Unified Portal
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                  Nitte (Deemed to be University)
                </p>
              </div>
            </div>
          </div>

          {/* Center: Campus Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-xs font-semibold text-teal-900">
            <span className="w-2 h-2 rounded-full bg-teal-600"></span>
            <span>Nitte University (nitte.edu)</span>
          </div>

          {/* Right: Book Venue, Notifications, User Profile */}
          <div className="flex items-center gap-2 shrink-0">
            
            {/* Book Venue CTA */}
            <button
              onClick={onOpenBookModal}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-900 to-teal-700 hover:from-blue-950 hover:to-teal-800 rounded-xl shadow-xs hover:shadow transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Book Venue</span>
            </button>

            {/* Notifications (Confirmed Reservations) */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Your Confirmed Reservations"
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
                    <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-full">
                      {userBookings.length} Active
                    </span>
                  </div>
                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                    {userBookings.slice(0, 5).map(b => (
                      <div key={b.id} className="p-3 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-bold text-slate-900 line-clamp-1">{b.event_title || b.eventTitle}</p>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1 shrink-0">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Confirmed
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{b.event_date || b.date} &bull; {(b.start_time || b.startTime || '').slice(0, 5)} - {(b.end_time || b.endTime || '').slice(0, 5)}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{b.venue_name || b.venueName}</p>
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
                        <span>Nitte University</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full font-bold text-[9px] bg-teal-100 text-teal-800">
                        nitte.edu
                      </span>
                    </div>
                  </div>

                  {/* Department & Campus Info */}
                  <div className="px-2 py-2 text-[11px] text-slate-500 space-y-1">
                    <p><strong className="text-slate-700">Department:</strong> {currentProfile?.department || 'Nitte University'}</p>
                    <p><strong className="text-slate-700">Campus:</strong> Nitte University</p>
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
