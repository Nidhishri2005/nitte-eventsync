import React, { useState, useMemo } from 'react';
import { 
  BookmarkCheck, 
  Clock, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Search, 
  PlusCircle
} from 'lucide-react';
import { Booking, User } from '../../types';
import { storage } from '../../services/storage';
import { EventModal } from '../common/EventModal';

interface MyBookingsPageProps {
  currentUser: User;
  onOpenBookWizard: () => void;
}

type BookingFilterTab = 'all' | 'Upcoming' | 'Confirmed' | 'Cancelled';

export const MyBookingsPage: React.FC<MyBookingsPageProps> = ({
  currentUser,
  onOpenBookWizard,
}) => {
  const [activeTab, setActiveTab] = useState<BookingFilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const venues = storage.getVenues();
  const allBookings = storage.getBookings();

  const userBookings = useMemo(() => {
    return allBookings.filter(b => {
      const matchOwner = (b.organizer_id || b.userId) === currentUser.id || 
                         (b.organizer_email || b.organizerEmail || '').toLowerCase() === currentUser.email.toLowerCase();
      return matchOwner;
    });
  }, [allBookings, currentUser]);

  const filteredBookings = useMemo(() => {
    return userBookings.filter(b => {
      const eventDate = b.event_date || b.date || '';
      const isConfirmed = b.status === 'Confirmed' || b.status === 'Approved';

      if (activeTab === 'Upcoming') {
        const isUpcoming = eventDate >= '2026-10-27' && isConfirmed;
        if (!isUpcoming) return false;
      } else if (activeTab === 'Confirmed') {
        if (!isConfirmed) return false;
      } else if (activeTab === 'Cancelled') {
        if (b.status !== 'Cancelled') return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const venue = venues.find(v => v.id === (b.venue_id || b.venueId));
        const matchTitle = (b.event_title || b.eventTitle || '').toLowerCase().includes(q);
        const matchVenue = (venue?.name || b.venue_name || '').toLowerCase().includes(q);
        const matchId = (b.id || '').toLowerCase().includes(q);
        if (!matchTitle && !matchVenue && !matchId) return false;
      }

      return true;
    });
  }, [userBookings, activeTab, searchQuery, venues]);

  const counts = useMemo(() => {
    return {
      all: userBookings.length,
      upcoming: userBookings.filter(b => (b.event_date || b.date || '') >= '2026-10-27' && (b.status === 'Confirmed' || b.status === 'Approved')).length,
      confirmed: userBookings.filter(b => b.status === 'Confirmed' || b.status === 'Approved').length,
      cancelled: userBookings.filter(b => b.status === 'Cancelled').length,
    };
  }, [userBookings]);

  const handleCancelBooking = (bookingId: string) => {
    if (window.confirm('Are you sure you want to cancel this booking reservation?')) {
      storage.cancelBooking(bookingId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              My Venue Bookings
            </h1>
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200/60">
              Personal Reservations
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            View, track, and manage all your confirmed campus venue reservations.
          </p>
        </div>

        <button
          onClick={onOpenBookWizard}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-blue-950 hover:bg-blue-900 transition-colors shadow-xs"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Reservation</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs font-semibold">
            {[
              { id: 'all' as BookingFilterTab, label: 'All', count: counts.all },
              { id: 'Upcoming' as BookingFilterTab, label: 'Upcoming', count: counts.upcoming },
              { id: 'Confirmed' as BookingFilterTab, label: 'Confirmed', count: counts.confirmed, badgeColor: 'bg-emerald-100 text-emerald-800' },
              { id: 'Cancelled' as BookingFilterTab, label: 'Cancelled', count: counts.cancelled },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-blue-950 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : (tab.badgeColor || 'bg-slate-100 text-slate-700')
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search reference, venue, title..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-900"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filteredBookings.map((b) => {
          const venue = venues.find(v => v.id === (b.venue_id || b.venueId));
          const isConfirmed = b.status === 'Confirmed' || b.status === 'Approved';

          return (
            <div
              key={b.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-bold text-xs ${
                  isConfirmed ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-700'
                }`}>
                  {isConfirmed ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <XCircle className="w-6 h-6 text-slate-400" />
                  )}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                      {b.id.slice(0, 13)}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isConfirmed ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {isConfirmed ? 'Confirmed' : 'Cancelled'}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">&bull;</span>
                    <span className="text-xs font-semibold text-slate-600">{b.event_category || b.eventCategory}</span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 mt-1">
                    {b.event_title || b.eventTitle}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1.5">
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {venue?.name || b.venue_name} ({venue?.location || b.venue_location})
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {b.event_date || b.date}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {b.start_time || b.startTime} - {b.end_time || b.endTime}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                <button
                  onClick={() => setSelectedBooking(b)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  View Details
                </button>

                {b.status !== 'Cancelled' && (
                  <button
                    onClick={() => handleCancelBooking(b.id)}
                    className="p-1.5 rounded-xl text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
                    title="Cancel Booking"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredBookings.length === 0 && (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
            <BookmarkCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Bookings Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              There are no reservations matching this category.
            </p>
          </div>
        )}
      </div>

      <EventModal
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        currentUser={currentUser}
        venues={venues}
      />
    </div>
  );
};
