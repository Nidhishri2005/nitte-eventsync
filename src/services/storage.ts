import { db, getUserDisplayName } from './db';
import { Booking, Venue, Profile, VenueAvailabilityCheck } from '../types';

export { getUserDisplayName };

class StorageService {
  public subscribe(listener: () => void): () => void {
    return db.subscribe(listener);
  }

  public getBookings(): Booking[] {
    return db.getBookings();
  }

  public getVenues(): Venue[] {
    return db.getVenues();
  }

  public getUsers(): Profile[] {
    return db.getProfiles();
  }

  public getCurrentUser(): Profile {
    return db.getCurrentProfile();
  }

  public getActiveUser(): Profile | null {
    return db.getActiveUser();
  }

  public getUserDisplayName(profile?: Profile | null, email?: string): string {
    return getUserDisplayName(profile, email);
  }

  public isLoggedIn(): boolean {
    return db.isLoggedIn();
  }

  public async loginDemo(email: string, password: string): Promise<{ success: boolean; user?: Profile; error?: string }> {
    return db.loginDemo(email, password);
  }

  public logout(): void {
    db.logout();
  }

  public async syncFromSupabase(): Promise<boolean> {
    return db.syncFromSupabase();
  }

  public checkAvailability(
    venueId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeBookingId?: string
  ): VenueAvailabilityCheck {
    return db.checkAvailability(venueId, date, startTime, endTime, excludeBookingId);
  }

  public async createBooking(data: any): Promise<{ success: boolean; booking?: Booking; error?: string }> {
    const venueId = data.venue_id || data.venueId;
    const institutionId = data.institution_id || data.institutionId || '11111111-1111-1111-1111-111111111111';
    const eventTitle = data.event_title || data.eventTitle;
    const description = data.description || data.eventDescription || '';
    const eventCategory = data.event_category || data.eventCategory || data.category || 'Technical';
    const eventDate = data.event_date || data.date;
    const startTime = data.start_time || data.startTime;
    const endTime = data.end_time || data.endTime;
    const expectedAttendees = Number(data.expected_attendees || data.expectedAttendees || 50);
    const organizerName = data.organizer_name || data.organizerName || '';
    const organizerEmail = data.organizer_email || data.organizerEmail || '';
    const department = data.department || '';
    const specialRequirements = data.special_requirements || data.specialRequirements || '';

    return db.createBooking({
      venue_id: venueId,
      institution_id: institutionId,
      event_title: eventTitle,
      description,
      event_category: eventCategory,
      event_date: eventDate,
      start_time: startTime,
      end_time: endTime,
      expected_attendees: expectedAttendees,
      organizer_name: organizerName,
      organizer_email: organizerEmail,
      department,
      special_requirements: specialRequirements,
    });
  }

  public async cancelBooking(bookingId: string): Promise<boolean> {
    return db.cancelBooking(bookingId);
  }

  public async addVenue(venue: Partial<Venue>) {
    return db.addVenue(venue);
  }

  public getStats(date?: string, time?: string) {
    return db.getStats(date, time);
  }
}

export const storage = new StorageService();
