import { useState, useEffect } from 'react';
import { storage } from './services/storage';
import type { User, Venue, Booking } from './types';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import type { ActiveTab } from './components/common/Sidebar';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { CommonCalendarPage } from './components/calendar/CommonCalendarPage';
import { BookVenuePage } from './components/venues/BookVenuePage';
import { MyBookingsPage } from './components/my-bookings/MyBookingsPage';
import { EventsDirectoryPage } from './components/events/EventsDirectoryPage';
import { BookVenueModal } from './components/venues/BookVenueModal';
import { EventModal } from './components/common/EventModal';
import { LoginPage } from './components/auth/LoginPage';

export function App() {
  const getInitialTab = (): ActiveTab => {
    const hash = window.location.hash.replace('#', '').trim();
    if (['dashboard', 'calendar', 'book', 'my-bookings', 'events'].includes(hash)) {
      return hash as ActiveTab;
    }
    return 'dashboard';
  };

  const [currentUser, setCurrentUser] = useState<User | null>(() => storage.getActiveUser());
  const [activeTab, setActiveTabState] = useState<ActiveTab>(getInitialTab);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const setActiveTab = (tab: ActiveTab) => {
    setActiveTabState(tab);
    window.location.hash = tab;
  };

  // Modals
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [preselectedVenueForBooking, setPreselectedVenueForBooking] = useState<Venue | null>(null);
  const [selectedEventForModal, setSelectedEventForModal] = useState<Booking | null>(null);

  // Sync with hash changes
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '').trim();
      if (['dashboard', 'calendar', 'book', 'my-bookings', 'events'].includes(hash)) {
        setActiveTabState(hash as ActiveTab);
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Subscribe to storage changes for reactive state & Supabase sync
  useEffect(() => {
    storage.syncFromSupabase();
    const unsubscribe = storage.subscribe(() => {
      setCurrentUser(storage.getActiveUser());
    });
    return () => unsubscribe();
  }, []);

  const handleOpenBookModal = (venue?: Venue) => {
    setPreselectedVenueForBooking(venue || null);
    setIsBookModalOpen(true);
  };

  const handleCloseBookModal = () => {
    setIsBookModalOpen(false);
    setPreselectedVenueForBooking(null);
  };

  // Guard: Unauthenticated users MUST see the Login Page first
  if (!currentUser) {
    return <LoginPage onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 font-sans selection:bg-teal-500 selection:text-white">
      
      {/* Top Application Header */}
      <Header
        currentUser={currentUser}
        onOpenBookModal={() => handleOpenBookModal()}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        onLogout={() => {
          storage.logout();
          setCurrentUser(null);
        }}
      />

      {/* Main Layout Area: Sidebar + Scrollable View */}
      <div className="flex-1 w-full flex min-w-0">
        
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab: ActiveTab) => setActiveTab(tab)}
          currentUser={currentUser}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Content View Container */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="w-full max-w-7xl mx-auto space-y-6">
            {activeTab === 'dashboard' && (
              <DashboardPage
                currentUser={currentUser}
                onNavigate={(tab) => setActiveTab(tab)}
                onOpenBookWizard={(venue?: Venue) => handleOpenBookModal(venue)}
                onViewEvent={(booking: Booking) => setSelectedEventForModal(booking)}
              />
            )}

            {activeTab === 'calendar' && (
              <CommonCalendarPage
                currentUser={currentUser}
                onOpenBookModal={(venue?: Venue) => handleOpenBookModal(venue)}
              />
            )}

            {activeTab === 'book' && (
              <BookVenuePage
                currentUser={currentUser}
                onOpenBookWizard={(venue?: Venue) => handleOpenBookModal(venue)}
              />
            )}

            {activeTab === 'my-bookings' && (
              <MyBookingsPage
                currentUser={currentUser}
                onOpenBookWizard={() => handleOpenBookModal()}
              />
            )}

            {activeTab === 'events' && (
              <EventsDirectoryPage
                currentUser={currentUser}
                onOpenBookWizard={() => handleOpenBookModal()}
              />
            )}
          </div>
        </main>
      </div>

      {/* 6-Step Interactive Venue Booking Wizard Modal */}
      {isBookModalOpen && (
        <BookVenueModal
          isOpen={isBookModalOpen}
          onClose={handleCloseBookModal}
          preselectedVenue={preselectedVenueForBooking}
          currentUser={currentUser}
          onBookingCreated={() => {
            // Live reactive updates handled by storage subscription
          }}
        />
      )}

      {/* Event Details & Booking Cancellation Modal */}
      {selectedEventForModal && (
        <EventModal
          booking={selectedEventForModal}
          onClose={() => setSelectedEventForModal(null)}
          currentUser={currentUser}
          venues={storage.getVenues()}
          onStatusChange={() => {
            setCurrentUser(storage.getActiveUser());
          }}
        />
      )}

      {/* Footer Info Bar */}
      <footer className="border-t border-slate-200/80 bg-white/70 py-4 px-6 text-center text-xs text-slate-500">
        <p className="flex items-center justify-center gap-2 flex-wrap">
          <span>&copy; 2026 <strong>Nitte EventSync</strong></span>
          <span>&bull;</span>
          <span>Nitte (Deemed to be University) (<code className="text-teal-700">nitte.edu</code>)</span>
          <span>&bull;</span>
          <span className="text-slate-400">Direct Venue Booking &amp; Double-Booking Protection</span>
        </p>
      </footer>

    </div>
  );
}

export default App;
