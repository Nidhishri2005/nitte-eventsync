import { Booking, Venue, Institution, Profile, VenueAvailabilityCheck, BookingStatus } from '../types';
import { INITIAL_BOOKINGS, INITIAL_VENUES, INITIAL_PROFILES, INSTITUTIONS } from '../data/initialData';
import { getSupabase } from '../lib/supabase';

const CACHE_KEY_BOOKINGS = 'nitte_eventsync_db_bookings_v4';
const CACHE_KEY_VENUES = 'nitte_eventsync_db_venues_v4';
const CACHE_KEY_PROFILES = 'nitte_eventsync_db_profiles_v4';
const CACHE_KEY_SESSION_USER = 'nitte_eventsync_session_user';

export function formatNameFromEmail(email: string): string {
  if (!email) return 'User';
  return email.split('@')[0].trim();
}

export function getUserDisplayName(profile?: Profile | null, email?: string): string {
  const userEmail = email || profile?.email || '';
  const emailUsername = userEmail.includes('@') ? userEmail.split('@')[0].trim() : userEmail.trim();

  if (!profile) {
    return emailUsername || 'User';
  }

  if (profile.full_name && profile.full_name.trim()) {
    const fn = profile.full_name.trim();
    if (fn === 'Campus Member' || fn === 'User' || fn.toLowerCase() === 'nnmis') {
      return emailUsername || fn;
    }
    if (fn.includes('@')) {
      return fn.split('@')[0].trim();
    }
    return fn;
  }

  if (profile.name && profile.name.trim()) {
    const n = profile.name.trim();
    if (n === 'Campus Member' || n === 'User' || n.toLowerCase() === 'nnmis') {
      return emailUsername || n;
    }
    if (n.includes('@')) {
      return n.split('@')[0].trim();
    }
    return n;
  }

  return emailUsername || 'User';
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
      // 1. Bookings: Load and purge any legacy hardcoded sample bookings
      const storedBookings = localStorage.getItem(CACHE_KEY_BOOKINGS) || localStorage.getItem('nitte_eventsync_db_bookings_v3');
      if (storedBookings) {
        const parsed = JSON.parse(storedBookings);
        // Exclude legacy seeded sample bookings (ids starting with 99999999-9999-)
        this.bookings = Array.isArray(parsed) 
          ? parsed.filter((b: any) => !b.id?.startsWith('99999999-9999-'))
          : [];
      } else {
        this.bookings = [...INITIAL_BOOKINGS];
      }

      // 2. Venues: Ensure all belong to Nitte University
      const storedVenues = localStorage.getItem(CACHE_KEY_VENUES) || localStorage.getItem('nitte_eventsync_db_venues_v3');
      if (storedVenues) {
        const parsedVenues = JSON.parse(storedVenues);
        this.venues = Array.isArray(parsedVenues) && parsedVenues.length > 0
          ? parsedVenues.map((v: any) => ({
              ...v,
              institution_id: '22222222-2222-2222-2222-222222222222',
              institutionId: '22222222-2222-2222-2222-222222222222',
            }))
          : [...INITIAL_VENUES];
      } else {
        this.venues = [...INITIAL_VENUES];
      }

      // 3. Profiles
      const storedProfiles = localStorage.getItem(CACHE_KEY_PROFILES) || localStorage.getItem('nitte_eventsync_db_profiles_v3');
      if (storedProfiles) {
        this.profiles = JSON.parse(storedProfiles);
      }

      // 4. Session user
      const sessionUserStr = localStorage.getItem(CACHE_KEY_SESSION_USER);
      if (sessionUserStr) {
        const parsed = JSON.parse(sessionUserStr);
        if (parsed && parsed.email) {
          const matched = this.profiles.find(p => p.email.toLowerCase() === parsed.email.toLowerCase());
          this.currentUser = matched || parsed;
          if (this.currentUser) {
            this.currentUser.institution_id = '22222222-2222-2222-2222-222222222222';
            this.currentUser.institutionId = '22222222-2222-2222-2222-222222222222';
            if (this.currentUser.full_name === 'nnmis' || this.currentUser.full_name === 'Campus Member') {
              const u = this.currentUser.email.split('@')[0].trim();
              this.currentUser.full_name = u;
              this.currentUser.name = u;
            }
          }
        }
      }
    } catch {
      this.bookings = [];
      this.venues = [...INITIAL_VENUES];
      this.profiles = [...INITIAL_PROFILES];
    }

    this.saveLocal();
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
        this.institutions = dbInsts
          .filter(i => !i.domain?.includes('nmamit.in'))
          .map(i => ({
            id: i.id,
            name: 'Nitte (Deemed to be University)',
            domain: 'nitte.edu',
            shortName: 'Nitte University',
            logo: '🎓',
            address: 'Derlakatte, Mangaluru - 575018',
          }));
        if (this.institutions.length === 0) {
          this.institutions = [...INSTITUTIONS];
        }
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
            institution_id: '22222222-2222-2222-2222-222222222222',
            institutionId: '22222222-2222-2222-2222-222222222222',
            department: dp.department || 'Nitte University',
            phone: dp.phone || '+91 824 2204300',
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
        .select('*');

      if (!venueError && dbVenues && dbVenues.length > 0) {
        const mergedVenues: Venue[] = dbVenues.map(dv => {
          let facList: string[] = [];
          if (Array.isArray(dv.facilities)) {
            facList = dv.facilities;
          } else if (typeof dv.facilities === 'string') {
            facList = dv.facilities.split(',').map((f: string) => f.trim());
          }

          const existing = this.venues.find(v => v.id === dv.id);

          return {
            id: dv.id,
            name: dv.name,
            location: dv.location || 'Nitte University Campus',
            capacity: Number(dv.capacity || 100),
            facilities: facList,
            facilitiesList: facList,
            imageUrl: existing?.imageUrl || dv.image_url || 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80',
            isAvailable: dv.is_available ?? true,
            institution_id: '22222222-2222-2222-2222-222222222222',
            institutionId: '22222222-2222-2222-2222-222222222222',
            block: dv.block || existing?.block || 'Campus Block',
            floor: dv.floor || existing?.floor || 'Ground Level',
            description: dv.description || existing?.description || '',
            contactPerson: dv.contact_person || existing?.contactPerson || 'Venue Coordinator',
          };
        });

        this.venues = mergedVenues;
      }

      // 4. Fetch Bookings from Supabase (source of truth)
      const { data: dbBookings, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .order('event_date', { ascending: true });

      if (!bookingError && dbBookings) {
        const mappedBookings: Booking[] = dbBookings
          .filter(dbb => !dbb.id?.startsWith('99999999-9999-'))
          .map(dbb => {
          const v = this.venues.find(ven => ven.id === dbb.venue_id);
          const rawStatus = dbb.status || 'Confirmed';
          const normalizedStatus: BookingStatus = 
            rawStatus === 'Approved' ? 'Confirmed' : (rawStatus as BookingStatus);

          return {
            id: dbb.id,
            organizer_id: dbb.organizer_id,
            institution_id: '22222222-2222-2222-2222-222222222222',
            venue_id: dbb.venue_id,
            event_title: dbb.event_title,
            description: dbb.description,
            event_category: dbb.event_category,
            event_date: dbb.event_date,
            start_time: dbb.start_time,
            end_time: dbb.end_time,
            expected_attendees: dbb.expected_attendees,
            status: normalizedStatus,
            created_at: dbb.created_at,
            updated_at: dbb.updated_at,
            organizer_name: dbb.organizer_name || 'Organizer',
            organizer_email: dbb.organizer_email || '',
            department: dbb.department || 'Nitte University',
            venue_name: v?.name || 'Nitte University Venue',
            venue_location: v?.location || 'Nitte University Campus',
            // Compatibility camelCase aliases
            venueId: dbb.venue_id,
            institutionId: '22222222-2222-2222-2222-222222222222',
            userId: dbb.organizer_id,
            eventTitle: dbb.event_title,
            eventDescription: dbb.description,
            eventCategory: dbb.event_category,
            category: dbb.event_category,
            date: dbb.event_date,
            startTime: dbb.start_time,
            endTime: dbb.end_time,
            expectedAttendees: dbb.expected_attendees,
            organizerName: dbb.organizer_name || 'Organizer',
            organizerEmail: dbb.organizer_email || '',
            venueName: v?.name || 'Nitte University Venue',
            venueLocation: v?.location || 'Nitte University Campus',
            createdAt: dbb.created_at,
            updatedAt: dbb.updated_at,
          };
        });

        this.bookings = mappedBookings;
      }

      // Initialize Supabase Realtime channel once for automatic sync across sessions/tabs
      if (!(this as any)._realtimeChannelInitialized) {
        (this as any)._realtimeChannelInitialized = true;
        try {
          supabase
            .channel('public_bookings_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
              this.syncFromSupabase();
            })
            .subscribe();
        } catch (e) {
          console.warn('Supabase Realtime subscription error:', e);
        }
      }

      this.saveLocal();
      return true;
    } catch (err) {
      console.warn('Supabase sync warning:', err);
      return false;
    }
  }

  // --- Getters ---
  public getVenues(): Venue[] {
    return this.venues;
  }

  public getBookings(): Booking[] {
    return this.bookings;
  }

  public getInstitutions(): Institution[] {
    return this.institutions;
  }

  public getProfiles(): Profile[] {
    return this.profiles;
  }

  public getCurrentProfile(): Profile | null {
    return this.currentUser;
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
    const isNitte = lower.endsWith('@nitte.edu');
    const isNmamit = lower.endsWith('@nmamit.in');

    if (!isNitte && !isNmamit) {
      return { success: false, error: 'Please use your Nitte University institutional email address (@nitte.edu).' };
    }

    let user = this.profiles.find(p => p.email.toLowerCase() === lower);

    if (!user) {
      const emailUsername = trimmedEmail.split('@')[0].trim();
      const derivedName = emailUsername;
      const instId = '22222222-2222-2222-2222-222222222222';
      const generatedId = crypto.randomUUID ? crypto.randomUUID() : `user-${Date.now()}`;

      user = {
        id: generatedId,
        full_name: derivedName,
        name: derivedName,
        email: trimmedEmail,
        institution_id: instId,
        institutionId: instId,
        department: 'Nitte University',
        phone: '+91 824 2204300',
      };
      this.profiles.push(user);
    } else {
      const emailUsername = trimmedEmail.split('@')[0].trim();
      if (user.full_name === 'nnmis' || user.full_name === 'Campus Member' || !user.full_name) {
        user.full_name = emailUsername;
        user.name = emailUsername;
      }
      user.institution_id = '22222222-2222-2222-2222-222222222222';
      user.institutionId = '22222222-2222-2222-2222-222222222222';
      user.department = 'Nitte University';

      // Save user to backend Supabase profiles table
      const supabase = getSupabase();
      if (supabase) {
        try {
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password: password,
          });

          if (authError && (authError.message.includes('Invalid login credentials') || authError.message.includes('not found') || authError.status === 400)) {
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email: trimmedEmail,
              password: password,
              options: {
                data: {
                  full_name: user.full_name,
                  department: user.department,
                }
              }
            });
            if (!signUpError && signUpData.user) {
              user.id = signUpData.user.id;
            }
          } else if (!authError && authData.user) {
            user.id = authData.user.id;
          }

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
    this.saveLocal();
    return { success: true, user };
  }

  public logout() {
    const supabase = getSupabase();
    if (supabase) {
      supabase.auth.signOut().catch(err => console.warn('Supabase sign out error:', err));
    }
    this.currentUser = null;
    localStorage.removeItem(CACHE_KEY_SESSION_USER);
    this.notify();
  }

  // --- Strict Double-Booking Conflict Prevention Engine ---
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

    // Only active confirmed bookings create conflicts (Cancelled bookings are excluded)
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
    institution_id?: string;
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
    organizer_id?: string;
    userId?: string;
  }): Promise<{ success: boolean; booking?: Booking; error?: string }> {
    // 1. Availability check
    const check = this.checkAvailability(data.venue_id, data.event_date, data.start_time, data.end_time);
    if (!check.isAvailable) {
      return {
        success: false,
        error: check.reason || 'This venue is already booked for the selected time. Please choose another time or venue.',
      };
    }

    const newId = crypto.randomUUID ? crypto.randomUUID() : 'b-' + Date.now();
    const v = this.venues.find(ven => ven.id === data.venue_id);
    const userId = data.organizer_id || data.userId || this.currentUser?.id || '33333333-3333-3333-3333-333333333335';
    const nowIso = new Date().toISOString();

    const newBooking: Booking = {
      id: newId,
      organizer_id: userId,
      institution_id: '22222222-2222-2222-2222-222222222222',
      venue_id: data.venue_id,
      event_title: data.event_title,
      description: data.description,
      event_category: data.event_category as any,
      event_date: data.event_date,
      start_time: data.start_time,
      end_time: data.end_time,
      expected_attendees: data.expected_attendees,
      status: 'Confirmed',
      special_requirements: data.special_requirements,
      created_at: nowIso,
      updated_at: nowIso,
      organizer_name: data.organizer_name,
      organizer_email: data.organizer_email,
      department: data.department || 'Nitte University',
      venue_name: v?.name || 'Nitte University Venue',
      venue_location: v?.location || 'Nitte University Campus',
      // Compatibility aliases
      venueId: data.venue_id,
      institutionId: '22222222-2222-2222-2222-222222222222',
      userId: userId,
      eventTitle: data.event_title,
      eventDescription: data.description,
      eventCategory: data.event_category as any,
      category: data.event_category as any,
      date: data.event_date,
      startTime: data.start_time,
      endTime: data.end_time,
      expectedAttendees: data.expected_attendees,
      organizerName: data.organizer_name,
      organizerEmail: data.organizer_email,
      venueName: v?.name || 'Nitte University Venue',
      venueLocation: v?.location || 'Nitte University Campus',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // 2. Insert to Supabase backend database
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

  // --- User Booking Deletion ---
  public async deleteBooking(bookingId: string): Promise<boolean> {
    const idx = this.bookings.findIndex(b => b.id === bookingId);
    if (idx === -1) return false;

    this.bookings.splice(idx, 1);

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase
          .from('bookings')
          .delete()
          .eq('id', bookingId);
      } catch (err) {
        console.warn('Supabase delete error:', err);
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
      location: venue.location || 'Nitte University Campus',
      capacity: Number(venue.capacity || 100),
      facilities: venue.facilities || '',
      imageUrl: venue.imageUrl || 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80',
      isAvailable: true,
      institution_id: '22222222-2222-2222-2222-222222222222',
      institutionId: '22222222-2222-2222-2222-222222222222',
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
    // Count only active/confirmed bookings (exclude cancelled bookings)
    const confirmedBookings = this.bookings.filter(b => b.status === 'Confirmed' || b.status === 'Approved');
    const totalBookings = confirmedBookings.length;

    // Determine booked vs available venues for the requested date and time slot
    const targetDate = date || '2026-10-28';
    const targetTime = (time || '10:00').slice(0, 5);

    const bookedVenueIds = new Set<string>();
    confirmedBookings.forEach(b => {
      const bDate = b.event_date || b.date;
      const bStart = (b.start_time || b.startTime || '').slice(0, 5);
      const bEnd = (b.end_time || b.endTime || '').slice(0, 5);
      const vId = b.venue_id || b.venueId;

      if (bDate === targetDate && vId) {
        // Overlap condition: targetTime is within booking window [bStart, bEnd)
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
