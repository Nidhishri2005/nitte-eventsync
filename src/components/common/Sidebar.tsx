import React from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  DoorOpen, 
  BookmarkCheck, 
  Sparkles, 
  ShieldCheck, 
  GraduationCap,
  CheckCircle2
} from 'lucide-react';
import { Profile } from '../../types';
import { db } from '../../services/db';

export type ActiveTab = 'dashboard' | 'calendar' | 'book' | 'my-bookings' | 'events' | 'admin';

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
  const pendingCount = bookings.filter(b => b.status === 'Pending').length;
  const myPendingCount = bookings.filter(b => b.organizer_id === currentProfile.id && b.status === 'Pending').length;

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
      badge: `${bookings.filter(b => b.status === 'Approved').length} Active`,
    },
    {
      id: 'book' as ActiveTab,
      label: 'Book a Venue',
      icon: DoorOpen,
      description: 'Browse venues & reserve',
    },
    {
      id: 'my-bookings' as ActiveTab,
      label: 'My Bookings',
      icon: BookmarkCheck,
      description: 'Track, cancel or modify',
      badge: myPendingCount > 0 ? `${myPendingCount} Pending` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'events' as ActiveTab,
      label: 'Events Directory',
      icon: Sparkles,
      description: 'Public student & faculty events',
    },
    {
      id: 'admin' as ActiveTab,
      label: 'Admin & Approvals',
      icon: ShieldCheck,
      description: 'Review requests & conflicts',
      badge: pendingCount > 0 ? `${pendingCount} Needs Review` : undefined,
      badgeColor: 'bg-red-100 text-red-700 animate-pulse font-bold',
      requiresAdminOrFaculty: true,
    },
  ];

  const handleNavClick = (tab: ActiveTab) => {
    onSelectTab(tab);
    if (onClose) onClose();
  };

  return (
    <>
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-40 w-64 xl:w-72 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:h-[calc(100vh-4rem)]
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        {/* Brand identity on sidebar top */}
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-950 via-blue-900 to-teal-700 text-white flex items-center justify-center shadow-xs shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900 leading-tight">Nitte EventSync</h2>
              <p className="text-[11px] text-slate-500 font-medium">Campus Booking System</p>
            </div>
          </div>

          <div className="mt-4 p-2.5 rounded-xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200/70 flex items-start gap-2 text-xs">
            <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-teal-950 text-[11px]">Zero Double-Booking Engine</p>
              <p className="text-[10px] text-teal-800 leading-tight">Automated conflict prevention across both institutions.</p>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all group ${
                  isActive
                    ? 'bg-blue-950 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                    isActive ? 'bg-white/15 text-teal-400' : 'text-slate-500 group-hover:text-blue-900'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 truncate">
                    <p className={`text-xs truncate ${isActive ? 'text-white font-bold' : 'text-slate-800'}`}>
                      {item.label}
                    </p>
                    <p className={`text-[10px] truncate ${isActive ? 'text-blue-200' : 'text-slate-400'}`}>
                      {item.description}
                    </p>
                  </div>
                </div>

                {item.badge && (
                  <span className={`text-[9px] px-2 py-0.5 rounded-full whitespace-nowrap ml-2 shrink-0 ${
                    isActive ? 'bg-teal-500 text-white font-bold' : (item.badgeColor || 'bg-slate-100 text-slate-700')
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Campus Institution Footer Badges */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60 space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
            Participating Campuses
          </div>

          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200/80 text-xs">
            <span className="w-2 h-2 rounded-full bg-blue-900 shrink-0"></span>
            <div className="min-w-0">
              <p className="font-bold text-slate-900 text-xs truncate">NMAMIT</p>
              <p className="text-[10px] text-slate-500 truncate">nmamit.in &bull; Nitte</p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200/80 text-xs">
            <span className="w-2 h-2 rounded-full bg-teal-600 shrink-0"></span>
            <div className="min-w-0">
              <p className="font-bold text-slate-900 text-xs truncate">Nitte University</p>
              <p className="text-[10px] text-slate-500 truncate">nitte.edu &bull; Deralakatte</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
