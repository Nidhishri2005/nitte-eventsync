import { Booking, Venue, Institution, Profile, VenueAvailabilityCheck, BookingStatus } from '../types';
import { INITIAL_BOOKINGS, INITIAL_VENUES, INITIAL_PROFILES, INSTITUTIONS } from '../data/initialData';
import { getSupabase } from '../lib/supabase';

const CACHE_KEY_BOOKINGS = 'nitte_eventsync_db_bookings_v3';
const CACHE_KEY_VENUES = 'nitte_eventsync_db_venues_v3';
const CACHE_KEY_PROFILES = 'nitte_eventsync_db_profiles_v3';
const CACHE_KEY_SESSION_USER = 'nitte_eventsync_session_user';

export function formatNameFromEmail(email: string): string {
  const username = email.split('@')[0] || '';
  const cleaned = username.replace(/[._\-]+/g, ' ').replace(/\d+/g, '').trim();
  if (!cleaned) return 'Campus Member';
  return cleaned
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

class DatabaseService {
  private venues: Venue[] = [];
  private bookings: Booking[] = [];
  private profiles: Profile[] = [...INITIAL_PROFILES];
  private institutions: Institution[] = [...INSTITUTIONS];
  private currentUser: Profile | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.init();
  }

  private init() {
    try {
      const storedBookings = localStorage.getItem(CACHE_KEY_BOOKINGS);
      if (storedBookings) {
        this.bookings = JSON.parse(storedBookings);
      } else {
        this.bookings = INITIAL_BOOKINGS.map(b => ({
          ...b,
          status: 'Confirmed' as BookingStatus,
        }));
      }

      const storedVenues = localStorage.getItem(CACHE_KEY_VENUES);
      this.venues = storedVenues ? JSON.parse(storedVenues) : [...INITIAL_VENUES];

      const storedProfiles = localStorage.getItem(CACHE_KEY_PROFILES);
      if (storedProfiles) {
        this.profiles = JSON.parse(storedProfiles);
      }

      // Check demo login session
      const sessionUserStr = localStorage.getItem(CACHE_KEY_SESSION_USER);
      if (sessionUserStr) {
        const parsed = JSON.parse(sessionUserStr);
        if (parsed && parsed.email) {
          const matched = this.profiles.find(p => p.email.toLowerCase() === parsed.email.toLowerCase());
          this.currentUser = matched || parsed;
        }
      }
    } catch {
      this.bookings = INITIAL_BOOKINGS.map(b => ({ ...b, status: 'Confirmed' as BookingStatus }));
      this.venues = [...INITIAL_VENUES];
      this.profiles = [...INITIAL_PROFILES];
    }

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
      localStorage.setItem(CACHE_KEY_PROFILES, JSON.stringify(this.profiles));
      if (this.currentUser) {
        localStorage.setItem(CACHE_KEY_SESSION_USER, JSON.stringify(this.currentUser));
      }
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
    this.notify();
  }

  public async syncFromSupabase(): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    try {
      // 1. Fetch Institutions
      const { data: dbInsts, error: instError } = await supabase
        .from('institutions')
        .select('*');
      if (!instError && dbInsts && dbInsts.length > 0) {
        this.institutions = dbInsts.map(i => ({
          id: i.id,
          name: i.name,
          domain: i.domain,
          shortName: i.domain === 'nmamit.in' ? 'NMAMIT' : 'Nitte University',
          logo: i.domain === 'nmamit.in' ? '🏛️' : '🎓',
          address: i.domain === 'nmamit.in' ? 'Nitte, Karkala Taluk, Udupi - 574110' : 'Derlakatte, Mangaluru - 575018',
        }));
      }

      // 2. Fetch Profiles
      const { data: dbProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!profileError && dbProfiles && dbProfiles.length > 0) {
        const merged = [...this.profiles];
        dbProfiles.forEach(dp => {
          const idx = merged.findIndex(p => p.id === dp.id || p.email.toLowerCase() === dp.email.toLowerCase());
          const prof: Profile = {
            id: dp.id,
            full_name: dp.full_name,
            name: dp.full_name,
            email: dp.email,
            institution_id: dp.institution_id || '11111111-1111-1111-1111-111111111111',
            institutionId: dp.institution_id || '11111111-1111-1111-1111-111111111111',
            department: dp.department || 'Campus Department',
            phone: dp.phone || '+91 8258 281263',
            created_at: dp.created_at,
          };
          if (idx >= 0) {
            merged[idx] = prof;
          } else {
            merged.push(prof);
          }
        });
        this.profiles = merged;
      }

      // 3. Fetch Venues
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
          institution_id: v.institution_id || '11111111-1111-1111-1111-111111111111',
          institutionId: v.institution_id || '11111111-1111-1111-1111-111111111111',
        }));
      }

      // 4. Fetch Bookings
      const { data: dbBookings, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .order('event_date', { ascending: false });

      if (!bookingError && dbBookings) {
        this.bookings = dbBookings.map(b => {
          const v = this.venues.find(ven => ven.id === b.venue_id);
          const p = this.profiles.find(prof => prof.id === b.organizer_id || prof.email === b.organizer_email);
          const statusNorm: BookingStatus = b.status === 'Cancelled' ? 'Cancelled' : 'Confirmed';

          return {
            id: b.id,
            organizer_id: b.organizer_id,
            userId: b.organizer_id,
            institution_id: b.institution_id,
            institutionId: b.institution_id,
            venue_id: b.venue_id,
            venueId: b.venue_id,
            event_title: b.event_title,
            eventTitle: b.event_title,
            description: b.description || '',
            eventDescription: b.description || '',
            event_category: b.event_category,
            eventCategory: b.event_category,
            category: b.event_category,
            event_date: b.event_date,
            date: b.event_date,
            start_time: b.start_time?.slice(0, 5) || '09:00',
            startTime: b.start_time?.slice(0, 5) || '09:00',
            end_time: b.end_time?.slice(0, 5) || '12:00',
            endTime: b.end_time?.slice(0, 5) || '12:00',
            expected_attendees: b.expected_attendees,
            expectedAttendees: b.expected_attendees,
            status: statusNorm,
            special_requirements: b.special_requirements || '',
            specialRequirements: b.special_requirements || '',
            created_at: b.created_at,
            createdAt: b.created_at,
            updated_at: b.updated_at,
            updatedAt: b.updated_at,
            venue_name: v?.name || 'Campus Venue',
            venueName: v?.name || 'Campus Venue',
            venue_location: v?.location || 'NMAMIT Campus',
            venueLocation: v?.location || 'NMAMIT Campus',
            organizer_name: p?.full_name || b.organizer_name || 'Event Organizer',
            organizerName: p?.full_name || b.organizer_name || 'Event Organizer',
            organizer_email: p?.email || b.organizer_email || '',
            organizerEmail: p?.email || b.organizer_email || '',
            department: p?.department || 'Academic Department',
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
    if (this.currentUser) return this.currentUser;
    return this.profiles[0];
  }

  public getActiveUser(): Profile | null {
    return this.currentUser;
  }

  public isLoggedIn(): boolean {
    return this.currentUser !== null;
  }

  public async loginDemo(email: string, password: string): Promise<{ success: boolean; user?: Profile; error?: string }> {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      return { success: false, error: 'Please enter your institutional email address.' };
    }
    if (!password || password.trim().length === 0) {
      return { success: false, error: 'Please enter your password.' };
    }

    const lower = trimmedEmail.toLowerCase();
    const isNmamit = lower.endsWith('@nmamit.in');
    const isNitte = lower.endsWith('@nitte.edu');

    if (!isNmamit && !isNitte) {
      return { success: false, error: 'Please use your NMAMIT or Nitte University institutional email address.' };
    }

    let user = this.profiles.find(p => p.email.toLowerCase() === lower);

    if (!user) {
      const derivedName = formatNameFromEmail(trimmedEmail);
      const instId = isNitte ? '22222222-2222-2222-2222-222222222222' : '11111111-1111-1111-1111-111111111111';
      const generatedId = crypto.randomUUID ? crypto.randomUUID() : `user-${Date.now()}`;

      user = {
        id: generatedId,
        full_name: derivedName,
        name: derivedName,
        email: trimmedEmail,
        institution_id: instId,
        institutionId: instId,
        department: isNitte ? 'Nitte University' : 'NMAMIT Campus',
        phone: '+91 8258 281263',
      };
      this.profiles.push(user);

      // Save user to backend Supabase profiles table
      const supabase = getSupabase();
      if (supabase) {
        try {
          await supabase.from('profiles').upsert({
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            institution_id: user.institution_id,
            department: user.department,
            phone: user.phone,
          }, { onConflict: 'email' });
        } catch (err) {
          console.warn('Supabase profile insertion warning:', err);
        }
      }
    }

    this.currentUser = user;
    try {
      localStorage.setItem(CACHE_KEY_SESSION_USER, JSON.stringify(user));
    } catch {}
    this.saveLocal();

    return { success: true, user };
  }

  public logout(): void {
    this.currentUser = null;
    try {
      localStorage.removeItem(CACHE_KEY_SESSION_USER);
    } catch {}
    this.notify();
  }

  // --- Institutions & Venues ---
  public getInstitutions(): Institution[] {
    return [...this.institutions];
  }

  public getVenues(): Venue[] {
    return [...this.venues];
  }

  public getVenueById(id: string): Venue | undefined {
    return this.venues.find(v => v.id === id);
  }

  public getBookings(): Booking[] {
    return [...this.bookings];
  }

  public getBookingById(id: string): Booking | undefined {
    return this.bookings.find(b => b.id === id);
  }

  // --- Conflict Prevention Check ---
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
        reason: 'End time must be later than start time.',
      };
    }

    // Only active confirmed bookings create conflicts
    const active = this.bookings.filter(b => 
      (b.venue_id === venueId || b.venueId === venueId) &&
      (b.event_date === date || b.date === date) &&
      (b.status === 'Confirmed' || b.status === 'Approved') &&
      b.id !== excludeBookingId
    );

    const conflicts = active.filter(b => {
      const bStart = (b.start_time || b.startTime || '').slice(0, 5);
      const bEnd = (b.end_time || b.endTime || '').slice(0, 5);
      return startTime < bEnd && endTime > bStart;
    });

    if (conflicts.length > 0) {
      return {
        isAvailable: false,
        conflictingBookings: conflicts,
        reason: 'This venue is already booked for the selected time. Please choose another time or venue.',
      };
    }

    return { isAvailable: true, conflictingBookings: [] };
  }

  // --- Direct Venue Booking ---
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
    special_requirements?: string;
  }): Promise<{ success: boolean; booking?: Booking; error?: string }> {
    // 1. Availability check
    const check = this.checkAvailability(data.venue_id, data.event_date, data.start_time, data.end_time);
    if (!check.isAvailable) {
      return {
        success: false,
        error: check.reason || 'This venue is already booked for the selected time. Please choose another time or venue.',
      };
    }

    const currentProfile = this.getCurrentProfile();
    const newId = crypto.randomUUID ? crypto.randomUUID() : `bk-${Date.now()}`;
    const venue = this.getVenueById(data.venue_id);

    // 2. Direct Confirmation
    const newBooking: Booking = {
      id: newId,
      organizer_id: currentProfile.id,
      userId: currentProfile.id,
      institution_id: data.institution_id,
      institutionId: data.institution_id,
      venue_id: data.venue_id,
      venueId: data.venue_id,
      event_title: data.event_title,
      eventTitle: data.event_title,
      description: data.description,
      eventDescription: data.description,
      event_category: data.event_category,
      eventCategory: data.event_category,
      category: data.event_category,
      event_date: data.event_date,
      date: data.event_date,
      start_time: data.start_time,
      startTime: data.start_time,
      end_time: data.end_time,
      endTime: data.end_time,
      expected_attendees: data.expected_attendees,
      expectedAttendees: data.expected_attendees,
      status: 'Confirmed',
      special_requirements: data.special_requirements || '',
      specialRequirements: data.special_requirements || '',
      created_at: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      venue_name: venue?.name || 'Campus Venue',
      venueName: venue?.name || 'Campus Venue',
      venue_location: venue?.location || '',
      venueLocation: venue?.location || '',
      organizer_name: data.organizer_name || currentProfile.full_name,
      organizerName: data.organizer_name || currentProfile.full_name,
      organizer_email: data.organizer_email || currentProfile.email,
      organizerEmail: data.organizer_email || currentProfile.email,
      department: data.department || currentProfile.department,
    };

    // 3. Persist to Supabase PostgreSQL backend
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
          status: 'Confirmed',
          special_requirements: newBooking.special_requirements,
        });

        if (error) {
          console.error('Supabase booking insert error:', error);
          if (error.message?.includes('Double-booking') || error.message?.includes('already booked')) {
            return {
              success: false,
              error: 'This venue is already booked for the selected time. Please choose another time or venue.',
            };
          }
        }
      } catch (err) {
        console.warn('Network error during Supabase insert:', err);
      }
    }

    this.bookings.unshift(newBooking);
    this.saveLocal();

    return { success: true, booking: newBooking };
  }

  // --- User Booking Self-Cancellation ---
  public async cancelBooking(bookingId: string): Promise<boolean> {
    const booking = this.bookings.find(b => b.id === bookingId);
    if (!booking) return false;

    booking.status = 'Cancelled';
    booking.updated_at = new Date().toISOString();
    booking.updatedAt = booking.updated_at;

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase
          .from('bookings')
          .update({ 
            status: 'Cancelled', 
            updated_at: booking.updated_at 
          })
          .eq('id', bookingId);
      } catch (err) {
        console.warn('Supabase status update error:', err);
      }
    }

    this.saveLocal();
    return true;
  }

  // --- Venue Management ---
  public async addVenue(venue: Partial<Venue>): Promise<{ success: boolean; venue?: Venue; error?: string }> {
    const newId = crypto.randomUUID ? crypto.randomUUID() : `ven-${Date.now()}`;
    const newVenue: Venue = {
      id: newId,
      name: venue.name || 'New Venue',
      location: venue.location || '',
      capacity: Number(venue.capacity || 100),
      facilities: venue.facilities || '',
      imageUrl: venue.imageUrl || 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80',
      isAvailable: true,
      institution_id: venue.institution_id || venue.institutionId || '11111111-1111-1111-1111-111111111111',
      institutionId: venue.institution_id || venue.institutionId || '11111111-1111-1111-1111-111111111111',
      block: venue.block || '',
      floor: venue.floor || '',
      description: venue.description || '',
      contactPerson: venue.contactPerson || '',
    };

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('venues').insert({
          id: newVenue.id,
          name: newVenue.name,
          location: newVenue.location,
          capacity: newVenue.capacity,
          facilities: typeof newVenue.facilities === 'string' ? newVenue.facilities : (newVenue.facilities as string[]).join(', '),
          institution_id: newVenue.institution_id,
        });
      } catch (e) {
        console.warn('Supabase venue insert failed:', e);
      }
    }

    this.venues.push(newVenue);
    this.saveLocal();
    return { success: true, venue: newVenue };
  }

  // --- Real-time Booking Statistics for Dashboard ---
  public getStats(date?: string, time?: string) {
    const totalVenues = this.venues.length;
    const confirmedBookings = this.bookings.filter(b => b.status === 'Confirmed' || b.status === 'Approved');
    const totalBookings = confirmedBookings.length;

    // Determine booked vs available venues for the requested or current slot
    const targetDate = date || '2026-10-27';
    const targetTime = time || '10:00';

    const bookedVenueIds = new Set<string>();
    confirmedBookings.forEach(b => {
      const bDate = b.event_date || b.date;
      const bStart = (b.start_time || b.startTime || '').slice(0, 5);
      const bEnd = (b.end_time || b.endTime || '').slice(0, 5);
      const vId = b.venue_id || b.venueId;

      if (bDate === targetDate && vId) {
        if (targetTime >= bStart && targetTime < bEnd) {
          bookedVenueIds.add(vId);
        }
      }
    });

    const bookedVenues = bookedVenueIds.size;
    const availableVenues = Math.max(0, totalVenues - bookedVenues);

    return {
      totalVenues,
      availableVenues,
      bookedVenues,
      totalBookings,
      total: totalBookings,
      confirmedCount: totalBookings,
      venuesCount: totalVenues,
      availableVenuesCount: availableVenues,
    };
  }
}

export const db = new DatabaseService();
