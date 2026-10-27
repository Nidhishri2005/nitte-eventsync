-- ==============================================================================
-- Nitte EventSync - Unified Event & Venue Booking Platform
-- Database: Supabase PostgreSQL
-- Institutions: NMAMIT (nmamit.in) & Nitte University (nitte.edu)
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Institutions Table
CREATE TABLE IF NOT EXISTS public.institutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    domain TEXT NOT NULL UNIQUE
);

-- Seed Official Institutions with deterministic UUIDs
INSERT INTO public.institutions (id, name, domain)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'NMAM Institute of Technology', 'nmamit.in'),
    ('22222222-2222-2222-2222-222222222222', 'Nitte (Deemed to be University)', 'nitte.edu')
ON CONFLICT (domain) DO UPDATE 
SET name = EXCLUDED.name;

-- 3. Profiles Table (Linked to Supabase Auth or Institutional SSO)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'faculty', 'admin')),
    department TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Official Profiles (Principal, Faculty Approvers, Student Chair)
INSERT INTO public.profiles (id, full_name, email, institution_id, role, department, phone)
VALUES
    ('33333333-3333-3333-3333-333333333331', 'Dr. Niranjan Chiplunkar', 'principal@nmamit.in', '11111111-1111-1111-1111-111111111111', 'admin', 'Institute Administration', '+91 8258 281263'),
    ('33333333-3333-3333-3333-333333333332', 'Prof. Shashikantha Karinka', 'shashikantha@nmamit.in', '11111111-1111-1111-1111-111111111111', 'faculty', 'Mechanical Engineering', '+91 98451 22340'),
    ('33333333-3333-3333-3333-333333333333', 'Aditya Shenoy', 'aditya.cs23@nmamit.in', '11111111-1111-1111-1111-111111111111', 'student', 'Computer Science & Engineering', '+91 94821 77312'),
    ('33333333-3333-3333-3333-333333333334', 'Dr. Praveen Kumar', 'dean.studentwelfare@nitte.edu', '22222222-2222-2222-2222-222222222222', 'faculty', 'Student Affairs', '+91 824 2204300')
ON CONFLICT (email) DO UPDATE
SET full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    department = EXCLUDED.department,
    phone = EXCLUDED.phone;

-- 4. Venues Table (Official NMAMIT & Nitte University Venues)
CREATE TABLE IF NOT EXISTS public.venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    facilities TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed the 5 Official NMAMIT Venues with deterministic UUIDs
INSERT INTO public.venues (id, name, location, capacity, facilities)
VALUES 
    (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'Sambhram Auditorium',
        'Basement, S Ramanujan Block',
        350,
        'Air Conditioning (AC), Internet Connection, Sound Systems, Projector Screen'
    ),
    (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'Shambhavi Auditorium',
        '1st Floor, APJ Kalam Block',
        150,
        'Air Conditioning (AC), Wi-Fi, LAN, Sound Systems, Projector Screen'
    ),
    (
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'Sowparnika Seminar Hall',
        '1st Floor, S Ramanujan Block',
        100,
        'Air Conditioning (AC), Wi-Fi, LAN, Sound Systems, Projector Screen'
    ),
    (
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
        'Phalguni Seminar Hall',
        '2nd Floor, S Ramanujan Block',
        100,
        'Air Conditioning (AC), Wi-Fi, LAN, Sound Systems, Projector Screen'
    ),
    (
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        'Amphitheatre',
        'Near Hockey Ground, B C Alva Sports Complex, Nitte',
        2500,
        'Large open-air event space suitable for university-wide events, cultural programs, concerts, and gatherings'
    )
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name,
    location = EXCLUDED.location,
    capacity = EXCLUDED.capacity,
    facilities = EXCLUDED.facilities;

-- 5. Bookings Table (Core event bookings)
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    institution_id UUID REFERENCES public.institutions(id) ON DELETE RESTRICT,
    venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE,
    event_title TEXT NOT NULL,
    description TEXT,
    event_category TEXT NOT NULL,
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL CHECK (end_time > start_time),
    expected_attendees INTEGER NOT NULL CHECK (expected_attendees > 0),
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Initial Bookings
INSERT INTO public.bookings (id, organizer_id, institution_id, venue_id, event_title, description, event_category, event_date, start_time, end_time, expected_attendees, status, created_at)
VALUES
    (
        '99999999-9999-9999-9999-999999999901',
        '33333333-3333-3333-3333-333333333333',
        '11111111-1111-1111-1111-111111111111',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'HackNitte 2026: 24-Hour National Hackathon Opening Ceremony',
        'Grand inauguration ceremony for HackNitte 2026 national collegiate hackathon featuring keynote speech by industry leaders.',
        'Technical',
        '2026-10-27',
        '09:00',
        '12:00',
        320,
        'Approved',
        NOW()
    ),
    (
        '99999999-9999-9999-9999-999999999902',
        '33333333-3333-3333-3333-333333333332',
        '11111111-1111-1111-1111-111111111111',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'AI in Healthcare: Joint NMAMIT-Nitte DU Symposium',
        'Collaborative workshop between engineering students and medical faculty exploring machine learning applications in oncology.',
        'Conference',
        '2026-10-27',
        '14:00',
        '17:30',
        260,
        'Approved',
        NOW()
    ),
    (
        '99999999-9999-9999-9999-999999999903',
        '33333333-3333-3333-3333-333333333333',
        '11111111-1111-1111-1111-111111111111',
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'Robotics & Automation Society Hands-on Workshop',
        'Hardware prototyping session on ROS2 and autonomous mobile robots for engineering students.',
        'Workshop',
        '2026-10-28',
        '10:00',
        '13:00',
        120,
        'Approved',
        NOW()
    ),
    (
        '99999999-9999-9999-9999-999999999904',
        '33333333-3333-3333-3333-333333333333',
        '11111111-1111-1111-1111-111111111111',
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'ACM Student Chapter: Competitive Programming Orientation',
        'Orientation and problem-solving strategies for ICPC preliminary rounds.',
        'Student Club',
        '2026-10-28',
        '15:00',
        '17:00',
        80,
        'Approved',
        NOW()
    ),
    (
        '99999999-9999-9999-9999-999999999905',
        '33333333-3333-3333-3333-333333333332',
        '11111111-1111-1111-1111-111111111111',
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
        'FinTech & Blockchain Masterclass',
        'Distinguished lecture on algorithmic trading and decentralized ledger architectures.',
        'Academic',
        '2026-10-29',
        '11:00',
        '13:30',
        90,
        'Pending',
        NOW()
    ),
    (
        '99999999-9999-9999-9999-999999999906',
        '33333333-3333-3333-3333-333333333333',
        '11111111-1111-1111-1111-111111111111',
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        'Incridea 2026: Inter-University Cultural Mega Fest Auditions',
        'Annual campus talent auditions for battle of bands, classical dance ensemble, and street theater.',
        'Cultural',
        '2026-10-30',
        '16:00',
        '21:00',
        1800,
        'Approved',
        NOW()
    )
ON CONFLICT (id) DO NOTHING;

-- 6. Booking Approvals Table (Audit trail for approval/rejection decisions)
CREATE TABLE IF NOT EXISTS public.booking_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    approver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL CHECK (status IN ('Approved', 'Rejected')),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Initial Approval Logs
INSERT INTO public.booking_approvals (booking_id, approver_id, status, comments)
VALUES
    ('99999999-9999-9999-9999-999999999901', '33333333-3333-3333-3333-333333333331', 'Approved', 'Approved by Principal for National Hackathon ceremony'),
    ('99999999-9999-9999-9999-999999999902', '33333333-3333-3333-3333-333333333332', 'Approved', 'Cleared for Joint NMAMIT-Nitte DU Symposium')
ON CONFLICT DO NOTHING;

-- 7. Backend / Database-Level Overlap Conflict Prevention Trigger
-- Prevents any two approved bookings from overlapping at the same venue on the same date!
CREATE OR REPLACE FUNCTION public.check_booking_overlap()
RETURNS TRIGGER AS $$
BEGIN
    -- Only validate if status is or becomes Approved
    IF NEW.status = 'Approved' THEN
        IF EXISTS (
            SELECT 1 FROM public.bookings
            WHERE venue_id = NEW.venue_id
              AND event_date = NEW.event_date
              AND id <> NEW.id
              AND status = 'Approved'
              AND (NEW.start_time < end_time AND NEW.end_time > start_time)
        ) THEN
            RAISE EXCEPTION 'Double-booking conflict: This venue is already booked by another approved event during this time slot on %', NEW.event_date;
        END IF;
    END IF;
    
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_booking_overlap ON public.bookings;
CREATE TRIGGER trigger_prevent_booking_overlap
BEFORE INSERT OR UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.check_booking_overlap();

-- 8. Row Level Security (RLS) Configuration
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_approvals ENABLE ROW LEVEL SECURITY;

-- Institutions & Venues: Viewable by anyone
CREATE POLICY "Institutions are viewable by all users" 
ON public.institutions FOR SELECT 
USING (true);

CREATE POLICY "Venues are viewable by all users" 
ON public.venues FOR SELECT 
USING (true);

CREATE POLICY "Venues can be added/edited by authenticated users" 
ON public.venues FOR ALL 
USING (true);

-- Profiles: Viewable by anyone
CREATE POLICY "Profiles are viewable by all users" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (true);

-- Bookings: Anyone can view bookings
CREATE POLICY "Bookings are viewable by all users" 
ON public.bookings FOR SELECT 
USING (true);

CREATE POLICY "Users can insert bookings" 
ON public.bookings FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update bookings" 
ON public.bookings FOR UPDATE 
USING (true);

-- Booking Approvals: Viewable and insertable
CREATE POLICY "Approvals viewable by all" 
ON public.booking_approvals FOR SELECT 
USING (true);

CREATE POLICY "Users can insert approvals" 
ON public.booking_approvals FOR INSERT 
WITH CHECK (true);
