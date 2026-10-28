import { Institution, Venue, Booking, Profile } from '../types';

export const INSTITUTIONS: Institution[] = [
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Nitte (Deemed to be University)',
    domain: 'nitte.edu',
    shortName: 'Nitte University',
    logo: '🎓',
    address: 'Derlakatte, Mangaluru - 575018, Karnataka',
  },
];

export const INITIAL_PROFILES: Profile[] = [
  {
    id: '33333333-3333-3333-3333-333333333334',
    full_name: 'Dr. Praveen Kumar',
    name: 'Dr. Praveen Kumar',
    email: 'dean.studentwelfare@nitte.edu',
    institution_id: '22222222-2222-2222-2222-222222222222',
    institutionId: '22222222-2222-2222-2222-222222222222',
    role: 'faculty',
    department: 'Student Affairs',
    phone: '+91 824 2204300',
  },
  {
    id: '33333333-3333-3333-3333-333333333335',
    full_name: 'Campus Member',
    name: 'Campus Member',
    email: 'student@nitte.edu',
    institution_id: '22222222-2222-2222-2222-222222222222',
    institutionId: '22222222-2222-2222-2222-222222222222',
    role: 'student',
    department: 'Nitte University',
    phone: '+91 94821 77312',
  },
];

export const INITIAL_USERS: Profile[] = INITIAL_PROFILES;

export const INITIAL_VENUES: Venue[] = [
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: 'Sambhram Auditorium',
    location: 'Basement, S Ramanujan Block, Nitte University',
    capacity: 350,
    facilities: 'Air Conditioning (AC), Internet Connection, Sound Systems, Projector Screen',
    imageUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80',
    isAvailable: true,
    institution_id: '22222222-2222-2222-2222-222222222222',
    institutionId: '22222222-2222-2222-2222-222222222222',
    block: 'S Ramanujan Block',
    floor: 'Basement',
  },
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    name: 'Shambhavi Auditorium',
    location: '1st Floor, APJ Kalam Block, Nitte University',
    capacity: 150,
    facilities: 'Air Conditioning (AC), Wi-Fi, LAN, Sound Systems, Projector Screen',
    imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
    isAvailable: true,
    institution_id: '22222222-2222-2222-2222-222222222222',
    institutionId: '22222222-2222-2222-2222-222222222222',
    block: 'APJ Kalam Block',
    floor: '1st Floor',
  },
  {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    name: 'Sowparnika Seminar Hall',
    location: '1st Floor, S Ramanujan Block, Nitte University',
    capacity: 100,
    facilities: 'Air Conditioning (AC), Wi-Fi, LAN, Sound Systems, Projector Screen',
    imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80',
    isAvailable: true,
    institution_id: '22222222-2222-2222-2222-222222222222',
    institutionId: '22222222-2222-2222-2222-222222222222',
    block: 'S Ramanujan Block',
    floor: '1st Floor',
  },
  {
    id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    name: 'Phalguni Seminar Hall',
    location: '2nd Floor, S Ramanujan Block, Nitte University',
    capacity: 100,
    facilities: 'Air Conditioning (AC), Wi-Fi, LAN, Sound Systems, Projector Screen',
    imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80',
    isAvailable: true,
    institution_id: '22222222-2222-2222-2222-222222222222',
    institutionId: '22222222-2222-2222-2222-222222222222',
    block: 'S Ramanujan Block',
    floor: '2nd Floor',
  },
  {
    id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
    name: 'Amphitheatre',
    location: 'Near Hockey Ground, B C Alva Sports Complex, Nitte University',
    capacity: 2500,
    facilities: 'Large open-air event space suitable for university-wide events, cultural programs, concerts, and gatherings',
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
    isAvailable: true,
    institution_id: '22222222-2222-2222-2222-222222222222',
    institutionId: '22222222-2222-2222-2222-222222222222',
    block: 'B C Alva Sports Complex',
    floor: 'Ground Level',
  },
];

// No hardcoded sample bookings - only actual database and user-created bookings
const rawBookings: Booking[] = [];

export const INITIAL_BOOKINGS: Booking[] = rawBookings;
