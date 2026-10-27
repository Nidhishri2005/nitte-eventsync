import React from 'react';
import { 
  Calendar, 
  MapPin, 
  Building2, 
  CheckCircle2, 
  PlusCircle, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Clock,
  Users
} from 'lucide-react';
import { Profile, Venue, Booking } from '../../types';
import { db } from '../../services/db';

interface DashboardPageProps {
  currentProfile?: Profile;
  currentUser?: Profile;
  onNavigate: (tab: 'calendar' | 'book' | 'my-bookings' | 'events' | 'admin') => void;
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
  const stats = db.getStats();

  // Upcoming confirmed events
  const upcomingEvents = bookings
    .filter(b => b.status === 'Approved')
    .slice(0, 4);

  // Today's events
  const todayDate = '2026-10-27';
  const todayEvents = bookings.filter(b => b.event_date === todayDate && b.status === 'Approved');

  // The 5 official NMAMIT venues
  const nmamitVenues = venues.slice(0, 5);

  return (
    <div className="space-y-8 w-full max-w-full overflow-hidden">
      
      {/* 1. Welcome Hero Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-blue-950 via-blue-900 to-teal-900 text-white p-6 sm:p-8 overflow-hidden shadow-sm border border-blue-900/50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-teal-200 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-teal-300" />
            <span>Nitte EventSync &bull; Unified Campus Reservation System</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Welcome, {currentProfile.full_name}!
          </h1>
          
          <p className="text-xs sm:text-sm text-slate-200 mt-2 leading-relaxed">
            Centralized venue booking system for <strong>NMAM Institute of Technology</strong> (`nmamit.in`) and <strong>Nitte University</strong> (`nitte.edu`). Check live availability, reserve auditoriums, and eliminate double-booking conflicts across both campuses.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              onClick={() => onOpenBookWizard()}
              className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-teal-500 hover:bg-teal-400 text-slate-950 transition-all flex items-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Book a Venue Now</span>
            </button>

            <button
              onClick={() => onNavigate('calendar')}
              className="px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-2 backdrop-blur-md"
            >
              <Calendar className="w-4 h-4" />
              <span>Open Common Calendar</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Bookings</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{stats.total}</p>
            <p className="text-[11px] text-slate-500 truncate">Actual DB Records</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs bg-amber-50/20 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Pending Approvals</p>
            <p className="text-2xl font-black text-amber-900 mt-0.5">{stats.pending}</p>
            <p className="text-[11px] text-amber-700 truncate">Requires Review</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs bg-emerald-50/20 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Approved Events</p>
            <p className="text-2xl font-black text-emerald-900 mt-0.5">{stats.approved}</p>
            <p className="text-[11px] text-emerald-700 truncate">Live on Calendar</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Available Venues</p>
            <p className="text-2xl font-black text-slate-900 mt-0.5">{stats.venuesCount}</p>
            <p className="text-[11px] text-teal-700 font-semibold truncate">5 Official NMAMIT</p>
          </div>
        </div>
      </div>

      {/* 3. Schedule Overview & Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Schedule Today Preview */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-900" />
                <h3 className="font-extrabold text-base text-slate-900">
                  Campus Events Today &mdash; October 27, 2026
                </h3>
              </div>

              <button
                onClick={() => onNavigate('calendar')}
                className="text-xs font-bold text-blue-900 hover:text-blue-950 flex items-center gap-1 hover:underline"
              >
                <span>View Full Calendar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Today's Confirmed Bookings */}
            <div className="space-y-3">
              {todayEvents.map(b => (
                <div
                  key={b.id}
                  onClick={() => onViewEvent(b)}
                  className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 hover:border-blue-300 cursor-pointer transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-900 text-white flex flex-col items-center justify-center shrink-0 font-bold text-xs">
                      <span>{b.start_time}</span>
                    </div>
                    <div>
                      <p className="font-extrabold text-sm text-slate-900">{b.event_title}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {b.venue_name}
                        </span>
                        <span>&bull;</span>
                        <span>Host: {b.organizer_name} ({b.department})</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full shrink-0">
                    Confirmed Slot
                  </span>
                </div>
              ))}

              {todayEvents.length === 0 && (
                <p className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  No events scheduled for today. Auditoriums are open for booking!
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              Active Double-Booking Protection Enforced
            </span>
            <span className="font-bold text-blue-900">Database Synchronized</span>
          </div>
        </div>

        {/* Right: Upcoming Events Feed */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-base text-slate-900">
                Upcoming Events
              </h3>
              <button
                onClick={() => onNavigate('events')}
                className="text-xs font-semibold text-blue-900 hover:underline"
              >
                Directory
              </button>
            </div>

            <div className="space-y-3">
              {upcomingEvents.map(b => (
                <div
                  key={b.id}
                  onClick={() => onViewEvent(b)}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 cursor-pointer transition-all space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900">
                      NMAMIT
                    </span>
                    <span className="text-slate-400 font-mono text-[11px] font-semibold">{b.event_date}</span>
                  </div>

                  <p className="font-bold text-slate-900 line-clamp-1">{b.event_title}</p>
                  <p className="text-slate-500 text-[11px] truncate flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    {b.venue_name} &bull; {b.start_time} - {b.end_time}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate('events')}
            className="w-full mt-4 py-2.5 text-center text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Browse All Public Events
          </button>
        </div>

      </div>

      {/* 4. Official NMAMIT Venues Showcase */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Official NMAMIT Venues
            </h2>
            <p className="text-xs text-slate-500">
              Auditoriums and seminar halls on the Nitte campus
            </p>
          </div>

          <button
            onClick={() => onNavigate('book')}
            className="text-xs font-bold text-blue-900 hover:underline flex items-center gap-1"
          >
            <span>See All Venues &amp; Facilities</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Responsive grid preventing card squeezing */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {nmamitVenues.map(venue => (
            <div
              key={venue.id}
              onClick={() => onNavigate('book')}
              className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between h-full"
            >
              <div className="h-32 w-full relative overflow-hidden bg-slate-900 shrink-0">
                <img
                  src={venue.imageUrl || 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80'}
                  alt={venue.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <span className="absolute bottom-2 left-2 text-[10px] font-bold text-white bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs flex items-center gap-1">
                  <Users className="w-3 h-3 text-teal-300" />
                  {venue.capacity} Pax
                </span>
              </div>

              <div className="p-3.5 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-900 group-hover:text-blue-900 line-clamp-1">
                    {venue.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    {venue.location}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-blue-900">
                  <span>Reserve Venue</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
