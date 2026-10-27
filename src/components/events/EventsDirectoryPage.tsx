import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Calendar, 
  MapPin, 
  Users, 
  Download, 
  ArrowRight
} from 'lucide-react';
import { Booking, User } from '../../types';
import { storage } from '../../services/storage';
import { EventModal } from '../common/EventModal';

interface EventsDirectoryPageProps {
  currentUser: User;
  onOpenBookWizard: () => void;
}

export const EventsDirectoryPage: React.FC<EventsDirectoryPageProps> = ({
  currentUser,
  onOpenBookWizard,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedInstitution, setSelectedInstitution] = useState<string>('all');
  const [activeEvent, setActiveEvent] = useState<Booking | null>(null);

  const bookings = storage.getBookings();
  const venues = storage.getVenues();

  const approvedEvents = useMemo(() => {
    return bookings.filter(b => b.status === 'Approved');
  }, [bookings]);

  const filteredEvents = useMemo(() => {
    return approvedEvents.filter(b => {
      if (selectedInstitution !== 'all' && b.institutionId !== selectedInstitution) return false;
      if (selectedCategory !== 'all' && b.eventCategory !== selectedCategory) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const v = venues.find(ven => ven.id === b.venueId);
        const matchTitle = b.eventTitle.toLowerCase().includes(q);
        const matchDesc = b.eventDescription.toLowerCase().includes(q);
        const matchDep = b.department.toLowerCase().includes(q);
        const matchVen = v?.name.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchDep && !matchVen) return false;
      }
      return true;
    });
  }, [approvedEvents, selectedInstitution, selectedCategory, searchQuery, venues]);

  const handleDownloadICS = (event: Booking) => {
    const v = venues.find(ven => ven.id === event.venueId);
    const dateFormatted = event.date.replace(/-/g, '');
    const startFormatted = event.startTime.replace(/:/g, '') + '00';
    const endFormatted = event.endTime.replace(/:/g, '') + '00';

    const icsData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Nitte EventSync//Unified Campus Calendar//EN',
      'BEGIN:VEVENT',
      `SUMMARY:${event.eventTitle}`,
      `DESCRIPTION:${event.eventDescription}`,
      `LOCATION:${v?.name || ''}, ${v?.location || ''}`,
      `DTSTART:${dateFormatted}T${startFormatted}`,
      `DTEND:${dateFormatted}T${endFormatted}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${event.eventTitle.slice(0, 20)}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Cross-Campus Events Directory
            </h1>
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200/60">
              Open Schedule
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Discover student hackathons, symposiums, guest lectures, and cultural fests happening across NMAMIT and Nitte University.
          </p>
        </div>

        <button
          onClick={onOpenBookWizard}
          className="px-4 py-2 text-xs sm:text-sm font-bold text-white bg-blue-900 hover:bg-blue-950 rounded-xl transition-colors shadow-xs"
        >
          Host an Event
        </button>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-3">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map(event => {
          const venue = venues.find(v => v.id === event.venueId);
          const isNMAMIT = event.institutionId === 'nmamit';

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
                    {event.eventCategory}
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-base text-slate-900 line-clamp-2 leading-snug">
                    {event.eventTitle}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-3 mt-2 leading-relaxed">
                    {event.eventDescription}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-blue-900 shrink-0" />
                    <span className="font-semibold text-slate-900">{event.date}</span>
                    <span className="text-slate-400">&bull;</span>
                    <span className="font-mono text-slate-500">{event.startTime} - {event.endTime}</span>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{venue?.name} ({venue?.location})</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Expected: {event.expectedAttendees} Attendees &bull; {event.department}</span>
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

      {filteredEvents.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Events Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try choosing a different category or clearing your search filters.
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
