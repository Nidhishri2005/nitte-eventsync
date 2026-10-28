import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  Users, 
  Check, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  Printer, 
  ArrowLeft, 
  ArrowRight,
  Sparkles,
  MapPin,
  Building2
} from 'lucide-react';
import { Venue, Booking, Profile, EventCategory } from '../../types';
import { storage } from '../../services/storage';

interface BookVenueModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedVenue?: Venue | null;
  currentUser: Profile;
  onBookingCreated?: (booking: Booking) => void;
}

export const BookVenueModal: React.FC<BookVenueModalProps> = ({
  isOpen,
  onClose,
  preselectedVenue,
  currentUser,
  onBookingCreated,
}) => {
  if (!isOpen) return null;

  const venues = storage.getVenues();
  const [step, setStep] = useState<number>(preselectedVenue ? 2 : 1);
  const [selectedVenueId, setSelectedVenueId] = useState<string>(
    preselectedVenue ? preselectedVenue.id : (venues.length > 0 ? venues[0].id : '')
  );
  
  const defaultDate = '2026-10-28';
  const [eventDate, setEventDate] = useState<string>(defaultDate);
  const [startTime, setStartTime] = useState<string>('09:30');
  const [endTime, setEndTime] = useState<string>('12:30');

  const [eventTitle, setEventTitle] = useState<string>('');
  const [eventDescription, setEventDescription] = useState<string>('');
  const [eventCategory, setEventCategory] = useState<EventCategory>('Technical');
  const [expectedAttendees, setExpectedAttendees] = useState<number>(100);
  const [organizerName, setOrganizerName] = useState<string>(storage.getUserDisplayName(currentUser));
  const [organizerEmail, setOrganizerEmail] = useState<string>(currentUser.email);
  const [organizerPhone, setOrganizerPhone] = useState<string>(currentUser.phone || '+91 824 2204300');
  const [department, setDepartment] = useState<string>(currentUser.department || 'Nitte University');
  const [specialRequirements, setSpecialRequirements] = useState<string>('');

  const [conflictResult, setConflictResult] = useState<{
    isAvailable: boolean;
    reason?: string;
    conflictingBookings: Booking[];
  }>({ isAvailable: true, conflictingBookings: [] });

  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (preselectedVenue) {
      setSelectedVenueId(preselectedVenue.id);
      setStep(2);
    }
  }, [preselectedVenue]);

  useEffect(() => {
    if (selectedVenueId && eventDate && startTime && endTime) {
      const check = storage.checkAvailability(selectedVenueId, eventDate, startTime, endTime);
      setConflictResult(check);
    }
  }, [selectedVenueId, eventDate, startTime, endTime]);

  const selectedVenue = venues.find(v => v.id === selectedVenueId);

  const handleSubmitBooking = async () => {
    setErrorMessage('');

    if (!selectedVenueId) {
      setErrorMessage('Please select a venue.');
      return;
    }
    if (!eventTitle.trim()) {
      setErrorMessage('Please enter an event title.');
      return;
    }
    if (expectedAttendees <= 0) {
      setErrorMessage('Expected attendees must be greater than zero.');
      return;
    }

    if (selectedVenue && expectedAttendees > selectedVenue.capacity) {
      setErrorMessage(`Expected attendees (${expectedAttendees}) exceeds venue capacity of ${selectedVenue.capacity}.`);
      return;
    }

    const result = await storage.createBooking({
      venueId: selectedVenueId,
      institutionId: '22222222-2222-2222-2222-222222222222',
      eventTitle: eventTitle.trim(),
      eventDescription: eventDescription.trim(),
      eventCategory,
      date: eventDate,
      startTime,
      endTime,
      expectedAttendees: Number(expectedAttendees),
      organizerName: organizerName.trim(),
      organizerEmail: organizerEmail.trim(),
      organizerPhone: organizerPhone.trim(),
      department: department.trim(),
      userId: currentUser.id,
      specialRequirements: specialRequirements.trim(),
    });

    if (result.success && result.booking) {
      setCreatedBooking(result.booking);
      setStep(6);
      if (onBookingCreated) {
        onBookingCreated(result.booking);
      }
    } else {
      setErrorMessage(result.error || 'Failed to submit booking due to a schedule conflict.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden relative animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Book a Venue &mdash; Nitte University</h3>
              <p className="text-xs text-slate-300">Direct Reservation &amp; Double-Booking Prevention</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 6-Step Indicator */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 shrink-0 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[500px] text-xs">
            {[
              { num: 1, label: 'Select Venue' },
              { num: 2, label: 'Date & Time' },
              { num: 3, label: 'Details' },
              { num: 4, label: 'Availability' },
              { num: 5, label: 'Review & Submit' },
              { num: 6, label: 'Confirmed Receipt' },
            ].map(s => {
              const isActive = step === s.num;
              const isPassed = step > s.num;
              return (
                <div key={s.num} className="flex items-center gap-1.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                    isPassed 
                      ? 'bg-teal-600 text-white' 
                      : isActive 
                      ? 'bg-blue-900 text-white ring-2 ring-blue-300' 
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    {isPassed ? <Check className="w-3.5 h-3.5" /> : s.num}
                  </div>
                  <span className={`text-[11px] whitespace-nowrap ${
                    isActive ? 'font-bold text-blue-950' : isPassed ? 'font-medium text-teal-900' : 'text-slate-400'
                  }`}>
                    {s.label}
                  </span>
                  {s.num < 6 && <span className="text-slate-300 mx-1">&rsaquo;</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Booking Blocked</p>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {/* STEP 1: Select Venue */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-bold text-slate-900">Step 1: Select Venue</h4>
                <p className="text-xs text-slate-500">
                  Select a verified auditorium or seminar hall across Nitte University
                </p>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {venues.map((v) => {
                  const isSelected = selectedVenueId === v.id;
                  return (
                    <div
                      key={v.id}
                      onClick={() => setSelectedVenueId(v.id)}
                      className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                        isSelected 
                          ? 'border-blue-900 bg-blue-50/50 shadow-md ring-2 ring-blue-900/10' 
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={v.imageUrl}
                          alt={v.name}
                          className="w-16 h-16 rounded-xl object-cover shrink-0 shadow-xs"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-bold text-sm text-slate-900">{v.name}</h5>
                            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                              {v.floor}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{v.location}</p>
                          <div className="flex items-center gap-3 text-xs text-slate-600 mt-1">
                            <span className="font-semibold text-teal-800 flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" />
                              Capacity: {v.capacity} Pax
                            </span>
                            <span className="text-slate-400">&bull;</span>
                            <span className="truncate max-w-[200px] text-slate-500">
                              {Array.isArray(v.facilities) ? v.facilities.slice(0, 3).join(', ') : (v.facilities || '')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {isSelected ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-900 bg-blue-100 px-3 py-1 rounded-full">
                            <Check className="w-3.5 h-3.5" /> Selected
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                            Select
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Select Date and Time */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-bold text-slate-900">Step 2: Select Date and Time</h4>
                <p className="text-xs text-slate-500">
                  Target Venue: <strong>{selectedVenue?.name}</strong> ({selectedVenue?.location})
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Event Date</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className={`p-4 rounded-2xl border text-xs ${
                conflictResult.isAvailable 
                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' 
                  : 'bg-red-50/70 border-red-200 text-red-900'
              }`}>
                <div className="flex items-center gap-2 font-bold mb-1">
                  {conflictResult.isAvailable ? (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Slot is Available</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span>Double-Booking Conflict Detected</span>
                    </>
                  )}
                </div>
                <p className="text-xs">
                  {conflictResult.isAvailable
                    ? `${selectedVenue?.name} is free on ${eventDate} from ${startTime} to ${endTime}. You can proceed directly.`
                    : (conflictResult.reason || 'This slot is already booked. Please choose another slot.')}
                </p>
              </div>

              {/* Schedule on this date */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <p className="font-semibold text-slate-700 mb-1">Bookings on {eventDate} for {selectedVenue?.name}:</p>
                {storage.getBookings().filter(b => (b.venueId === selectedVenueId || b.venue_id === selectedVenueId) && (b.date === eventDate || b.event_date === eventDate) && b.status !== 'Cancelled').length === 0 ? (
                  <p className="text-slate-500 italic">No bookings on this day yet. Entire day is open.</p>
                ) : (
                  <div className="space-y-1">
                    {storage.getBookings().filter(b => (b.venueId === selectedVenueId || b.venue_id === selectedVenueId) && (b.date === eventDate || b.event_date === eventDate) && b.status !== 'Cancelled').map(b => (
                      <div key={b.id} className="flex items-center justify-between p-1.5 bg-white rounded-lg border border-slate-200">
                        <span className="font-medium text-slate-800">{b.eventTitle || b.event_title}</span>
                        <span className="font-mono text-slate-500">{(b.startTime || b.start_time || '').slice(0, 5)} - {(b.endTime || b.end_time || '').slice(0, 5)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Event Details */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-bold text-slate-900">Step 3: Event Details</h4>
                <p className="text-xs text-slate-500">Provide description, category, and attendee count</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Event Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. National Symposium on Quantum Computing"
                  value={eventTitle}
                  onChange={e => setEventTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Event Category</label>
                  <select
                    value={eventCategory}
                    onChange={e => setEventCategory(e.target.value as EventCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Academic">Academic</option>
                    <option value="Conference">Conference</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Sports">Sports</option>
                    <option value="University Ceremony">University Ceremony</option>
                    <option value="Student Club">Student Club</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Expected Attendees (Max: {selectedVenue?.capacity || 350})
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={selectedVenue?.capacity || 2500}
                    value={expectedAttendees}
                    onChange={e => setExpectedAttendees(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Event Description &amp; Objectives</label>
                <textarea
                  rows={3}
                  placeholder="State the purpose of the event, chief guest info, agenda summary..."
                  value={eventDescription}
                  onChange={e => setEventDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Organizer Name</label>
                  <input
                    type="text"
                    value={organizerName}
                    onChange={e => setOrganizerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Department / Society</label>
                  <input
                    type="text"
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Special Facilities or Equipment Needs</label>
                <input
                  type="text"
                  placeholder="e.g. Podium mic, wireless handheld mics, HDMI switcher"
                  value={specialRequirements}
                  onChange={e => setSpecialRequirements(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {/* STEP 4: Conflict Check & Availability Verification */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-bold text-slate-900">Step 4: Availability Verification</h4>
                <p className="text-xs text-slate-500">
                  Automated Conflict Prevention Check
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div><strong>Venue:</strong> {selectedVenue?.name}</div>
                  <div><strong>Campus:</strong> Nitte University</div>
                  <div><strong>Date:</strong> {eventDate}</div>
                  <div><strong>Window:</strong> {startTime} &ndash; {endTime}</div>
                  <div><strong>Title:</strong> {eventTitle}</div>
                  <div><strong>Attendees:</strong> {expectedAttendees} / {selectedVenue?.capacity}</div>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border ${
                conflictResult.isAvailable 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}>
                <div className="flex items-center gap-2 font-bold text-sm mb-1">
                  {conflictResult.isAvailable ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span>Zero Conflicts Detected &mdash; Venue is Free</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <span>Double-Booking Conflict Identified</span>
                    </>
                  )}
                </div>
                <p className="text-xs">
                  {conflictResult.isAvailable 
                    ? `The selected slot for ${selectedVenue?.name} on ${eventDate} (${startTime} - ${endTime}) is fully available for booking.`
                    : conflictResult.reason}
                </p>
              </div>
            </div>
          )}

          {/* STEP 5: Review & Direct Confirmation */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-bold text-slate-900">Step 5: Review &amp; Direct Confirmation</h4>
                <p className="text-xs text-slate-500">
                  Final verification before saving your confirmed booking directly to the database.
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50/50 to-teal-50/50 p-5 rounded-2xl border border-slate-200 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div>
                    <h5 className="font-bold text-sm text-slate-900">{eventTitle}</h5>
                    <p className="text-slate-500">{eventCategory} Event</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Direct Confirmation
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-700">
                  <div><strong>Venue:</strong> {selectedVenue?.name}</div>
                  <div><strong>Location:</strong> {selectedVenue?.location}</div>
                  <div><strong>Campus:</strong> Nitte University</div>
                  <div><strong>Date:</strong> {eventDate}</div>
                  <div><strong>Time Slot:</strong> {startTime} &ndash; {endTime}</div>
                  <div><strong>Expected Attendees:</strong> {expectedAttendees} Pax</div>
                  <div><strong>Organizer:</strong> {organizerName}</div>
                  <div><strong>Department:</strong> {department}</div>
                  <div><strong>Contact Email:</strong> {organizerEmail}</div>
                  <div><strong>Phone:</strong> {organizerPhone}</div>
                </div>

                {specialRequirements && (
                  <div className="pt-2 border-t border-slate-200 text-slate-600">
                    <strong>Special Requirements:</strong> {specialRequirements}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 6: Confirmed Booking Receipt */}
          {step === 6 && createdBooking && (
            <div className="space-y-5 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <Check className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-xl font-black text-slate-900">Booking Confirmed!</h4>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Your reservation for <strong>{selectedVenue?.name}</strong> has been saved directly to the database.
                </p>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-left text-xs max-w-md mx-auto space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="font-semibold text-slate-500">Booking Reference:</span>
                  <span className="font-mono font-bold text-blue-900">{createdBooking.id.slice(0, 13)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Event:</span>
                  <span className="font-bold text-slate-800">{createdBooking.event_title || createdBooking.eventTitle}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Venue:</span>
                  <span className="font-bold text-slate-800">{selectedVenue?.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Campus:</span>
                  <span className="font-bold text-teal-800">Nitte University</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Date &amp; Time:</span>
                  <span className="font-medium text-slate-800">
                    {createdBooking.event_date || createdBooking.date} &bull; {(createdBooking.start_time || createdBooking.startTime || '').slice(0, 5)} - {(createdBooking.end_time || createdBooking.endTime || '').slice(0, 5)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Confirmed</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Save Pass</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-blue-900 hover:bg-blue-950 transition-colors cursor-pointer"
                >
                  Done &amp; View in My Bookings
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        {step < 6 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
            <button
              onClick={() => {
                if (step === 1) onClose();
                else setStep(step - 1);
              }}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{step === 1 ? 'Cancel' : 'Previous'}</span>
            </button>

            <div className="flex items-center gap-2">
              {step < 5 ? (
                <button
                  disabled={
                    (step === 1 && !selectedVenueId) ||
                    (step === 2 && !conflictResult.isAvailable) ||
                    (step === 3 && (!eventTitle.trim() || expectedAttendees <= 0)) ||
                    (step === 4 && !conflictResult.isAvailable)
                  }
                  onClick={() => {
                    if (step === 1 && !selectedVenueId) return;
                    if (step === 2 && !conflictResult.isAvailable) return;
                    if (step === 3 && (!eventTitle.trim() || expectedAttendees <= 0)) {
                      setErrorMessage('Please fill in required fields (Title, Attendees).');
                      return;
                    }
                    setErrorMessage('');
                    setStep(step + 1);
                  }}
                  className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-blue-900 hover:bg-blue-950 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmitBooking}
                  className="px-6 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-900 to-teal-700 hover:from-blue-950 hover:to-teal-800 transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm &amp; Book Venue</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
