import React from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  DoorOpen, 
  BookmarkCheck, 
  Sparkles, 
  CheckCircle2
} from 'lucide-react';
import { Profile } from '../../types';
import { db } from '../../services/db';

export type ActiveTab = 'dashboard' | 'calendar' | 'book' | 'my-bookings' | 'events';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  currentProfile?: Profile;
  currentUser?: Profile;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  currentProfile: currentProfileProp,
  currentUser,
  isOpen,
  onClose,
}) => {
  const currentProfile = currentProfileProp || currentUser || db.getCurrentProfile();
  const bookings = db.getBookings();
  const confirmedBookings = bookings.filter(b => b.status === 'Confirmed' || b.status === 'Approved');
  const myConfirmedCount = confirmedBookings.filter(b => 
    (b.organizer_id === currentProfile?.id || (b.organizer_email || '').toLowerCase() === (currentProfile?.email || '').toLowerCase())
  ).length;

  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Campus overview & stats',
    },
    {
      id: 'calendar' as ActiveTab,
      label: 'Common Calendar',
      icon: CalendarDays,
      description: 'Unified cross-campus schedule',
      badge: `${confirmedBookings.length} Events`,
    },
    {
      id: 'book' as ActiveTab,
      label: 'Browse Venues',
      icon: DoorOpen,
      description: 'Auditoriums & availability',
    },
    {
      id: 'my-bookings' as ActiveTab,
      label: 'My Bookings',
      icon: BookmarkCheck,
      description: 'View & manage your reservations',
      badge: myConfirmedCount > 0 ? `${myConfirmedCount} Active` : undefined,
      badgeColor: 'bg-teal-100 text-teal-800 font-semibold',
    },
    {
      id: 'events' as ActiveTab,
      label: 'Events Directory',
      icon: Sparkles,
      description: 'Public campus events',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white border-r border-slate-200/90
        flex flex-col justify-between p-4 z-40 transition-transform duration-200 ease-in-out shrink-0
        ${isOpen ? 'translate-x-0 shadow-2xl lg:shadow-none' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="space-y-6">
          
          {/* Quick Notice Pill */}
          <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-50/70 to-teal-50/70 border border-teal-200/50">
            <div className="flex items-center gap-2 text-teal-900 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Direct Venue Booking</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1 leading-snug">
              Instant reservation with zero double-booking conflict check.
            </p>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1.5" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onClose?.();
                  }}
                  className={`
                    w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all group cursor-pointer
                    ${isActive 
                      ? 'bg-blue-950 text-white shadow-xs font-semibold' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                    }
                  `}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`
                      p-1.5 rounded-lg transition-colors
                      ${isActive ? 'bg-white/10 text-teal-300' : 'text-slate-500 group-hover:text-blue-900'}
                    `}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate leading-tight">{item.label}</p>
                      <p className={`text-[10px] truncate ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {item.badge && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 font-bold ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : (item.badgeColor || 'bg-slate-100 text-slate-600')
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

        </div>

        {/* Footer Campus Info */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
            Participating Campuses
          </p>

          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-900 shrink-0"></span>
              <div className="min-w-0">
                <p className="font-bold text-slate-900 text-[11px] truncate">NMAMIT</p>
                <p className="text-[10px] text-slate-400 truncate">nmamit.in &bull; Nitte</p>
              </div>
            </div>

            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0"></span>
              <div className="min-w-0">
                <p className="font-bold text-slate-900 text-[11px] truncate">Nitte University</p>
                <p className="text-[10px] text-slate-400 truncate">nitte.edu &bull; Deralakatte</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
