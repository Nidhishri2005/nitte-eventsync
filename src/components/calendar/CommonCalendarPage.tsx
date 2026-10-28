import React, { useState, useMemo, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  MapPin, 
  PlusCircle, 
  Search, 
  Eye
} from 'lucide-react';
import { Booking, Venue, Profile, CalendarViewMode } from '../../types';
import { storage } from '../../services/storage';
import { EventModal } from '../common/EventModal';

interface CommonCalendarPageProps {
  currentUser: Profile;
  onOpenBookModal: (venue?: Venue) => void;
}

export const CommonCalendarPage: React.FC<CommonCalendarPageProps> = ({
  currentUser,
  onOpenBookModal,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date('2026-10-28T09:00:00'));
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [selectedVenueId, setSelectedVenueId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('Confirmed');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);

  const [venues, setVenues] = useState<Venue[]>(storage.getVenues());
  const [bookings, setBookings] = useState<Booking[]>(storage.getBookings());

  // Subscribe to real-time storage updates
  useEffect(() => {
    const update = () => {
      setVenues([...storage.getVenues()]);
      setBookings([...storage.getBookings()]);
    };
    update();
    const unsubscribe = storage.subscribe(update);
    return () => unsubscribe();
  }, []);

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const vId = b.venue_id || b.venueId;
      if (selectedVenueId !== 'all' && vId !== selectedVenueId) {
        return false;
      }

      const cat = b.event_category || b.eventCategory || b.category;
      if (selectedCategory !== 'all' && cat !== selectedCategory) {
        return false;
      }

      const isCancelled = b.status === 'Cancelled';
      if (selectedStatus === 'Cancelled') {
        if (!isCancelled) return false;
      } else if (selectedStatus === 'Confirmed') {
        if (isCancelled) return false;
      } else if (selectedStatus === 'all') {
        // By default, do not display cancelled bookings as active events
        if (isCancelled) return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const venue = venues.find(v => v.id === vId);
        const matchTitle = (b.event_title || b.eventTitle || '').toLowerCase().includes(query);
        const matchOrganizer = (b.organizer_name || b.organizerName || '').toLowerCase().includes(query);
        const matchVenue = (venue?.name || b.venue_name || '').toLowerCase().includes(query);
        const matchDep = (b.department || '').toLowerCase().includes(query);
        if (!matchTitle && !matchOrganizer && !matchVenue && !matchDep) {
          return false;
        }
      }

      return true;
    });
  }, [bookings, venues, selectedVenueId, selectedCategory, selectedStatus, searchQuery]);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const prevPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (viewMode === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 1);
      setCurrentDate(d);
    }
  };

  const nextPeriod = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (viewMode === 'week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 1);
      setCurrentDate(d);
    }
  };

  const jumpToToday = () => {
    setCurrentDate(new Date('2026-10-28T09:00:00'));
  };

  // Month grid matrix
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const lastDayOfPrevMonth = new Date(year, month, 0).getDate();

    const days: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }[] = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = lastDayOfPrevMonth - i;
      const prevM = month === 0 ? 12 : month;
      const prevY = month === 0 ? year - 1 : year;
      const dateStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateStr === '2026-10-28',
      });
    }

    // Current month days
    for (let d = 1; d <= lastDayOfMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === '2026-10-28',
      });
    }

    // Next month padding to fill 35 or 42 cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextM = month === 11 ? 1 : month + 2;
      const nextY = month === 11 ? year + 1 : year;
      const dateStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: dateStr === '2026-10-28',
      });
    }

    return days;
  }, [year, month]);

  // Week days calculation
  const weekDays = useMemo(() => {
    const start = new Date(currentDate);
    const day = start.getDay();
    start.setDate(start.getDate() - day);

    const w: { dateStr: string; dayNumber: number; dayName: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const cd = new Date(start);
      cd.setDate(cd.getDate() + i);
      const dateStr = `${cd.getFullYear()}-${String(cd.getMonth() + 1).padStart(2, '0')}-${String(cd.getDate()).padStart(2, '0')}`;
      w.push({
        dateStr,
        dayNumber: cd.getDate(),
        dayName: daysOfWeek[i],
      });
    }
    return w;
  }, [currentDate]);

  const currentDayStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Common Campus Calendar
            </h1>
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200/60">
              Nitte University
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Official campus venue schedules and real-time conflict-free booking calendar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-stretch sm:self-auto">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            {(['month', 'week', 'day'] as CalendarViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                  viewMode === mode
                    ? 'bg-white text-blue-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <button
            onClick={() => onOpenBookModal()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-blue-900 hover:bg-blue-950 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Booking</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-100 pb-3">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-bold text-slate-700">Campus:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md bg-teal-700 border border-teal-800 shadow-xs"></span>
              <span className="font-semibold text-slate-800">Nitte University Events</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1 font-medium text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Confirmed Bookings
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span> Cancelled
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search title, venue, host..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-900"
            />
          </div>

          <select
            value={selectedVenueId}
            onChange={e => setSelectedVenueId(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-700 font-medium"
          >
            <option value="all">All Venues</option>
            {venues.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-700 font-medium"
          >
            <option value="all">All Event Categories</option>
            <option value="Technical">Technical</option>
            <option value="Cultural">Cultural</option>
            <option value="Academic">Academic</option>
            <option value="Conference">Conference</option>
            <option value="Workshop">Workshop</option>
            <option value="Sports">Sports</option>
            <option value="University Ceremony">University Ceremony</option>
            <option value="Student Club">Student Club</option>
          </select>

          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-700 font-medium"
          >
            <option value="Confirmed">Confirmed Bookings Only</option>
            <option value="Cancelled">Cancelled Bookings</option>
            <option value="all">All Active &amp; Confirmed</option>
          </select>
        </div>
      </div>

      {/* Calendar Navigation Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={prevPeriod}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Previous Period"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={jumpToToday}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-teal-700" />
            <span>Today</span>
          </button>

          <button
            onClick={nextPeriod}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Next Period"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <h2 className="text-base sm:text-lg font-bold text-slate-900 ml-2">
            {viewMode === 'month' && `${monthNames[month]} ${year}`}
            {viewMode === 'week' && `Week of ${weekDays[0].dayName}, ${weekDays[0].dateStr}`}
            {viewMode === 'day' && currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </h2>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing <strong className="text-slate-800">{filteredBookings.length}</strong> active confirmed bookings
        </div>
      </div>

      {/* VIEW MODES */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 text-center py-2.5 text-xs font-bold text-slate-600">
                {daysOfWeek.map(d => (
                  <div key={d} className="uppercase tracking-wider">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
                {calendarDays.map((cd) => {
                  const dayBookings = filteredBookings.filter(b => (b.event_date || b.date) === cd.dateStr);

                  return (
                    <div
                      key={cd.dateStr}
                      className={`min-h-[120px] p-2 flex flex-col transition-colors ${
                        !cd.isCurrentMonth ? 'bg-slate-50/60 text-slate-400' : 'bg-white'
                      } ${cd.isToday ? 'bg-blue-50/30' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                          cd.isToday 
                            ? 'bg-blue-900 text-white shadow-xs' 
                            : cd.isCurrentMonth 
                            ? 'text-slate-800' 
                            : 'text-slate-400'
                        }`}>
                          {cd.dayNumber}
                        </span>

                        {dayBookings.length > 0 && cd.isCurrentMonth && (
                          <span className="text-[10px] font-bold text-slate-400">
                            {dayBookings.length} {dayBookings.length === 1 ? 'event' : 'events'}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 overflow-y-auto max-h-[85px] flex-1">
                        {dayBookings.map((b) => {
                          const venue = venues.find(v => v.id === (b.venue_id || b.venueId));
                          const title = b.event_title || b.eventTitle || 'Campus Booking';
                          const startTime = (b.start_time || b.startTime || '').slice(0, 5);

                          return (
                            <div
                              key={b.id}
                              onClick={() => setActiveBooking(b)}
                              className={`cursor-pointer px-2 py-1 rounded-md text-[11px] font-medium leading-tight shadow-xs transition-all hover:scale-[1.02] flex items-center justify-between gap-1 bg-teal-700 text-white hover:bg-teal-800 ${
                                b.status === 'Cancelled' ? 'opacity-50 line-through' : ''
                              }`}
                              title={`${title} (${venue?.name || b.venue_name || 'Venue'}) [${startTime} - ${(b.end_time || b.endTime || '').slice(0, 5)}]`}
                            >
                              <span className="truncate flex-1 font-semibold">
                                {title}
                              </span>
                              <span className="text-[9px] opacity-80 shrink-0 font-mono">
                                {startTime}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {dayBookings.length === 0 && cd.isCurrentMonth && (
                        <div className="text-[10px] text-slate-300 text-center py-2 opacity-0 hover:opacity-100 transition-opacity">
                          Free slot
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'week' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[680px]">
              <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 text-center py-3 text-xs font-bold text-slate-700">
                {weekDays.map(wd => {
                  const isToday = wd.dateStr === '2026-10-28';
                  return (
                    <div key={wd.dateStr} className="space-y-1">
                      <p className="uppercase tracking-wider text-[11px] text-slate-500">{wd.dayName}</p>
                      <p className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center font-bold ${
                        isToday ? 'bg-blue-900 text-white' : 'text-slate-800'
                      }`}>
                        {wd.dayNumber}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-7 divide-x divide-slate-100 min-h-[500px]">
                {weekDays.map(wd => {
                  const dayBookings = filteredBookings.filter(b => (b.event_date || b.date) === wd.dateStr);

                  return (
                    <div key={wd.dateStr} className="p-2.5 space-y-2 bg-white">
                      {dayBookings.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-xs text-slate-300 italic text-center p-4">
                          No events booked
                        </div>
                      ) : (
                        dayBookings.map(b => {
                          const venue = venues.find(v => v.id === (b.venue_id || b.venueId));
                          const title = b.event_title || b.eventTitle || 'Campus Booking';
                          const startTime = (b.start_time || b.startTime || '').slice(0, 5);
                          const endTime = (b.end_time || b.endTime || '').slice(0, 5);

                          return (
                            <div
                              key={b.id}
                              onClick={() => setActiveBooking(b)}
                              className="cursor-pointer p-2.5 rounded-xl text-xs text-white shadow-xs transition-transform hover:-translate-y-0.5 space-y-1 bg-teal-700 hover:bg-teal-800"
                            >
                              <div className="flex items-center justify-between text-[10px] text-teal-100">
                                <span className="font-mono">{startTime} - {endTime}</span>
                                <span className="font-bold">{b.status}</span>
                              </div>
                              <p className="font-bold text-white line-clamp-2">{title}</p>
                              <p className="text-[10px] text-teal-100 truncate flex items-center gap-1">
                                <MapPin className="w-3 h-3 shrink-0" />
                                {venue?.name || b.venue_name || 'Venue'}
                              </p>
                            </div>
                          );
                        })
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'day' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Detailed Venue Schedule for {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Side-by-side venue occupancy preventing any double booking.
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 bg-slate-100 text-slate-700 rounded-full">
              {venues.length} Venues Tracked
            </span>
          </div>

          <div className="space-y-4">
            {venues.map(v => {
              const dayBookings = filteredBookings.filter(b => 
                (b.venue_id === v.id || b.venueId === v.id) && 
                (b.event_date === currentDayStr || b.date === currentDayStr)
              );

              return (
                <div key={v.id} className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{v.name}</h4>
                        <p className="text-xs text-slate-500">{v.location} &bull; Capacity: {v.capacity} Pax</p>
                      </div>
                    </div>

                    <button
                      onClick={() => onOpenBookModal(v)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Book Slot</span>
                    </button>
                  </div>

                  {dayBookings.length === 0 ? (
                    <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="font-medium">Entire day is open for reservation &mdash; Zero scheduling conflicts.</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {dayBookings.map(b => (
                        <div 
                          key={b.id}
                          onClick={() => setActiveBooking(b)}
                          className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 cursor-pointer"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-900">{b.event_title || b.eventTitle}</p>
                            <p className="text-[11px] text-slate-500">
                              Host: {b.organizer_name || b.organizerName} ({b.department || 'Nitte University'}) &bull; Expected: {b.expected_attendees || b.expectedAttendees} Pax
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                              {(b.start_time || b.startTime || '').slice(0, 5)} - {(b.end_time || b.endTime || '').slice(0, 5)}
                            </span>
                            <Eye className="w-4 h-4 text-slate-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Booking Details Modal */}
      {activeBooking && (
        <EventModal
          booking={activeBooking}
          onClose={() => setActiveBooking(null)}
          currentUser={currentUser}
          venues={venues}
          onStatusChange={() => {
            setBookings([...storage.getBookings()]);
          }}
        />
      )}
    </div>
  );
};
