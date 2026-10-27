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
import { AdminPanelPage } from './components/admin/AdminPanelPage';
import { BookVenueModal } from './components/venues/BookVenueModal';
import { EventModal } from './components/common/EventModal';

export function App() {
  const [currentUser, setCurrentUser] = useState<User>(() => storage.getCurrentUser());
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Modals
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [preselectedVenueForBooking, setPreselectedVenueForBooking] = useState<Venue | null>(null);
  const [selectedEventForModal, setSelectedEventForModal] = useState<Booking | null>(null);

  // Subscribe to storage changes for reactive state
  useEffect(() => {
    const unsubscribe = storage.subscribe(() => {
      setCurrentUser(storage.getCurrentUser());
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 font-sans selection:bg-teal-500 selection:text-white">
      
      {/* Top Application Header */}
      <Header
        currentUser={currentUser}
        onOpenBookModal={() => handleOpenBookModal()}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      {/* Main Layout Area: Sidebar + Scrollable View */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        
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

          {activeTab === 'admin' && (
            <AdminPanelPage
              currentUser={currentUser}
            />
          )}
        </main>
      </div>

      {/* 7-Step Interactive Venue Booking Wizard Modal */}
      {isBookModalOpen && (
        <BookVenueModal
          isOpen={isBookModalOpen}
          onClose={handleCloseBookModal}
          preselectedVenue={preselectedVenueForBooking}
          currentUser={currentUser}
          onBookingCreated={() => {
            // Keep open to step 7 confirmation pass
          }}
        />
      )}

      {/* Generic Event / Booking Details Modal */}
      {selectedEventForModal && (
        <EventModal
          booking={selectedEventForModal}
          onClose={() => setSelectedEventForModal(null)}
          currentUser={currentUser}
          venues={storage.getVenues()}
          onStatusChange={() => {
            setCurrentUser(storage.getCurrentUser());
          }}
        />
      )}

      {/* Footer info bar */}
      <footer className="border-t border-slate-200/80 bg-white/70 py-4 px-6 text-center text-xs text-slate-500">
        <p className="flex items-center justify-center gap-2 flex-wrap">
          <span>&copy; 2026 <strong>Nitte EventSync</strong></span>
          <span>&bull;</span>
          <span>NMAM Institute of Technology (<code className="text-blue-900">nmamit.in</code>)</span>
          <span>&bull;</span>
          <span>Nitte University (<code className="text-teal-700">nitte.edu</code>)</span>
          <span>&bull;</span>
          <span className="text-slate-400">Zero Overlap Booking Protocol</span>
        </p>
      </footer>

    </div>
  );
}

export default App;
