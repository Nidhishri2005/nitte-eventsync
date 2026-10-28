import React from 'react';
import { 
  X, 
  MapPin, 
  Users, 
  Phone, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  ArrowRight
} from 'lucide-react';
import { Venue } from '../../types';
import { storage } from '../../services/storage';

interface VenueDetailsModalProps {
  venue: Venue | null;
  onClose: () => void;
  onBookVenue: (venue: Venue) => void;
}

export const VenueDetailsModal: React.FC<VenueDetailsModalProps> = ({
  venue,
  onClose,
  onBookVenue,
}) => {
  if (!venue) return null;

  const bookings = storage.getBookings().filter(b => 
    (b.venueId === venue.id || b.venue_id === venue.id) && 
    (b.status === 'Confirmed' || b.status === 'Approved')
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative h-64 w-full bg-slate-900">
          <img
            src={venue.imageUrl}
            alt={venue.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />
          
          <div className="absolute bottom-5 left-6 right-6 text-white">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-2 bg-teal-800 text-teal-100">
              Nitte (Deemed to be University)
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {venue.name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-1.5 mt-1">
              <MapPin className="w-4 h-4 text-teal-400 shrink-0" />
              {venue.location}
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Seating Capacity</p>
              <p className="text-lg font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                <Users className="w-4 h-4 text-blue-900" />
                {venue.capacity} Pax
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Block</p>
              <p className="text-sm font-bold text-slate-800 mt-1 truncate">{venue.block}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Floor</p>
              <p className="text-sm font-bold text-slate-800 mt-1">{venue.floor}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Status</p>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Operational
              </span>
            </div>
          </div>

          {venue.description && (
            <div>
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
                Venue Overview
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                {venue.description}
              </p>
            </div>
          )}

          <div>
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
              Official Facilities Provided
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(Array.isArray(venue.facilities) 
                ? venue.facilities 
                : (venue.facilities || '').split(',').map(s => s.trim()).filter(Boolean)
              ).map((fac, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-700 text-xs font-semibold"
                >
                  <div className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span>{fac}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-900" />
                Confirmed Upcoming Schedule
              </h4>
              <span className="text-xs text-slate-500 font-medium">{bookings.length} Events Booked</span>
            </div>

            {bookings.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {bookings.slice(0, 5).map((b) => (
                  <div 
                    key={b.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-blue-50/50 border border-blue-100 text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{b.eventTitle || b.event_title}</p>
                      <p className="text-slate-500 mt-0.5">{b.department} &bull; {b.organizerName || b.organizer_name}</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <span className="font-semibold text-blue-950 block">{b.date || b.event_date}</span>
                      <span className="text-slate-500 flex items-center justify-end gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {(b.startTime || b.start_time || '').slice(0, 5)} - {(b.endTime || b.end_time || '').slice(0, 5)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center">
                No upcoming bookings currently scheduled for this venue. It has full availability!
              </p>
            )}
          </div>

          {venue.contactPerson && (
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
              <Phone className="w-4 h-4 text-slate-400" />
              <span>In-charge Coordinator: <strong>{venue.contactPerson}</strong></span>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onBookVenue(venue);
              }}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-900 to-teal-700 hover:from-blue-950 hover:to-teal-800 transition-all flex items-center gap-2 shadow-md hover:shadow-lg cursor-pointer"
            >
              <span>Book This Venue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
