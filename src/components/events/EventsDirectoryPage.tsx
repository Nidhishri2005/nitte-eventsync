import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Calendar, 
  MapPin, 
  Users, 
  Download, 
  ArrowRight,
  Sparkles,
  Clock,
  Building
} from 'lucide-react';
import { Booking, Venue, User } from '../../types';
import { storage } from '../../services/storage';
import { EventModal } from '../common/EventModal';

interface EventsDirectoryPageProps {
  currentUser: User;
  onOpenBookWizard: () => void;
}

type TimelineTab = 'upcoming' | 'all' | 'past';

export const EventsDirectoryPage: React.FC<EventsDirectoryPageProps> = ({
  currentUser,
  onOpenBookWizard,
}) => {
  const [bookings, setBookings] = useState<Booking[]>(() => storage.getBookings());
  const [venues, setVenues] = useState<Venue[]>(() => storage.getVenues());

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedInstitution, setSelectedInstitution] = useState<string>('all');
  const [timelineTab, setTimelineTab] = useState<TimelineTab>('upcoming');
  const [activeEvent, setActiveEvent] = useState<Booking | null>(null);

  // Subscribe to real-time storage updates
  useEffect(() => {
    const update = () => {
      setBookings([...storage.getBookings()]);
      setVenues([...storage.getVenues()]);
    };
    update();
    const unsubscribe = storage.subscribe(update);
    return () => unsubscribe();
  }, []);

  const todayStr = '2026-10-27';

  // Only active confirmed bookings appear in the public directory (cancelled bookings are excluded)
  const confirmedEvents = useMemo(() => {
    return bookings.filter(b => b.status === 'Confirmed' || b.status === 'Approved');
  }, [bookings]);

  const filteredEvents = useMemo(() => {
    return confirmedEvents.filter(b => {
      const instId = b.institution_id || b.institutionId || '';
      const email = (b.organizer_email || b.organizerEmail || '').toLowerCase();
      const isNMAMIT = instId === '11111111-1111-1111-1111-111111111111' || instId === 'nmamit' || email.endsWith('@nmamit.in');
      const isNitte = instId === '22222222-2222-2222-2222-222222222222' || instId === 'nitte_edu' || email.endsWith('@nitte.edu');

      if (selectedInstitution === 'nmamit' && !isNMAMIT) return false;
      if (selectedInstitution === 'nitte_edu' && !isNitte) return false;

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
        if (dateA !== dateB) return dateB.localeCompare(dateA);
        return timeB.localeCompare(timeA);
      }
      // Chronological upcoming events first
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      return timeA.localeCompare(timeB);
    });
  }, [confirmedEvents, selectedInstitution, selectedCategory, timelineTab, searchQuery, venues, todayStr]);

  const counts = useMemo(() => {
    return {
      upcoming: confirmedEvents.filter(b => (b.event_date || b.date || '') >= todayStr).length,
      past: confirmedEvents.filter(b => (b.event_date || b.date || '') < todayStr).length,
      all: confirmedEvents.length,
    };
  }, [confirmedEvents, todayStr]);

  const handleDownloadICS = (event: Booking) => {
    const v = venues.find(ven => ven.id === (event.venue_id || event.venueId));
    const title = event.event_title || event.eventTitle || 'Campus Event';
    const desc = event.description || event.eventDescription || '';
    const dateStr = event.event_date || event.date || '2026-10-27';
    const startTimeStr = (event.start_time || event.startTime || '09:00').slice(0, 5);
    const endTimeStr = (event.end_time || event.endTime || '12:00').slice(0, 5);

    const dateFormatted = dateStr.replace(/-/g, '');
    const startFormatted = startTimeStr.replace(/:/g, '') + '00';
    const endFormatted = endTimeStr.replace(/:/g, '') + '00';

    const icsData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Nitte EventSync//Unified Campus Calendar//EN',
      'BEGIN:VEVENT',
      `SUMMARY:${title}`,
      `DESCRIPTION:${desc.replace(/\n/g, ' ')}`,
      `LOCATION:${v?.name || event.venue_name || 'Campus Venue'}, ${v?.location || event.venue_location || ''}`,
      `DTSTART:${dateFormatted}T${startFormatted}`,
      `DTEND:${dateFormatted}T${endFormatted}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 24)}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Cross-Campus Events Directory
            </h1>
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200/60">
              Confirmed Campus Events
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Official confirmed schedule of student hackathons, symposiums, guest lectures, and cultural fests across NMAMIT and Nitte University.
          </p>
        </div>

        <button
          onClick={onOpenBookWizard}
          className="px-4 py-2 text-xs sm:text-sm font-bold text-white bg-blue-950 hover:bg-blue-900 rounded-xl transition-colors shadow-xs shrink-0 flex items-center gap-1.5"
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
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
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
            value={selectedInstitution}
            onChange={e => setSelectedInstitution(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-700 font-medium"
          >
            <option value="all">All Institutions (NMAMIT &amp; Nitte DU)</option>
            <option value="nmamit">NMAMIT Events Only</option>
            <option value="nitte_edu">Nitte University Events Only</option>
          </select>

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
          const instId = event.institution_id || event.institutionId || '';
          const email = (event.organizer_email || event.organizerEmail || '').toLowerCase();
          const isNMAMIT = instId === '11111111-1111-1111-1111-111111111111' || instId === 'nmamit' || email.endsWith('@nmamit.in');

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
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    isNMAMIT ? 'bg-blue-900 text-white' : 'bg-teal-700 text-white'
                  }`}>
                    {isNMAMIT ? 'NMAMIT' : 'Nitte University'}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    {eventCategory}
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-base text-slate-900 line-clamp-2 leading-snug">
                    {eventTitle}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-3 mt-2 leading-relaxed">
                    {eventDesc}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-blue-900 shrink-0" />
                    <span className="font-semibold text-slate-900">{eventDate}</span>
                    <span className="text-slate-400">&bull;</span>
                    <span className="font-mono text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {startTime} - {endTime}
                    </span>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{venue?.name || event.venue_name || 'Campus Venue'} ({venue?.location || event.venue_location || ''})</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Expected: {attendees} Attendees &bull; {event.department || 'Campus Department'}</span>
                  </div>
                </div>
              </div>

              <div className="px-6 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleDownloadICS(event)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-900 transition-colors"
                  title="Add to Google Calendar / Outlook"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save .ics</span>
                </button>

                <button
                  onClick={() => setActiveEvent(event)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-900 hover:underline"
                >
                  <span>Event Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Helpful Empty State */}
      {filteredEvents.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Events Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {confirmedEvents.length === 0 
              ? 'There are currently no confirmed campus events. Book a venue to schedule the first event.'
              : 'No confirmed events match your selected filters. Try choosing "All Confirmed Events" or resetting category filters.'}
          </p>
        </div>
      )}

      <EventModal
        booking={activeEvent}
        onClose={() => setActiveEvent(null)}
        currentUser={currentUser}
        venues={venues}
      />
    </div>
  );
};
