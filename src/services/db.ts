import { Booking, Venue, Institution, Profile, VenueAvailabilityCheck, BookingStatus } from '../types';
import { INITIAL_BOOKINGS, INITIAL_VENUES, INITIAL_PROFILES, INSTITUTIONS } from '../data/initialData';
import { getSupabase, getSupabaseCredentials } from '../lib/supabase';

const CACHE_KEY_BOOKINGS = 'nitte_eventsync_db_bookings_v2';
const CACHE_KEY_VENUES = 'nitte_eventsync_db_venues_v2';
const CACHE_KEY_ACTIVE_USER = 'nitte_eventsync_active_user_v2';

class DatabaseService {
  private venues: Venue[] = [];
  private bookings: Booking[] = [];
  private profiles: Profile[] = [...INITIAL_PROFILES];
  private institutions: Institution[] = [...INSTITUTIONS];
  private currentUserId: string = '33333333-3333-3333-3333-333333333333'; // Aditya Shenoy (Student)
  private listeners: Set<() => void> = new Set();
  private isLoaded: boolean = false;

  constructor() {
    this.init();
  }

  private init() {
    // 1. Load initial cache
    try {
      const storedBookings = localStorage.getItem(CACHE_KEY_BOOKINGS);
      this.bookings = storedBookings ? JSON.parse(storedBookings) : [...INITIAL_BOOKINGS];

      const storedVenues = localStorage.getItem(CACHE_KEY_VENUES);
      this.venues = storedVenues ? JSON.parse(storedVenues) : [...INITIAL_VENUES];

      const storedUser = localStorage.getItem(CACHE_KEY_ACTIVE_USER);
      if (storedUser && this.profiles.some(p => p.id === storedUser)) {
        this.currentUserId = storedUser;
      }
    } catch {
      this.bookings = [...INITIAL_BOOKINGS];
      this.venues = [...INITIAL_VENUES];
    }

    // 2. Fetch live data from Supabase if connected
    this.syncFromSupabase();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  private saveLocal() {
    try {
      localStorage.setItem(CACHE_KEY_BOOKINGS, JSON.stringify(this.bookings));
      localStorage.setItem(CACHE_KEY_VENUES, JSON.stringify(this.venues));
      localStorage.setItem(CACHE_KEY_ACTIVE_USER, this.currentUserId);
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
    this.notify();
  }

  public async syncFromSupabase(): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      // 1. Fetch Venues
      const { data: dbVenues, error: venueError } = await supabase
        .from('venues')
        .select('*')
        .order('name');

      if (!venueError && dbVenues && dbVenues.length > 0) {
        this.venues = dbVenues.map(v => ({
          id: v.id,
          name: v.name,
          location: v.location,
          capacity: v.capacity,
          facilities: v.facilities,
          created_at: v.created_at,
          imageUrl: INITIAL_VENUES.find(iv => iv.name === v.name)?.imageUrl || 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80',
          isAvailable: true,
        }));
      }

      // 2. Fetch Bookings
      const { data: dbBookings, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .order('event_date', { ascending: false });

      if (!bookingError && dbBookings) {
        this.bookings = dbBookings.map(b => {
          const v = this.venues.find(ven => ven.id === b.venue_id);
          const p = this.profiles.find(prof => prof.id === b.organizer_id);
          return {
            id: b.id,
            organizer_id: b.organizer_id,
            institution_id: b.institution_id,
            venue_id: b.venue_id,
            event_title: b.event_title,
            description: b.description || '',
            event_category: b.event_category,
            event_date: b.event_date,
            start_time: b.start_time?.slice(0, 5) || '09:00',
            end_time: b.end_time?.slice(0, 5) || '12:00',
            expected_attendees: b.expected_attendees,
            status: b.status as BookingStatus,
            created_at: b.created_at,
            updated_at: b.updated_at,
            venue_name: v?.name || 'Campus Venue',
            venue_location: v?.location || 'NMAMIT Campus',
            organizer_name: p?.full_name || 'Event Organizer',
            organizer_email: p?.email || '',
            department: p?.department || 'Department',
          };
        });
      }

      this.saveLocal();
      return true;
    } catch (err) {
      console.warn('Could not sync with Supabase (offline or network error):', err);
      return false;
    }
  }

  // --- Profiles / Users ---
  public getProfiles(): Profile[] {
    return [...this.profiles];
  }

  public getCurrentProfile(): Profile {
    const prof = this.profiles.find(p => p.id === this.currentUserId);
    return prof || this.profiles[0];
  }

  public setCurrentProfile(id: string) {
    if (this.profiles.some(p => p.id === id)) {
      this.currentUserId = id;
      this.saveLocal();
    }
  }

  // --- Institutions ---
  public getInstitutions(): Institution[] {
    return [...this.institutions];
  }

  // --- Venues ---
  public getVenues(): Venue[] {
    return [...this.venues];
  }

  public getVenueById(id: string): Venue | undefined {
    return this.venues.find(v => v.id === id);
  }

  // --- Bookings ---
  public getBookings(): Booking[] {
    return [...this.bookings];
  }

  public getBookingById(id: string): Booking | undefined {
    return this.bookings.find(b => b.id === id);
  }

  // Double-booking check
  public checkAvailability(
    venueId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeBookingId?: string
  ): VenueAvailabilityCheck {
    if (!venueId || !date || !startTime || !endTime) {
      return { isAvailable: true, conflictingBookings: [] };
    }

    if (startTime >= endTime) {
      return {
        isAvailable: false,
        conflictingBookings: [],
        reason: 'End time must be later than start time',
      };
    }

    // Active approved or pending bookings
    const active = this.bookings.filter(b => 
      b.venue_id === venueId &&
      b.event_date === date &&
      (b.status === 'Approved' || b.status === 'Pending') &&
      b.id !== excludeBookingId
    );

    const conflicts = active.filter(b => {
      // Overlap condition: (newStart < b.end && newEnd > b.start)
      return startTime < b.end_time && endTime > b.start_time;
    });

    if (conflicts.length > 0) {
      const c = conflicts[0];
      return {
        isAvailable: false,
        conflictingBookings: conflicts,
        reason: `Overlaps with "${c.event_title}" (${c.start_time} - ${c.end_time}) [${c.status}]`,
      };
    }

    return { isAvailable: true, conflictingBookings: [] };
  }

  // Insert a new Booking
  public async createBooking(data: {
    venue_id: string;
    institution_id: string;
    event_title: string;
    description: string;
    event_category: string;
    event_date: string;
    start_time: string;
    end_time: string;
    expected_attendees: number;
    organizer_name: string;
    organizer_email: string;
    department: string;
  }): Promise<{ success: boolean; booking?: Booking; error?: string }> {
    // 1. Frontend conflict check
    const check = this.checkAvailability(data.venue_id, data.event_date, data.start_time, data.end_time);
    if (!check.isAvailable) {
      return { success: false, error: check.reason || 'This venue is already booked for the selected time.' };
    }

    const currentProfile = this.getCurrentProfile();
    const newId = crypto.randomUUID ? crypto.randomUUID() : `bk-${Date.now()}`;
    const venue = this.getVenueById(data.venue_id);

    const newBooking: Booking = {
      id: newId,
      organizer_id: currentProfile.id,
      institution_id: data.institution_id,
      venue_id: data.venue_id,
      event_title: data.event_title,
      description: data.description,
      event_category: data.event_category,
      event_date: data.event_date,
      start_time: data.start_time,
      end_time: data.end_time,
      expected_attendees: data.expected_attendees,
      status: 'Pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      venue_name: venue?.name || 'Auditorium',
      venue_location: venue?.location || '',
      organizer_name: data.organizer_name || currentProfile.full_name,
      organizer_email: data.organizer_email || currentProfile.email,
      department: data.department || currentProfile.department,
    };

    // 2. Insert into Supabase if configured
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { error } = await supabase.from('bookings').insert({
          id: newBooking.id,
          organizer_id: newBooking.organizer_id,
          institution_id: newBooking.institution_id,
          venue_id: newBooking.venue_id,
          event_title: newBooking.event_title,
          description: newBooking.description,
          event_category: newBooking.event_category,
          event_date: newBooking.event_date,
          start_time: newBooking.start_time,
          end_time: newBooking.end_time,
          expected_attendees: newBooking.expected_attendees,
          status: 'Pending',
        });

        if (error) {
          console.error('Supabase booking insert error:', error);
          // If trigger rejected due to overlap:
          if (error.message?.includes('Double-booking conflict')) {
            return { success: false, error: error.message };
          }
        }
      } catch (err: any) {
        console.warn('Network error during Supabase insert:', err);
      }
    }

    // 3. Save locally in state
    this.bookings.unshift(newBooking);
    this.saveLocal();

    return { success: true, booking: newBooking };
  }

  // Update Booking Status (Approve / Reject)
  public async updateBookingStatus(
    bookingId: string, 
    status: BookingStatus, 
    comments?: string
  ): Promise<{ success: boolean; error?: string }> {
    const booking = this.bookings.find(b => b.id === bookingId);
    if (!booking) return { success: false, error: 'Booking not found.' };

    const currentProfile = this.getCurrentProfile();

    // If approving, enforce double-booking prevention rule
    if (status === 'Approved') {
      const check = this.checkAvailability(
        booking.venue_id,
        booking.event_date,
        booking.start_time,
        booking.end_time,
        booking.id
      );
      const approvedConflict = check.conflictingBookings.find(c => c.status === 'Approved');
      if (approvedConflict) {
        return {
          success: false,
          error: `Cannot approve: Overlaps with approved event "${approvedConflict.event_title}" (${approvedConflict.start_time} - ${approvedConflict.end_time})`,
        };
      }
    }

    // 1. Update in Supabase
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { error } = await supabase
          .from('bookings')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', bookingId);

        if (error) {
          console.error('Supabase booking status update error:', error);
          return { success: false, error: error.message };
        }

        // Insert into booking_approvals table
        await supabase.from('booking_approvals').insert({
          booking_id: bookingId,
          approver_id: currentProfile.id,
          status: status === 'Approved' ? 'Approved' : 'Rejected',
          comments: comments || (status === 'Approved' ? 'Cleared by faculty' : 'Declined'),
        });
      } catch (err: any) {
        console.warn('Supabase update warning:', err);
      }
    }

    // 2. Update locally
    booking.status = status;
    booking.updated_at = new Date().toISOString();
    if (status === 'Rejected' && comments) {
      booking.rejection_reason = comments;
    }
    this.saveLocal();

    return { success: true };
  }

  // Cancel Booking
  public async cancelBooking(bookingId: string): Promise<boolean> {
    const booking = this.bookings.find(b => b.id === bookingId);
    if (!booking) return false;

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase
          .from('bookings')
          .update({ status: 'Cancelled', updated_at: new Date().toISOString() })
          .eq('id', bookingId);
      } catch (err) {
        console.warn('Supabase cancel update warning:', err);
      }
    }

    booking.status = 'Cancelled';
    booking.updated_at = new Date().toISOString();
    this.saveLocal();
    return true;
  }

  // Add or update venues
  public async addVenue(venueData: Partial<Venue>): Promise<{ success: boolean; venue?: Venue; error?: string }> {
    const newId = venueData.id || (crypto.randomUUID ? crypto.randomUUID() : `ven-${Date.now()}`);
    const facilitiesStr = Array.isArray(venueData.facilities) 
      ? venueData.facilities.join(', ') 
      : (venueData.facilities || '');
      
    const newVenue: Venue = {
      id: newId,
      name: venueData.name || 'New Venue',
      location: venueData.location || 'Campus',
      capacity: Number(venueData.capacity || 100),
      facilities: facilitiesStr,
      imageUrl: venueData.imageUrl || 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80',
      isAvailable: true,
      block: venueData.block || '',
      floor: venueData.floor || '',
      created_at: new Date().toISOString(),
    };

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('venues').insert({
          id: newVenue.id,
          name: newVenue.name,
          location: newVenue.location,
          capacity: newVenue.capacity,
          facilities: newVenue.facilities,
        });
      } catch (err) {
        console.warn('Supabase addVenue warning:', err);
      }
    }

    this.venues.push(newVenue);
    this.saveLocal();
    return { success: true, venue: newVenue };
  }

  public async updateVenue(venueOrId: Venue | string, partial?: Partial<Venue>): Promise<{ success: boolean }> {
    const venueId = typeof venueOrId === 'string' ? venueOrId : venueOrId.id;
    const updateData = typeof venueOrId === 'string' ? partial : venueOrId;
    const idx = this.venues.findIndex(v => v.id === venueId);
    if (idx !== -1 && updateData) {
      this.venues[idx] = { ...this.venues[idx], ...updateData };
      const supabase = getSupabase();
      if (supabase) {
        try {
          const v = this.venues[idx];
          await supabase.from('venues').update({
            name: v.name,
            location: v.location,
            capacity: v.capacity,
            facilities: typeof v.facilities === 'string' ? v.facilities : v.facilities?.join(', '),
          }).eq('id', venueId);
        } catch (err) {
          console.warn('Supabase updateVenue warning:', err);
        }
      }
      this.saveLocal();
    }
    return { success: true };
  }

  public exportDatabase() {
    return {
      profiles: this.profiles,
      institutions: this.institutions,
      venues: this.venues,
      bookings: this.bookings,
      exportedAt: new Date().toISOString(),
    };
  }

  public resetToDefault() {
    this.bookings = [...INITIAL_BOOKINGS];
    this.venues = [...INITIAL_VENUES];
    this.profiles = [...INITIAL_PROFILES];
    this.saveLocal();
  }

  // Dashboard Statistics
  public getStats() {
    const total = this.bookings.length;
    const pending = this.bookings.filter(b => b.status === 'Pending').length;
    const approved = this.bookings.filter(b => b.status === 'Approved').length;
    const rejected = this.bookings.filter(b => b.status === 'Rejected').length;
    const cancelled = this.bookings.filter(b => b.status === 'Cancelled').length;

    const nmamitBookings = this.bookings.filter(b => b.institution_id === '11111111-1111-1111-1111-111111111111').length;
    const nitteBookings = this.bookings.filter(b => b.institution_id === '22222222-2222-2222-2222-222222222222').length;

    return {
      total,
      totalBookings: total,
      pending,
      pendingCount: pending,
      approved,
      approvedCount: approved,
      rejected,
      rejectedCount: rejected,
      cancelled,
      cancelledCount: cancelled,
      venuesCount: this.venues.length,
      nmamitBookings,
      nitteBookings,
    };
  }
}

export const db = new DatabaseService();
