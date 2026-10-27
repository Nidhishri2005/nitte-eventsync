import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Calendar, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Printer, 
  ShieldCheck, 
  Info 
} from 'lucide-react';
import { Venue, InstitutionId, EventCategory, Booking, User } from '../../types';
import { storage } from '../../services/storage';
import { INSTITUTIONS } from '../../data/initialData';

interface BookVenueModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedVenue?: Venue | null;
  currentUser: User;
  onBookingCreated?: (booking: Booking) => void;
}

const EVENT_CATEGORIES: EventCategory[] = [
  'Technical',
  'Cultural',
  'Academic',
  'Conference',
  'Workshop',
  'Sports',
  'University Ceremony',
  'Student Club',
];

export const BookVenueModal: React.FC<BookVenueModalProps> = ({
  isOpen,
  onClose,
  preselectedVenue,
  currentUser,
  onBookingCreated,
}) => {
  if (!isOpen) return null;

  const [step, setStep] = useState<number>(1);
  const venues = storage.getVenues();

  const [selectedInstitution, setSelectedInstitution] = useState<InstitutionId>(
    preselectedVenue ? preselectedVenue.institutionId : currentUser.institutionId
  );
  const [selectedVenueId, setSelectedVenueId] = useState<string>(
    preselectedVenue ? preselectedVenue.id : ''
  );
  
  const defaultDate = '2026-10-28';
  const [eventDate, setEventDate] = useState<string>(defaultDate);
  const [startTime, setStartTime] = useState<string>('09:30');
  const [endTime, setEndTime] = useState<string>('12:30');

  const [eventTitle, setEventTitle] = useState<string>('');
  const [eventDescription, setEventDescription] = useState<string>('');
  const [eventCategory, setEventCategory] = useState<EventCategory>('Technical');
  const [expectedAttendees, setExpectedAttendees] = useState<number>(100);
  const [organizerName, setOrganizerName] = useState<string>(currentUser.name);
  const [organizerEmail, setOrganizerEmail] = useState<string>(currentUser.email);
  const [organizerPhone, setOrganizerPhone] = useState<string>(currentUser.phone || '+91 94821 55667');
  const [department, setDepartment] = useState<string>(currentUser.department);
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
      setSelectedInstitution(preselectedVenue.institutionId);
      setSelectedVenueId(preselectedVenue.id);
      setStep(3);
    }
  }, [preselectedVenue]);

  useEffect(() => {
    if (selectedVenueId && eventDate && startTime && endTime) {
      const check = storage.checkAvailability(selectedVenueId, eventDate, startTime, endTime);
      setConflictResult(check);
    }
  }, [selectedVenueId, eventDate, startTime, endTime]);

  const selectedVenue = venues.find(v => v.id === selectedVenueId);
  const currentInstitution = INSTITUTIONS.find(i => i.id === selectedInstitution);
  const filteredVenues = venues.filter(v => (v.institution_id || v.institutionId) === selectedInstitution || !v.institution_id);

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
      institutionId: selectedInstitution,
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
      setStep(7);
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
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Book a Venue &mdash; Nitte EventSync</h3>
              <p className="text-xs text-slate-300">Unified Reservation &amp; Double-Booking Prevention</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 shrink-0 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[550px] text-xs">
            {[
              { num: 1, label: 'Institution' },
              { num: 2, label: 'Venue' },
              { num: 3, label: 'Date & Time' },
              { num: 4, label: 'Details' },
              { num: 5, label: 'Availability' },
              { num: 6, label: 'Submit' },
              { num: 7, label: 'Status' },
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
                  {s.num < 7 && <span className="text-slate-300 mx-1">&rsaquo;</span>}
                </div>
              );
            })}
          </div>
        </div>

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

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-bold text-slate-900">Step 1: Select Institution</h4>
                <p className="text-xs text-slate-500">Choose which institution venue you wish to reserve</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {INSTITUTIONS.map((inst) => {
                  const isSelected = selectedInstitution === inst.id;
                  return (
                    <div
                      key={inst.id}
                      onClick={() => setSelectedInstitution(inst.id)}
                      className={`cursor-pointer p-5 rounded-2xl border-2 transition-all text-left flex flex-col justify-between ${
                        isSelected 
                          ? 'border-blue-900 bg-blue-50/40 shadow-md ring-2 ring-blue-900/10' 
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-2xl">{inst.logo}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            inst.id === 'nmamit' ? 'bg-blue-900 text-white' : 'bg-teal-700 text-white'
                          }`}>
                            {inst.shortName}
                          </span>
                        </div>
                        <h5 className="font-bold text-sm text-slate-900">{inst.name}</h5>
                        <p className="text-xs text-slate-500 mt-1 font-mono">@{inst.domain}</p>
                        <p className="text-xs text-slate-600 mt-2">{inst.address}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-900">
                        <span>{venues.filter(v => v.institutionId === inst.id).length} Venues Listed</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-900" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-slate-900">Step 2: Select Venue</h4>
                  <p className="text-xs text-slate-500">
                    Displaying official venues for {currentInstitution?.name}
                  </p>
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="text-xs text-blue-900 font-medium hover:underline"
                >
                  Change Institution
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {filteredVenues.map((v) => {
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
                              Capacity: {v.capacity}
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

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-bold text-slate-900">Step 3: Select Date and Time</h4>
                <p className="text-xs text-slate-500">
                  Target Venue: <strong>{selectedVenue?.name}</strong> ({selectedVenue?.location})
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Event Date
                  </label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-900 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-900 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-900 text-sm font-medium"
                  />
                </div>
              </div>

              <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
                conflictResult.isAvailable 
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' 
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}>
                {conflictResult.isAvailable ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold text-sm">
                    {conflictResult.isAvailable ? 'Time Slot Available' : 'Double-Booking Conflict Detected!'}
                  </p>
                  <p className="mt-0.5">
                    {conflictResult.isAvailable
                      ? `${selectedVenue?.name} is free on ${eventDate} from ${startTime} to ${endTime}. You can proceed.`
                      : conflictResult.reason}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <p className="font-semibold text-slate-700 mb-1">Bookings on {eventDate} for {selectedVenue?.name}:</p>
                {storage.getBookings().filter(b => b.venueId === selectedVenueId && b.date === eventDate && b.status !== 'Cancelled').length === 0 ? (
                  <p className="text-slate-500 italic">No other bookings on this day. Wide open!</p>
                ) : (
                  <div className="space-y-1">
                    {storage.getBookings().filter(b => b.venueId === selectedVenueId && b.date === eventDate && b.status !== 'Cancelled').map(b => (
                      <div key={b.id} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                        <span className="font-medium text-slate-800">{b.startTime} - {b.endTime}: {b.eventTitle}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.2 rounded ${
                          b.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {b.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-bold text-slate-900">Step 4: Enter Event Details</h4>
                <p className="text-xs text-slate-500">Provide official details for calendar publication and approvals</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Annual Technical Colloquium 2026"
                    value={eventTitle}
                    onChange={e => setEventTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-900 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Event Category *
                  </label>
                  <select
                    value={eventCategory}
                    onChange={e => setEventCategory(e.target.value as EventCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-900 text-sm font-medium"
                  >
                    {EVENT_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Expected Number of Attendees * (Max: {selectedVenue?.capacity})
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={selectedVenue?.capacity || 2500}
                    value={expectedAttendees}
                    onChange={e => setExpectedAttendees(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-900 text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Event Description &amp; Objectives
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Briefly describe the agenda, target audience, and guest speakers..."
                    value={eventDescription}
                    onChange={e => setEventDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Organizer / Faculty Incharge *
                  </label>
                  <input
                    type="text"
                    value={organizerName}
                    onChange={e => setOrganizerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Department / Association *
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Institutional Email *
                  </label>
                  <input
                    type="email"
                    value={organizerEmail}
                    onChange={e => setOrganizerEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Contact Phone Number
                  </label>
                  <input
                    type="text"
                    value={organizerPhone}
                    onChange={e => setOrganizerPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-900 text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Special Facilities Required
                  </label>
                  <input
                    type="text"
                    placeholder="Optional requirements for estate / audiovisual staff"
                    value={specialRequirements}
                    onChange={e => setSpecialRequirements(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-900 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5">
              <div>
                <h4 className="text-base font-bold text-slate-900">Step 5: Venue Availability Verification</h4>
                <p className="text-xs text-slate-500">Double-booking protection check completed against central database</p>
              </div>

              <div className={`p-5 rounded-2xl border ${
                conflictResult.isAvailable 
                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950' 
                  : 'bg-red-50 border-red-300 text-red-950'
              }`}>
                <div className="flex items-start gap-3">
                  {conflictResult.isAvailable ? (
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <h5 className="font-bold text-base">
                      {conflictResult.isAvailable ? 'Zero Conflicts Detected: Venue Is Available!' : 'Schedule Conflict Detected'}
                    </h5>
                    <p className="text-xs mt-1">
                      {conflictResult.isAvailable
                        ? `The selected slot for ${selectedVenue?.name} on ${eventDate} (${startTime} - ${endTime}) is fully available for booking.`
                        : conflictResult.reason}
                    </p>
                  </div>
                </div>

                {!conflictResult.isAvailable && conflictResult.conflictingBookings.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-red-200/60 text-xs">
                    <p className="font-bold text-red-900 mb-1">Conflicting Booking Details:</p>
                    {conflictResult.conflictingBookings.map(c => (
                      <div key={c.id} className="p-2.5 rounded-lg bg-white/80 border border-red-200 mt-1">
                        <p className="font-semibold text-slate-900">{c.eventTitle}</p>
                        <p className="text-slate-600">Time: {c.startTime} to {c.endTime} | Organizer: {c.organizerName} ({c.department})</p>
                      </div>
                    ))}
                    <p className="mt-2 text-red-800 font-medium">
                      Please return to Step 3 and select an alternative time slot or choose another venue.
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 text-xs">
                <h5 className="font-bold text-slate-800 text-sm">Booking Request Summary</h5>
                <div className="grid grid-cols-2 gap-y-2 text-slate-600">
                  <div><strong>Institution:</strong> {currentInstitution?.name}</div>
                  <div><strong>Venue:</strong> {selectedVenue?.name}</div>
                  <div><strong>Location:</strong> {selectedVenue?.location}</div>
                  <div><strong>Date:</strong> {eventDate}</div>
                  <div><strong>Time:</strong> {startTime} - {endTime}</div>
                  <div><strong>Attendees:</strong> {expectedAttendees} Pax (Capacity: {selectedVenue?.capacity})</div>
                  <div><strong>Event:</strong> {eventTitle}</div>
                  <div><strong>Category:</strong> {eventCategory}</div>
                  <div><strong>Organizer:</strong> {organizerName}</div>
                  <div><strong>Department:</strong> {department}</div>
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-bold text-slate-900">Step 6: Confirm Direct Booking</h4>
                <p className="text-xs text-slate-500">Review reservation details and confirm your venue booking directly</p>
              </div>

              <div className="bg-blue-50/70 p-5 rounded-2xl border border-blue-200 text-xs text-blue-900 space-y-3">
                <div className="flex items-center gap-2 font-bold text-sm text-blue-950">
                  <ShieldCheck className="w-5 h-5 text-blue-900" />
                  Direct Confirmed Booking
                </div>
                <p>
                  Your booking for <strong>{selectedVenue?.name}</strong> will be directly confirmed and stored in the central database without any approval waiting period.
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-700">
                  <li>Directly confirmed and saved to the backend database.</li>
                  <li>Instantly visible on the Central Common Calendar.</li>
                  <li>Zero double-booking conflict prevention guaranteed.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p>
                  By submitting, you agree to comply with campus venue usage guidelines, sound thresholds, and stage safety rules of {currentInstitution?.name}.
                </p>
              </div>
            </div>
          )}

          {step === 7 && createdBooking && (
            <div className="space-y-6">
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner mb-3">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h4 className="text-2xl font-black text-slate-900">Booking Confirmed!</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Reference ID: <strong className="font-mono text-blue-900 font-bold">{createdBooking.id}</strong>
                </p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mt-2 bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Status: Confirmed • Live on Common Calendar
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-blue-950 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl"></div>
                
                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-teal-400">Nitte EventSync Booking Pass</span>
                    <h5 className="font-black text-lg text-white">{createdBooking.eventTitle}</h5>
                  </div>
                  <span className="font-mono font-bold text-xs bg-white/10 px-2.5 py-1 rounded-lg">
                    {createdBooking.id}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase">Venue &amp; Location</p>
                    <p className="font-bold text-white mt-0.5">{selectedVenue?.name}</p>
                    <p className="text-slate-300 text-[11px]">{selectedVenue?.location}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase">Institution</p>
                    <p className="font-bold text-white mt-0.5">{currentInstitution?.name}</p>
                    <p className="text-slate-300 text-[11px]">{currentInstitution?.domain}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase">Date &amp; Schedule</p>
                    <p className="font-bold text-teal-300 mt-0.5">{createdBooking.date}</p>
                    <p className="text-slate-300 text-[11px]">{createdBooking.startTime} &mdash; {createdBooking.endTime}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase">Organizer</p>
                    <p className="font-bold text-white mt-0.5">{createdBooking.organizerName}</p>
                    <p className="text-slate-300 text-[11px]">{createdBooking.department}</p>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300">
                  <span>Attendees: {createdBooking.expected_attendees || createdBooking.expectedAttendees} Pax</span>
                  <span>Category: {createdBooking.event_category || createdBooking.eventCategory}</span>
                  <span className="text-teal-400 font-semibold">Zero Double-Booking Guarantee</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print / Save Pass
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2 rounded-xl text-xs font-bold text-white bg-blue-900 hover:bg-blue-950 transition-colors"
                >
                  Done &amp; View in My Bookings
                </button>
              </div>
            </div>
          )}
        </div>

        {step < 7 && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
            <button
              onClick={() => {
                if (step === 1) onClose();
                else setStep(step - 1);
              }}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{step === 1 ? 'Cancel' : 'Previous'}</span>
            </button>

            <div className="flex items-center gap-2">
              {step < 6 ? (
                <button
                  disabled={
                    (step === 2 && !selectedVenueId) ||
                    (step === 3 && !conflictResult.isAvailable) ||
                    (step === 4 && (!eventTitle.trim() || expectedAttendees <= 0)) ||
                    (step === 5 && !conflictResult.isAvailable)
                  }
                  onClick={() => {
                    if (step === 2 && !selectedVenueId) return;
                    if (step === 3 && !conflictResult.isAvailable) return;
                    if (step === 4 && (!eventTitle.trim() || expectedAttendees <= 0)) {
                      setErrorMessage('Please fill in required fields (Title, Attendees).');
                      return;
                    }
                    setErrorMessage('');
                    setStep(step + 1);
                  }}
                  className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-blue-900 hover:bg-blue-950 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmitBooking}
                  className="px-6 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-900 to-teal-700 hover:from-blue-950 hover:to-teal-800 transition-all flex items-center gap-1.5 shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Book Venue</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
