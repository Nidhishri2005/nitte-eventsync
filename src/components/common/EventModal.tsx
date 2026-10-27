import React from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Trash2,
  FileCheck
} from 'lucide-react';
import { Booking, User, Venue } from '../../types';
import { INSTITUTIONS } from '../../data/initialData';
import { storage } from '../../services/storage';

interface EventModalProps {
  booking: Booking | null;
  onClose: () => void;
  currentUser: User;
  venues: Venue[];
  onStatusChange?: () => void;
}

export const EventModal: React.FC<EventModalProps> = ({
  booking,
  onClose,
  currentUser,
  venues,
  onStatusChange,
}) => {
  if (!booking) return null;

  const venue = venues.find(v => v.id === (booking.venue_id || booking.venueId));
  const institution = INSTITUTIONS.find(i => i.id === (booking.institution_id || booking.institutionId));

  // Identity check: current user is the booking owner
  const isOwner = currentUser.id === (booking.organizer_id || booking.userId) || 
                  currentUser.email.toLowerCase() === (booking.organizer_email || booking.organizerEmail || '').toLowerCase();

  // Any user can cancel their own active booking
  const canCancel = isOwner && booking.status !== 'Cancelled';

  const handleCancelBooking = async () => {
    if (window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      await storage.cancelBooking(booking.id);
      if (onStatusChange) onStatusChange();
      onClose();
    }
  };

  const isConfirmed = booking.status === 'Confirmed' || booking.status === 'Approved';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className={`p-6 text-white relative ${
          (booking.institution_id === '11111111-1111-1111-1111-111111111111' || booking.institutionId === 'nmamit')
            ? 'bg-gradient-to-r from-blue-950 to-blue-900' 
            : 'bg-gradient-to-r from-teal-900 to-teal-800'
        }`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md">
              {institution?.shortName || 'NMAMIT'}
            </span>
            <span className="text-[11px] font-mono text-slate-300">
              {booking.id.slice(0, 13)}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto mr-7 ${
              isConfirmed ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white'
            }`}>
              {isConfirmed ? 'Confirmed' : 'Cancelled'}
            </span>
          </div>

          <h3 className="text-xl font-extrabold text-white leading-tight">
            {booking.event_title || booking.eventTitle}
          </h3>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-200 mt-2">
            <span className="flex items-center gap-1 font-semibold">
              <Calendar className="w-3.5 h-3.5 text-teal-300" />
              {booking.event_date || booking.date}
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1 font-semibold">
              <Clock className="w-3.5 h-3.5 text-teal-300" />
              {booking.start_time || booking.startTime} &mdash; {booking.end_time || booking.endTime}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-5 text-xs sm:text-sm">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Reserved Venue
            </p>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                  {venue?.name || booking.venue_name || 'Assigned Venue'}
                </h4>
                <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {venue?.location || booking.venue_location}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200/50 block">
                  Capacity: {venue?.capacity || 200}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {booking.expected_attendees || booking.expectedAttendees} Attendees
                </span>
              </div>
            </div>
          </div>

          {(booking.description || booking.eventDescription) && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Event Description &amp; Purpose
              </p>
              <p className="text-slate-700 leading-relaxed text-xs sm:text-sm">
                {booking.description || booking.eventDescription}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Category</p>
              <p className="font-semibold text-slate-800 mt-0.5">{booking.event_category || booking.eventCategory}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Department</p>
              <p className="font-semibold text-slate-800 mt-0.5">{booking.department}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Organizer Name</p>
              <p className="font-semibold text-slate-800 mt-0.5">{booking.organizer_name || booking.organizerName}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Official Email</p>
              <p className="font-semibold text-slate-800 mt-0.5 truncate">{booking.organizer_email || booking.organizerEmail}</p>
            </div>
          </div>

          {(booking.special_requirements || booking.specialRequirements) && (
            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-xs">
              <p className="font-bold text-blue-900">Facilities / AV Request:</p>
              <p className="text-blue-800 mt-0.5">{booking.special_requirements || booking.specialRequirements}</p>
            </div>
          )}

          {isConfirmed && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>Status: <strong className="text-emerald-700">Directly Confirmed Booking</strong></span>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
            {canCancel ? (
              <button
                onClick={handleCancelBooking}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Cancel Booking
              </button>
            ) : <div />}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
