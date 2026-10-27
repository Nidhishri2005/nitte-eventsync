import { db } from './db';
import { Booking, Venue, Profile, VenueAvailabilityCheck, BookingStatus } from '../types';

/**
 * StorageService provides backward compatibility while delegating 
 * all operations directly to the unified Supabase-connected `db` service.
 */
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

  public setCurrentUser(id: string): void {
    db.setCurrentProfile(id);
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
    });
  }

  public async updateBookingStatus(
    bookingId: string,
    status: BookingStatus,
    _approverName?: string,
    comments?: string
  ): Promise<{ success: boolean; error?: string }> {
    return db.updateBookingStatus(bookingId, status, comments);
  }

  public async cancelBooking(bookingId: string): Promise<boolean> {
    return db.cancelBooking(bookingId);
  }

  public async addVenue(venue: Partial<Venue>) {
    return db.addVenue(venue);
  }

  public async updateVenue(venueOrId: Venue | string, partial?: Partial<Venue>) {
    return db.updateVenue(venueOrId as any, partial);
  }

  public exportDatabase() {
    return db.exportDatabase();
  }

  public resetToDefault() {
    db.resetToDefault();
  }

  public getStats() {
    return db.getStats();
  }
}

export const storage = new StorageService();
