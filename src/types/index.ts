export type UserRole = 'student' | 'faculty' | 'admin';

export type BookingStatus = 'Confirmed' | 'Cancelled' | 'Pending' | 'Approved' | 'Rejected';

export type CalendarViewMode = 'month' | 'week' | 'day';

export type EventCategory = 
  | 'Technical' 
  | 'Cultural' 
  | 'Academic' 
  | 'Conference' 
  | 'Workshop' 
  | 'Sports' 
  | 'University Ceremony' 
  | 'Student Club';

export type InstitutionId = string;

export interface Institution {
  id: string;
  name: string;
  domain: string;
  shortName?: string;
  logo?: string;
  address?: string;
}

export interface Venue {
  id: string;
  name: string;
  location: string;
  capacity: number;
  facilities: string | string[]; // Can be string in DB or array in UI
  facilitiesList?: string[]; // helper parsed array
  imageUrl?: string;
  created_at?: string;
  isAvailable?: boolean;
  institution_id?: string;
  institutionId?: string;
  block?: string;
  floor?: string;
  description?: string;
  contactPerson?: string;
}

export interface Profile {
  id: string;
  full_name: string;
  name?: string; // backwards compatibility alias
  email: string;
  institution_id: string;
  institutionId?: string; // backwards compatibility alias
  role?: UserRole;
  created_at?: string;
  department?: string;
  phone?: string;
}

// User alias for backwards compatibility
export type User = Profile;

export interface Booking {
  id: string;
  organizer_id?: string;
  userId?: string; // backwards compatibility alias
  institution_id: string;
  institutionId?: string; // backwards compatibility alias
  venue_id: string;
  venueId?: string; // backwards compatibility alias
  event_title: string;
  eventTitle?: string; // backwards compatibility alias
  description: string;
  eventDescription?: string; // backwards compatibility alias
  event_category: EventCategory | string;
  eventCategory?: EventCategory | string; // backwards compatibility alias
  category?: string; // backwards compatibility alias
  event_date: string; // YYYY-MM-DD
  date?: string; // backwards compatibility alias
  start_time: string; // HH:mm:ss or HH:mm
  startTime?: string; // backwards compatibility alias
  end_time: string; // HH:mm:ss or HH:mm
  endTime?: string; // backwards compatibility alias
  expected_attendees: number;
  expectedAttendees?: number; // backwards compatibility alias
  status: BookingStatus;
  created_at?: string;
  createdAt?: string; // backwards compatibility alias
  updated_at?: string;
  updatedAt?: string; // backwards compatibility alias

  // Joined / Helper fields for convenient rendering
  venue_name?: string;
  venueName?: string;
  venue_location?: string;
  venueLocation?: string;
  organizer_name?: string;
  organizerName?: string;
  organizer_email?: string;
  organizerEmail?: string;
  department?: string;
  rejection_reason?: string;
  rejectionReason?: string;
  specialRequirements?: string;
  special_requirements?: string;
  approvedBy?: string;
  approved_by?: string;
}

export interface BookingApproval {
  id: string;
  booking_id: string;
  approver_id: string;
  status: 'Approved' | 'Rejected';
  comments?: string;
  created_at?: string;
}

export interface VenueAvailabilityCheck {
  isAvailable: boolean;
  conflictingBookings: Booking[];
  reason?: string;
}
