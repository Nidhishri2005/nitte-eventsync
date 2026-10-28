import React, { useState, useMemo, useEffect } from 'react';
import { 
  Sparkles, 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Search, 
  CheckCircle2, 
  CalendarPlus, 
  Download
} from 'lucide-react';
import { Booking, Venue, Profile, EventCategory } from '../../types';
import { storage } from '../../services/storage';
import { EventModal } from '../common/EventModal';

interface EventsDirectoryPageProps {
  currentUser: Profile;
  onOpenBookWizard?: () => void;
}

type TimelineTab = 'upcoming' | 'all' | 'past';

export const EventsDirectoryPage: React.FC<EventsDirectoryPageProps> = ({
  currentUser,
  onOpenBookWizard,
}) => {
  const [timelineTab, setTimelineTab] = useState<TimelineTab>('upcoming');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<Booking | null>(null);

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

  const todayStr = '2026-10-28';

  // Only active confirmed bookings appear in the public directory (cancelled bookings are excluded)
  const confirmedEvents = useMemo(() => {
    return bookings.filter(b => b.status === 'Confirmed' || b.status === 'Approved');
  }, [bookings]);

  const filteredEvents = useMemo(() => {
    return confirmedEvents.filter(b => {
      const category = b.event_category || b.eventCategory || b.category || '';
      if (selectedCategory !== 'all' && category !== selectedCategory) return false;

      const eventDate = b.event_date || b.date || '';
      if (timelineTab === 'upcoming' && eventDate < todayStr) return false;
      if (timelineTab === 'past' && eventDate >= todayStr) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const v = venues.find(ven => ven.id === (b.venue_id || b.venueId));
        const matchTitle = (b.event_title || b.eventTitle || '').toLowerCase().includes(q);
        const matchDesc = (b.description || b.eventDescription || '').toLowerCase().includes(q);
        const matchDep = (b.department || '').toLowerCase().includes(q);
        const matchVen = (v?.name || b.venue_name || '').toLowerCase().includes(q);
        const matchOrg = (b.organizer_name || b.organizerName || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchDep && !matchVen && !matchOrg) return false;
      }
      return true;
    }).sort((a, b) => {
      const dateA = a.event_date || a.date || '';
      const dateB = b.event_date || b.date || '';
      const timeA = a.start_time || a.startTime || '';
      const timeB = b.start_time || b.startTime || '';

      if (timelineTab === 'past') {
        // Most recent past events first
        if (dateB !== dateA) return dateB.localeCompare(dateA);
        return timeB.localeCompare(timeA);
      }
      // Upcoming events chronologically (earliest first)
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      return timeA.localeCompare(timeB);
    });
  }, [confirmedEvents, selectedCategory, timelineTab, searchQuery, venues]);

  // Counts for timeline tabs
  const counts = useMemo(() => {
    const upcoming = confirmedEvents.filter(b => (b.event_date || b.date || '') >= todayStr).length;
    const past = confirmedEvents.filter(b => (b.event_date || b.date || '') < todayStr).length;
    return {
      all: confirmedEvents.length,
      upcoming,
      past,
    };
  }, [confirmedEvents]);

  // Generate .ics calendar download
  const handleExportICS = (event: Booking) => {
    const title = event.event_title || event.eventTitle || 'Campus Event';
    const date = (event.event_date || event.date || '20261028').replace(/-/g, '');
    const start = (event.start_time || event.startTime || '09:00').replace(':', '') + '00';
    const end = (event.end_time || event.endTime || '12:00').replace(':', '') + '00';
    const desc = (event.description || event.eventDescription || '').replace(/\n/g, ' ');
    const v = venues.find(ven => ven.id === (event.venue_id || event.venueId));
    const location = v ? `${v.name}, ${v.location}, Nitte University` : 'Nitte University Campus';

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Nitte EventSync//NONSGML v1.0//EN',
      'BEGIN:VEVENT',
      `UID:${event.id}@nitte.edu`,
      `DTSTAMP:${date}T${start}Z`,
      `DTSTART:${date}T${start}`,
      `DTEND:${date}T${end}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${desc}`,
      `LOCATION:${location}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Campus Events Directory
            </h1>
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200/60">
              Confirmed Campus Events
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Official confirmed schedule of student hackathons, symposiums, guest lectures, and cultural fests across Nitte University.
          </p>
        </div>

        <button
          onClick={onOpenBookWizard}
          className="px-4 py-2 text-xs sm:text-sm font-bold text-white bg-blue-950 hover:bg-blue-900 rounded-xl transition-colors shadow-xs shrink-0 flex items-center gap-1.5 cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-teal-400" />
          <span>Book an Event</span>
        </button>
      </div>

      {/* Timeline Tabs and Filters */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1">
            {[
              { id: 'upcoming' as TimelineTab, label: 'Upcoming Events', count: counts.upcoming },
              { id: 'all' as TimelineTab, label: 'All Confirmed Events', count: counts.all },
              { id: 'past' as TimelineTab, label: 'Past Events', count: counts.past },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setTimelineTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  timelineTab === tab.id
                    ? 'bg-blue-950 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  timelineTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search event title, topic, speaker..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-900"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-700 font-medium"
          >
            <option value="all">All Categories</option>
            <option value="Technical">Technical &amp; Hackathons</option>
            <option value="Cultural">Cultural &amp; Fests</option>
            <option value="Academic">Academic &amp; Colloquiums</option>
            <option value="Conference">Conferences</option>
            <option value="Workshop">Workshops</option>
            <option value="Sports">Sports Events</option>
            <option value="University Ceremony">University Ceremonies</option>
            <option value="Student Club">Student Clubs</option>
          </select>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map(event => {
          const venue = venues.find(v => v.id === (event.venue_id || event.venueId));
          const eventTitle = event.event_title || event.eventTitle || 'Campus Event';
          const eventDesc = event.description || event.eventDescription || 'No description provided.';
          const eventCategory = event.event_category || event.eventCategory || event.category || 'Event';
          const eventDate = event.event_date || event.date || '';
          const startTime = (event.start_time || event.startTime || '').slice(0, 5);
          const endTime = (event.end_time || event.endTime || '').slice(0, 5);
          const attendees = event.expected_attendees || event.expectedAttendees || 50;

          return (
            <div
              key={event.id}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-700 text-white">
                    Nitte University
                  </span>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    {eventCategory}
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-base text-slate-900 line-clamp-2 leading-snug">
                    {eventTitle}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-3 mt-2 leading-relaxed">
                    {eventDesc}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-900 shrink-0" />
                    <span className="font-semibold text-slate-800">{eventDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{startTime} &ndash; {endTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{venue?.name || event.venue_name || 'Campus Venue'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{attendees} Expected Attendees</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedEvent(event)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  View Details
                </button>

                <button
                  onClick={() => handleExportICS(event)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-900 bg-white hover:bg-blue-50 border border-slate-200 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  title="Add to Google Calendar / Outlook (.ics)"
                >
                  <Download className="w-3.5 h-3.5 text-blue-900" />
                  <span>Save .ics</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredEvents.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <CalendarPlus className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Confirmed Events Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {timelineTab === 'upcoming'
              ? 'There are no upcoming events currently on schedule. Use Book an Event to reserve a venue.'
              : 'No events matching your filter criteria.'}
          </p>
          <button
            onClick={onOpenBookWizard}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-950 hover:bg-blue-900 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>Book the First Event</span>
          </button>
        </div>
      )}

      {selectedEvent && (
        <EventModal
          booking={selectedEvent}
          onClose={() => setSelectedEvent(null)}
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
