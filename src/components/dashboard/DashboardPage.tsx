import React, { useState } from 'react';
import { 
  Calendar, 
  MapPin, 
  Building2, 
  CheckCircle2, 
  PlusCircle, 
  ArrowRight, 
  Sparkles, 
  Clock,
  Users,
  CheckCircle,
  BookmarkCheck
} from 'lucide-react';
import { Profile, Venue, Booking } from '../../types';
import { db } from '../../services/db';

interface DashboardPageProps {
  currentProfile?: Profile;
  currentUser?: Profile;
  onNavigate: (tab: 'calendar' | 'book' | 'my-bookings' | 'events') => void;
  onOpenBookWizard: (venue?: Venue) => void;
  onViewEvent: (booking: Booking) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  currentProfile: currentProfileProp,
  currentUser,
  onNavigate,
  onOpenBookWizard,
  onViewEvent,
}) => {
  const currentProfile = currentProfileProp || currentUser || db.getCurrentProfile();
  const venues = db.getVenues();
  const bookings = db.getBookings();

  // Active time filter for availability stats calculation
  const [selectedDate, setSelectedDate] = useState('2026-10-27');
  const [selectedTime, setSelectedTime] = useState('10:00');

  // Dynamic booking statistics from actual database records
  const stats = db.getStats(selectedDate, selectedTime);

  // Confirmed bookings for today
  const todayEvents = bookings.filter(b => 
    (b.event_date === '2026-10-27' || b.date === '2026-10-27') && 
    (b.status === 'Confirmed' || b.status === 'Approved')
  );

  // Upcoming confirmed bookings
  const upcomingEvents = bookings
    .filter(b => (b.event_date || b.date || '') >= '2026-10-27' && (b.status === 'Confirmed' || b.status === 'Approved'))
    .slice(0, 4);

  const userDisplayName = currentProfile?.full_name || currentProfile?.name || 'Campus Member';

  return (
    <div className="space-y-8 w-full max-w-full overflow-hidden">
      
      {/* 1. Welcome Hero Banner */}
      <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-r from-blue-950 via-blue-900 to-teal-900 text-white p-5 sm:p-8 overflow-hidden shadow-sm border border-blue-900/50 min-w-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-teal-200 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-teal-300" />
            <span className="truncate">Nitte EventSync &bull; Unified Campus Reservation</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Welcome, {userDisplayName}!
          </h1>
          
          <p className="text-xs sm:text-sm text-slate-200 mt-2 leading-relaxed">
            Centralized venue booking system for <strong>NMAM Institute of Technology</strong> (<code className="text-teal-300">nmamit.in</code>) and <strong>Nitte University</strong> (<code className="text-teal-300">nitte.edu</code>). Direct reservation with automated zero double-booking conflict prevention.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-6">
            <button
              onClick={() => onOpenBookWizard()}
              className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-teal-500 hover:bg-teal-400 text-slate-950 transition-all flex items-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Book a Venue Now</span>
            </button>

            <button
              onClick={() => onNavigate('calendar')}
              className="px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-2 backdrop-blur-md cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Open Common Calendar</span>
            </button>

            <button
              onClick={() => onNavigate('my-bookings')}
              className="px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-2 backdrop-blur-md cursor-pointer"
            >
              <BookmarkCheck className="w-4 h-4" />
              <span>My Reservations</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Booking Statistics (The 4 Required Cards) */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Venue &amp; Reservation Statistics
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Availability for:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="px-2 py-1 rounded-lg border border-slate-200 text-xs bg-white text-slate-700"
            />
            <input
              type="time"
              value={selectedTime}
              onChange={e => setSelectedTime(e.target.value)}
              className="px-2 py-1 rounded-lg border border-slate-200 text-xs bg-white text-slate-700"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Total Venues */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Venues</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{stats.totalVenues}</p>
              <p className="text-[11px] text-slate-500 truncate">Official Campus Venues</p>
            </div>
          </div>

          {/* Card 2: Available Venues */}
          <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs bg-emerald-50/20 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Available Venues</p>
              <p className="text-2xl font-black text-emerald-950 mt-0.5">{stats.availableVenues}</p>
              <p className="text-[11px] text-emerald-700 truncate">Free for {selectedTime}</p>
            </div>
          </div>

          {/* Card 3: Booked Venues */}
          <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs bg-amber-50/20 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Booked Venues</p>
              <p className="text-2xl font-black text-amber-950 mt-0.5">{stats.bookedVenues}</p>
              <p className="text-[11px] text-amber-700 truncate">Active at {selectedTime}</p>
            </div>
          </div>

          {/* Card 4: Total Bookings */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Bookings</p>
              <p className="text-2xl font-black text-slate-900 mt-0.5">{stats.totalBookings}</p>
              <p className="text-[11px] text-teal-700 font-semibold truncate">Confirmed Reservations</p>
            </div>
          </div>

        </div>
      </div>

      {/* 3. Schedule Overview & Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Schedule Today Preview */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-900" />
                <h3 className="font-extrabold text-base text-slate-900">
                  Campus Events Today &mdash; Oct 27, 2026
                </h3>
              </div>

              <button
                onClick={() => onNavigate('calendar')}
                className="text-xs font-bold text-blue-900 hover:text-blue-950 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>View Full Calendar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Today's Confirmed Bookings */}
            <div className="space-y-3">
              {todayEvents.length > 0 ? (
                todayEvents.map(event => {
                  const venue = venues.find(v => v.id === (event.venue_id || event.venueId));
                  return (
                    <div 
                      key={event.id}
                      onClick={() => onViewEvent(event)}
                      className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-blue-900 text-white flex flex-col items-center justify-center shrink-0">
                          <span className="text-xs font-bold">{(event.start_time || event.startTime || '').slice(0, 5)}</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-900 transition-colors">
                            {event.event_title || event.eventTitle}
                          </h4>
                          <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{venue?.name || event.venue_name || 'Campus Venue'}</span>
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Host: {event.organizer_name || event.organizerName} ({event.department})
                          </p>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          Confirmed
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {(event.start_time || event.startTime || '').slice(0, 5)} &ndash; {(event.end_time || event.endTime || '').slice(0, 5)}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No confirmed events scheduled for today.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Upcoming Confirmed Events List */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-base text-slate-900">
                Upcoming Confirmed Events
              </h3>
              <button
                onClick={() => onNavigate('events')}
                className="text-xs font-bold text-teal-700 hover:text-teal-800 cursor-pointer"
              >
                Directory
              </button>
            </div>

            <div className="space-y-3">
              {upcomingEvents.map(event => {
                const venue = venues.find(v => v.id === (event.venue_id || event.venueId));
                return (
                  <div 
                    key={event.id}
                    onClick={() => onViewEvent(event)}
                    className="p-3 rounded-2xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                      <span className="font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                        {event.institution_id === '11111111-1111-1111-1111-111111111111' ? 'NMAMIT' : 'Nitte DU'}
                      </span>
                      <span>{event.event_date || event.date}</span>
                    </div>
                    <p className="font-bold text-xs text-slate-900 line-clamp-1">
                      {event.event_title || event.eventTitle}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{venue?.name || event.venue_name} &bull; {(event.start_time || event.startTime || '').slice(0, 5)} - {(event.end_time || event.endTime || '').slice(0, 5)}</span>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100">
            <button
              onClick={() => onOpenBookWizard()}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200/80 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Direct Reserve a Venue</span>
            </button>
          </div>
        </div>

      </div>

      {/* 4. Official Campus Venues Grid Preview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900">Official Campus Venues</h3>
            <p className="text-xs text-slate-500">Live availability and specifications across campus facilities</p>
          </div>
          <button
            onClick={() => onNavigate('book')}
            className="text-xs font-bold text-blue-900 hover:text-blue-950 flex items-center gap-1 hover:underline cursor-pointer"
          >
            <span>Explore All Venues</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {venues.slice(0, 3).map(venue => (
            <div 
              key={venue.id}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="h-40 w-full relative overflow-hidden bg-slate-100">
                  <img 
                    src={venue.imageUrl} 
                    alt={venue.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                    {venue.institutionId === 'nmamit' || venue.institution_id === '11111111-1111-1111-1111-111111111111' ? 'NMAMIT Campus' : 'Nitte University'}
                  </div>
                  <div className="absolute top-3 right-3 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs">
                    <CheckCircle className="w-3 h-3" />
                    <span>Instant Booking</span>
                  </div>
                </div>

                <div className="p-5">
                  <h4 className="font-black text-base text-slate-900">{venue.name}</h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{venue.location}</span>
                  </p>
                  
                  <div className="mt-3 flex items-center gap-3 text-xs text-slate-600">
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-blue-900" />
                      <span className="font-semibold">{venue.capacity} Pax</span>
                    </div>
                    <span>&bull;</span>
                    <span className="text-[11px] text-slate-400 truncate">
                      {Array.isArray(venue.facilities) ? venue.facilities.join(', ') : venue.facilities}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0">
                <button
                  onClick={() => onOpenBookWizard(venue)}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-blue-900 hover:bg-blue-950 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Book This Venue</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
