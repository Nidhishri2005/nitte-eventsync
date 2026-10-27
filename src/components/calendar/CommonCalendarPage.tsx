import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  MapPin, 
  PlusCircle
} from 'lucide-react';
import { Booking, Venue, User } from '../../types';
import { storage } from '../../services/storage';
import { EventModal } from '../common/EventModal';

type CalendarViewMode = 'month' | 'week' | 'day';

interface CommonCalendarPageProps {
  currentUser: User;
  onOpenBookModal: (venue?: Venue) => void;
}

export const CommonCalendarPage: React.FC<CommonCalendarPageProps> = ({
  currentUser,
  onOpenBookModal,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 9, 27));
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');

  const [selectedInstitution, setSelectedInstitution] = useState<string>('all');
  const [selectedVenueId, setSelectedVenueId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);

  const bookings = storage.getBookings();
  const venues = storage.getVenues();

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      if (selectedInstitution !== 'all' && b.institutionId !== selectedInstitution) {
        return false;
      }
      if (selectedVenueId !== 'all' && b.venueId !== selectedVenueId) {
        return false;
      }
      if (selectedCategory !== 'all' && b.eventCategory !== selectedCategory) {
        return false;
      }
      if (selectedStatus !== 'all' && b.status !== selectedStatus) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const venue = venues.find(v => v.id === b.venueId);
        const matchTitle = b.eventTitle.toLowerCase().includes(query);
        const matchOrganizer = b.organizerName.toLowerCase().includes(query);
        const matchVenue = venue?.name.toLowerCase().includes(query);
        const matchDep = b.department.toLowerCase().includes(query);
        if (!matchTitle && !matchOrganizer && !matchVenue && !matchDep) {
          return false;
        }
      }
      return true;
    });
  }, [bookings, selectedInstitution, selectedVenueId, selectedCategory, selectedStatus, searchQuery, venues]);

  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() - 1);
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() - 7);
    } else {
      next.setDate(next.getDate() - 1);
    }
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() + 1);
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() + 7);
    } else {
      next.setDate(next.getDate() + 1);
    }
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date(2026, 9, 27));
  };

  const monthYearLabel = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startingDayOfWeek = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: false,
        date: new Date(year, month - 1, d),
      });
    }

    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true,
        date: new Date(year, month, d),
      });
    }

    const remainingDays = 7 - (days.length % 7);
    if (remainingDays < 7) {
      for (let d = 1; d <= remainingDays; d++) {
        const dateStr = `${year}-${String(month + 2).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        days.push({
          dayNumber: d,
          dateStr,
          isCurrentMonth: false,
          date: new Date(year, month + 1, d),
        });
      }
    }

    return days;
  }, [currentDate]);

  const weekDays = useMemo(() => {
    const curr = new Date(currentDate);
    const dayOfWeek = curr.getDay();
    const sunday = new Date(curr);
    sunday.setDate(curr.getDate() - dayOfWeek);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      days.push({
        date: d,
        dateStr,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: d.getDate(),
      });
    }
    return days;
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
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-50 text-blue-900 border border-blue-200/60">
              NMAMIT &amp; Nitte DU
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Centralized cross-institutional venue schedules and real-time conflict-free booking calendar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-stretch sm:self-auto">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            {(['month', 'week', 'day'] as CalendarViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
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
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-blue-900 hover:bg-blue-950 rounded-xl shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Booking</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-100 pb-3">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-bold text-slate-700">Institution Colors:</span>
            
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md bg-blue-900 border border-blue-950 shadow-xs"></span>
              <span className="font-semibold text-slate-800">NMAMIT Events</span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md bg-teal-700 border border-teal-800 shadow-xs"></span>
              <span className="font-semibold text-slate-800">Nitte University Events</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1 font-medium text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Confirmed
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span> Cancelled
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 text-xs">
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
            value={selectedInstitution}
            onChange={e => setSelectedInstitution(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-700 font-medium"
          >
            <option value="all">All Institutions</option>
            <option value="nmamit">NMAMIT (nmamit.in)</option>
            <option value="nitte_edu">Nitte University (nitte.edu)</option>
          </select>

          <select
            value={selectedVenueId}
            onChange={e => setSelectedVenueId(e.target.value)}
            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-700 font-medium"
          >
            <option value="all">All Venues</option>
            {venues.map(v => (
              <option key={v.id} value={v.id}>{v.name} ({v.institutionId === 'nmamit' ? 'NMAMIT' : 'Nitte DU'})</option>
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
            <option value="all">All Statuses</option>
            <option value="Confirmed">Confirmed Only</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {monthYearLabel}
          </h2>
          {viewMode === 'day' && (
            <span className="text-xs text-slate-500 font-medium">
              &bull; {currentDate.toLocaleDateString('en-US', { weekday: 'long' })}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
          <button
            onClick={handlePrev}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            title="Previous"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Today (Oct 27)
          </button>
          <button
            onClick={handleNext}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            title="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {viewMode === 'month' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[680px]">
              <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 text-center py-2.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                  <div key={day} className={i === 0 || i === 6 ? 'text-slate-400' : ''}>
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 min-h-[580px]">
                {calendarDays.map((cd, index) => {
                  const dayBookings = filteredBookings.filter(b => (b.event_date || b.date) === cd.dateStr);
                  const isToday = cd.dateStr === '2026-10-27';

                  return (
                <div
                  key={index}
                  className={`p-1.5 sm:p-2 min-h-[110px] flex flex-col justify-between transition-colors ${
                    !cd.isCurrentMonth ? 'bg-slate-50/50 text-slate-300' : 'bg-white hover:bg-slate-50/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                      isToday 
                        ? 'bg-blue-900 text-white font-extrabold shadow-xs' 
                        : cd.isCurrentMonth ? 'text-slate-700' : 'text-slate-300'
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
                      const venue = venues.find(v => v.id === b.venueId);
                      const isNMAMIT = b.institutionId === 'nmamit';

                      return (
                        <div
                          key={b.id}
                          onClick={() => setActiveBooking(b)}
                          className={`cursor-pointer px-2 py-1 rounded-md text-[11px] font-medium leading-tight shadow-xs transition-all hover:scale-[1.02] flex items-center justify-between gap-1 ${
                            isNMAMIT
                              ? 'bg-blue-900 text-white hover:bg-blue-950'
                              : 'bg-teal-700 text-white hover:bg-teal-800'
                          } ${
                            b.status === 'Cancelled' ? 'opacity-50 line-through' : ''
                          }`}
                          title={`${b.eventTitle} (${venue?.name || ''}) [${b.startTime} - ${b.endTime}]`}
                        >
                          <span className="truncate flex-1 font-semibold">
                            {b.eventTitle}
                          </span>
                          <span className="text-[9px] opacity-80 shrink-0 font-mono">
                            {b.startTime}
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
              const isToday = wd.dateStr === '2026-10-27';
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
                      const isNMAMIT = b.institution_id === '11111111-1111-1111-1111-111111111111' || b.institutionId === 'nmamit';
                      return (
                        <div
                          key={b.id}
                          onClick={() => setActiveBooking(b)}
                          className={`cursor-pointer p-2.5 rounded-xl text-xs text-white shadow-xs transition-transform hover:-translate-y-0.5 space-y-1 ${
                            isNMAMIT ? 'bg-blue-900' : 'bg-teal-700'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] text-slate-200">
                            <span className="font-mono">{b.start_time || b.startTime} - {b.end_time || b.endTime}</span>
                            <span className="font-bold">{b.status}</span>
                          </div>
                          <p className="font-bold text-white line-clamp-2">{b.event_title || b.eventTitle}</p>
                          <p className="text-[10px] text-slate-200 truncate flex items-center gap-1">
                            <MapPin className="w-3 h-3 shrink-0" />
                            {venue?.name || b.venue_name}
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
              const dayBookings = filteredBookings.filter(b => b.venueId === v.id && b.date === currentDayStr);

              return (
                <div key={v.id} className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        v.institutionId === 'nmamit' ? 'bg-blue-900' : 'bg-teal-600'
                      }`} />
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{v.name}</h4>
                        <p className="text-xs text-slate-500">{v.location} &bull; Capacity: {v.capacity}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenBookModal(v)}
                        className="px-3 py-1 text-xs font-semibold bg-white border border-slate-300 hover:border-blue-900 text-slate-700 hover:text-blue-900 rounded-lg transition-colors"
                      >
                        Book Slot
                      </button>
                    </div>
                  </div>

                  {dayBookings.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-slate-200/60">
                      {dayBookings.map(b => (
                        <div
                          key={b.id}
                          onClick={() => setActiveBooking(b)}
                          className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-blue-900 cursor-pointer transition-all"
                        >
                          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                            <span className="text-blue-900">{b.startTime} &mdash; {b.endTime}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded ${
                              b.status === 'Cancelled' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {b.status}
                            </span>
                          </div>
                          <p className="font-semibold text-xs text-slate-900 mt-1">{b.eventTitle}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">Host: {b.organizerName} ({b.department})</p>
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

      <EventModal
        booking={activeBooking}
        onClose={() => setActiveBooking(null)}
        currentUser={currentUser}
        venues={venues}
      />
    </div>
  );
};
