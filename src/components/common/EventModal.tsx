import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
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

  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const venue = venues.find(v => v.id === booking.venueId);
  const institution = INSTITUTIONS.find(i => i.id === booking.institutionId);

  const canManage = currentUser.role === 'admin' || currentUser.role === 'faculty';
  const isOwner = currentUser.id === booking.userId;

  const handleApprove = () => {
    storage.updateBookingStatus(booking.id, 'Approved', currentUser.name);
    if (onStatusChange) onStatusChange();
    onClose();
  };

  const handleConfirmReject = () => {
    storage.updateBookingStatus(booking.id, 'Rejected', currentUser.name, rejectReason || 'Scheduling or institutional compliance conflict');
    if (onStatusChange) onStatusChange();
    setRejectionModalOpen(false);
    onClose();
  };

  const handleCancelBooking = () => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      storage.cancelBooking(booking.id);
      if (onStatusChange) onStatusChange();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className={`p-6 text-white relative ${
          booking.institutionId === 'nmamit' 
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
              {institution?.shortName}
            </span>
            <span className="text-[11px] font-mono text-slate-300">
              {booking.id}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto mr-7 ${
              booking.status === 'Approved' ? 'bg-emerald-500 text-white' :
              booking.status === 'Pending' ? 'bg-amber-400 text-amber-950' :
              booking.status === 'Rejected' ? 'bg-red-500 text-white' :
              'bg-slate-500 text-white'
            }`}>
              {booking.status}
            </span>
          </div>

          <h3 className="text-xl font-extrabold text-white leading-tight">
            {booking.eventTitle}
          </h3>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-200 mt-2">
            <span className="flex items-center gap-1 font-semibold">
              <Calendar className="w-3.5 h-3.5 text-teal-300" />
              {booking.date}
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1 font-semibold">
              <Clock className="w-3.5 h-3.5 text-teal-300" />
              {booking.startTime} &mdash; {booking.endTime}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-5 text-xs sm:text-sm">
          {booking.status === 'Rejected' && booking.rejectionReason && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-2.5">
              <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs uppercase tracking-wider text-red-700">Rejection Note</p>
                <p className="text-xs mt-0.5">{booking.rejectionReason}</p>
              </div>
            </div>
          )}

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Reserved Venue
            </p>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                  {venue?.name || 'Assigned Venue'}
                </h4>
                <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {venue?.location}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200/50 block">
                  Capacity: {venue?.capacity}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {booking.expectedAttendees} Attendees
                </span>
              </div>
            </div>
          </div>

          {booking.eventDescription && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Event Description &amp; Scope
              </p>
              <p className="text-slate-700 leading-relaxed text-xs sm:text-sm">
                {booking.eventDescription}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Category</p>
              <p className="font-semibold text-slate-800 mt-0.5">{booking.eventCategory}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Department</p>
              <p className="font-semibold text-slate-800 mt-0.5">{booking.department}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Organizer Name</p>
              <p className="font-semibold text-slate-800 mt-0.5">{booking.organizerName}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Official Email</p>
              <p className="font-semibold text-slate-800 mt-0.5 truncate">{booking.organizerEmail}</p>
            </div>
          </div>

          {booking.specialRequirements && (
            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-xs">
              <p className="font-bold text-blue-900">Facilities / AV Request:</p>
              <p className="text-blue-800 mt-0.5">{booking.specialRequirements}</p>
            </div>
          )}

          {booking.approvedBy && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>Approved by: <strong>{booking.approvedBy}</strong></span>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            {(isOwner || currentUser.role === 'admin') && booking.status !== 'Cancelled' && (
              <button
                onClick={handleCancelBooking}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Cancel Booking
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              {canManage && booking.status === 'Pending' && (
                <>
                  <button
                    onClick={() => setRejectionModalOpen(true)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-red-700 bg-red-100 hover:bg-red-200 transition-colors"
                  >
                    Reject Request
                  </button>
                  <button
                    onClick={handleApprove}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve Request
                  </button>
                </>
              )}

              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>

          {rejectionModalOpen && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-300 mt-3 animate-in fade-in duration-100">
              <h5 className="font-bold text-red-950 text-xs mb-1">State Reason for Rejection:</h5>
              <textarea
                rows={2}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="e.g. Venue reserved for institutional accreditation or repair work..."
                className="w-full p-2 text-xs rounded-lg border border-red-300 bg-white"
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setRejectionModalOpen(false)}
                  className="px-3 py-1 rounded-lg text-xs text-slate-600 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReject}
                  className="px-3 py-1 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
