import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Building2, 
  Calendar, 
  PlusCircle, 
  Check, 
  X, 
  TrendingUp, 
  PieChart, 
  Download,
  AlertTriangle,
  ShieldCheck
} from 'lucide-react';
import { Booking, User } from '../../types';
import { storage } from '../../services/storage';
import { AddVenueModal } from '../venues/AddVenueModal';

interface AdminPanelPageProps {
  currentUser: User;
}

export const AdminPanelPage: React.FC<AdminPanelPageProps> = ({ currentUser }) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'approvals' | 'conflicts' | 'venues' | 'analytics'>('approvals');
  const [isAddVenueOpen, setIsAddVenueOpen] = useState(false);

  const [rejectingBooking, setRejectingBooking] = useState<Booking | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const bookings = storage.getBookings();
  const venues = storage.getVenues();
  const stats = storage.getStats();

  const pendingBookings = useMemo(() => {
    return bookings.filter(b => b.status === 'Pending');
  }, [bookings]);

  const handleApprove = (booking: Booking) => {
    storage.updateBookingStatus(booking.id, 'Approved', currentUser.name);
  };

  const handleOpenReject = (booking: Booking) => {
    setRejectingBooking(booking);
    setRejectReason('');
  };

  const handleConfirmReject = () => {
    if (!rejectingBooking) return;
    storage.updateBookingStatus(
      rejectingBooking.id, 
      'Rejected', 
      currentUser.name, 
      rejectReason || 'Administrative or schedule overlap conflict'
    );
    setRejectingBooking(null);
  };

  const handleToggleVenueAvailability = (venueId: string, currentStatus: boolean) => {
    storage.updateVenue(venueId, { isAvailable: !currentStatus });
  };

  const handleExportCSV = () => {
    const headers = ['Booking ID', 'Institution', 'Venue', 'Event Title', 'Date', 'Start Time', 'End Time', 'Attendees', 'Department', 'Organizer', 'Status'];
    const rows = bookings.map(b => {
      const v = venues.find(ven => ven.id === b.venueId);
      return [
        b.id,
        b.institutionId === 'nmamit' ? 'NMAMIT' : 'Nitte DU',
        `"${v?.name || ''}"`,
        `"${b.eventTitle.replace(/"/g, '""')}"`,
        b.date,
        b.startTime,
        b.endTime,
        b.expectedAttendees,
        `"${b.department}"`,
        `"${b.organizerName}"`,
        b.status
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Nitte_EventSync_Bookings_Report_${new Date().toISOString().slice(0, 10)}.csv`);
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
              Institutional Admin &amp; Approvals
            </h1>
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
              Authority Panel
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Logged in as <strong>{currentUser.name}</strong> ({currentUser.role.toUpperCase()} &bull; {currentUser.department})
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV Report</span>
          </button>

          <button
            onClick={() => setIsAddVenueOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-950 rounded-xl shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Venue</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Bookings</span>
            <Calendar className="w-4 h-4 text-blue-900" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{stats.totalBookings}</p>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
            <span className="text-blue-900 font-semibold">{stats.nmamitBookings} NMAMIT</span> &bull; 
            <span className="text-teal-700 font-semibold">{stats.nitteBookings} Nitte DU</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs bg-amber-50/20">
          <div className="flex items-center justify-between text-amber-800 text-xs font-bold uppercase tracking-wider">
            <span>Pending Approvals</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-900 mt-2">{stats.pendingCount}</p>
          <p className="text-[11px] text-amber-700 mt-1">Requires immediate review</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs bg-emerald-50/20">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <span>Approved &amp; Scheduled</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-900 mt-2">{stats.approvedCount}</p>
          <p className="text-[11px] text-emerald-700 mt-1">Live on Common Calendar</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Active Venues</span>
            <Building2 className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{stats.venuesCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Across both campuses</p>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-bold">
        {[
          { id: 'approvals', label: `Pending Approvals (${pendingBookings.length})` },
          { id: 'conflicts', label: 'Double-Booking Conflict Monitor' },
          { id: 'venues', label: 'Venue Directory & Status' },
          { id: 'analytics', label: 'Utilization & Analytics' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveAdminTab(tab.id as any)}
            className={`pb-3 px-3 transition-all relative ${
              activeAdminTab === tab.id
                ? 'text-blue-950 border-b-2 border-blue-900 font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeAdminTab === 'approvals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900">
              Booking Approval Requests
            </h3>
            <span className="text-xs text-slate-500">{pendingBookings.length} waiting for decision</span>
          </div>

          {pendingBookings.map((b) => {
            const venue = venues.find(v => v.id === (b.venue_id || b.venueId));
            const conflict = storage.checkAvailability(
              b.venue_id || b.venueId || '', 
              b.event_date || b.date || '', 
              b.start_time || b.startTime || '', 
              b.end_time || b.endTime || '', 
              b.id
            );
            const hasConflict = !conflict.isAvailable;

            return (
              <div
                key={b.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                      {b.id}
                    </span>
                    <span className="text-xs font-bold text-slate-700">
                      {(b.institution_id === '11111111-1111-1111-1111-111111111111' || b.institutionId === 'nmamit') ? 'NMAMIT' : 'Nitte University'}
                    </span>
                    <span className="text-slate-300">&bull;</span>
                    <span className="text-xs text-slate-500 font-medium">
                      Submitted {new Date(b.created_at || b.createdAt || Date.now()).toLocaleDateString()}
                    </span>
                  </div>

                  {hasConflict ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Slot Overlap Detected!
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Zero Overlap
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <h4 className="font-extrabold text-base text-slate-900">{b.event_title || b.eventTitle}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{b.description || b.eventDescription}</p>

                    <div className="flex flex-wrap gap-3 text-xs text-slate-500 pt-1">
                      <span><strong>Organizer:</strong> {b.organizer_name || b.organizerName}</span>
                      <span>&bull;</span>
                      <span><strong>Dept:</strong> {b.department}</span>
                      <span>&bull;</span>
                      <span><strong>Attendees:</strong> {b.expected_attendees || b.expectedAttendees} Pax</span>
                    </div>

                    {(b.specialRequirements || b.special_requirements) && (
                      <p className="text-xs text-blue-900 bg-blue-50 p-2 rounded-lg border border-blue-100">
                        <strong>AV / Facility Request:</strong> {b.specialRequirements || b.special_requirements}
                      </p>
                    )}
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 text-xs space-y-2">
                    <p className="text-[10px] font-bold uppercase text-slate-400">Target Venue</p>
                    <p className="font-bold text-slate-900 text-sm">{venue?.name || b.venue_name}</p>
                    <p className="text-slate-600">{venue?.location || b.venue_location}</p>
                    
                    <div className="pt-2 border-t border-slate-200 text-slate-700 space-y-1">
                      <p><strong>Date:</strong> {b.event_date || b.date}</p>
                      <p><strong>Time:</strong> {b.start_time || b.startTime} &mdash; {b.end_time || b.endTime}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleOpenReject(b)}
                    className="px-4 py-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <X className="w-4 h-4" />
                    <span>Reject with Reason</span>
                  </button>

                  <button
                    disabled={hasConflict}
                    onClick={() => handleApprove(b)}
                    className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve &amp; Publish to Calendar</span>
                  </button>
                </div>
              </div>
            );
          })}

          {pendingBookings.length === 0 && (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">All Approvals Clear!</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No pending venue booking requests waiting for clearance.
              </p>
            </div>
          )}
        </div>
      )}

      {activeAdminTab === 'conflicts' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl text-xs text-blue-900">
            <h4 className="font-bold text-sm text-blue-950 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-900" />
              Algorithmic Zero Double-Booking Protection
            </h4>
            <p className="mt-1">
              The engine automatically validates every incoming request using interval intersection logic:
              <code className="mx-1 bg-white px-2 py-0.5 rounded font-mono font-bold text-blue-950">
                (req.start &lt; existing.end) &amp;&amp; (req.end &gt; existing.start)
              </code>
              No two events can occupy the same venue at the same time.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <h4 className="font-bold text-sm text-slate-900">Active Approved Reservations Overview</h4>
            <div className="divide-y divide-slate-100 text-xs">
              {bookings.filter(b => b.status === 'Approved').map(b => {
                const v = venues.find(ven => ven.id === b.venueId);
                return (
                  <div key={b.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{b.eventTitle}</p>
                      <p className="text-slate-500 mt-0.5">{v?.name} &bull; {b.organizerName} ({b.department})</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-blue-900">{b.date}</span>
                      <p className="text-slate-500 font-mono mt-0.5">{b.startTime} - {b.endTime}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeAdminTab === 'venues' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900">
              Campus Venue Directory &amp; Maintenance
            </h3>
            <button
              onClick={() => setIsAddVenueOpen(true)}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-900 rounded-xl"
            >
              + Add Venue
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {venues.map((v) => (
              <div key={v.id} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={v.imageUrl}
                    alt={v.name}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-sm text-slate-900">{v.name}</h4>
                      <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-semibold">
                        {v.institutionId === 'nmamit' ? 'NMAMIT' : 'Nitte DU'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{v.location}</p>
                    <p className="text-xs text-slate-600 font-semibold mt-1">Capacity: {v.capacity} Seats</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <button
                    onClick={() => handleToggleVenueAvailability(v.id, v.isAvailable)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                      v.isAvailable 
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                    }`}
                  >
                    {v.isAvailable ? 'Operational' : 'In Maintenance'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeAdminTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <h4 className="font-bold text-sm text-slate-900 mb-4 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-blue-900" />
                Bookings By Institution
              </h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-blue-950">NMAMIT (nmamit.in)</span>
                    <span className="text-blue-950">{stats.nmamitBookings} ({Math.round((stats.nmamitBookings / Math.max(stats.totalBookings, 1)) * 100)}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3">
                    <div 
                      className="bg-blue-900 h-3 rounded-full" 
                      style={{ width: `${(stats.nmamitBookings / Math.max(stats.totalBookings, 1)) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-teal-900">Nitte University (nitte.edu)</span>
                    <span className="text-teal-900">{stats.nitteBookings} ({Math.round((stats.nitteBookings / Math.max(stats.totalBookings, 1)) * 100)}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3">
                    <div 
                      className="bg-teal-600 h-3 rounded-full" 
                      style={{ width: `${(stats.nitteBookings / Math.max(stats.totalBookings, 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <h4 className="font-bold text-sm text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                Venue Demand &amp; Utilization
              </h4>
              <div className="space-y-2.5 text-xs">
                {venues.slice(0, 5).map(v => {
                  const venueBookingsCount = bookings.filter(b => b.venueId === v.id).length;
                  return (
                    <div key={v.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                      <div>
                        <p className="font-bold text-slate-800">{v.name}</p>
                        <p className="text-[10px] text-slate-500">{v.block}</p>
                      </div>
                      <span className="font-extrabold text-blue-900 bg-blue-100 px-2.5 py-1 rounded-lg">
                        {venueBookingsCount} Events
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {rejectingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h4 className="text-base font-bold text-slate-900">Reject Booking Request</h4>
            <p className="text-xs text-slate-600">
              Please enter an official explanation for rejecting <strong>{rejectingBooking.eventTitle}</strong>. 
              The student/organizer will be notified.
            </p>

            <textarea
              rows={3}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Schedule clash with NBA Accreditation or scheduled auditorium maintenance..."
              className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-red-500"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectingBooking(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      <AddVenueModal
        isOpen={isAddVenueOpen}
        onClose={() => setIsAddVenueOpen(false)}
        onVenueAdded={() => setIsAddVenueOpen(false)}
      />
    </div>
  );
};
