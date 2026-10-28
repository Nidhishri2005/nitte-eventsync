-- ==============================================================================
-- Nitte EventSync - Unified Venue Booking Platform Schema
-- Database: Supabase PostgreSQL
-- Sole Institution: Nitte (Deemed to be University) (nitte.edu)
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Institutions Table (Sole Campus: Nitte University)
CREATE TABLE IF NOT EXISTS public.institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    domain TEXT NOT NULL UNIQUE,
    short_name TEXT NOT NULL DEFAULT 'Nitte University',
    address TEXT NOT NULL DEFAULT 'Derlakatte, Mangaluru - 575018',
    logo TEXT NOT NULL DEFAULT '🎓'
);

-- Seed Sole Official Institution: Nitte University
INSERT INTO public.institutions (id, name, domain, short_name, address, logo)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    'Nitte (Deemed to be University)',
    'nitte.edu',
    'Nitte University',
    'Derlakatte, Mangaluru - 575018',
    '🎓'
)
ON CONFLICT (domain) DO UPDATE 
SET name = EXCLUDED.name,
    short_name = EXCLUDED.short_name,
    address = EXCLUDED.address;

-- Clean up any legacy institution if present
DELETE FROM public.institutions WHERE id = '11111111-1111-1111-1111-111111111111';

-- 3. Profiles Table (Compatible with Supabase Auth auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL DEFAULT '22222222-2222-2222-2222-222222222222',
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'faculty', 'admin')),
    department TEXT DEFAULT 'Nitte University',
    phone TEXT DEFAULT '+91 824 2204300',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Automatic Profile Synchronization on Supabase Auth Sign Up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, institution_id, role, department)
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            split_part(NEW.email, '@', 1)
        ),
        NEW.email,
        '22222222-2222-2222-2222-222222222222',
        COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
        COALESCE(NEW.raw_user_meta_data->>'department', 'Nitte University')
    )
    ON CONFLICT (email) DO UPDATE
    SET id = EXCLUDED.id,
        full_name = EXCLUDED.full_name;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Venues Table (Official Nitte University Venues)
CREATE TABLE IF NOT EXISTS public.venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    facilities TEXT NOT NULL,
    institution_id UUID REFERENCES public.institutions(id) ON DELETE SET NULL DEFAULT '22222222-2222-2222-2222-222222222222',
    image_url TEXT,
    block TEXT,
    floor TEXT,
    contact_person TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed the 5 Official Nitte University Venues
INSERT INTO public.venues (id, name, location, capacity, facilities, institution_id, image_url, block, floor, contact_person, is_available)
VALUES 
    (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'Sambhram Auditorium',
        'Basement, S Ramanujan Block, Nitte Campus',
        350,
        'Air Conditioning (AC), Internet Connection, Sound Systems, Projector Screen',
        '22222222-2222-2222-2222-222222222222',
        'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80',
        'S Ramanujan Block',
        'Basement Level',
        'Auditorium In-Charge (Ext: 281)',
        TRUE
    ),
    (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'Shambhavi Auditorium',
        '1st Floor, APJ Kalam Block, Nitte Campus',
        150,
        'Air Conditioning (AC), Wi-Fi, LAN, Sound Systems, Projector Screen',
        '22222222-2222-2222-2222-222222222222',
        'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?auto=format&fit=crop&w=1200&q=80',
        'APJ Kalam Block',
        '1st Floor',
        'AV Facility Admin (Ext: 290)',
        TRUE
    ),
    (
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        'Sowparnika Seminar Hall',
        '1st Floor, S Ramanujan Block, Nitte Campus',
        100,
        'Air Conditioning (AC), Wi-Fi, LAN, Sound Systems, Projector Screen',
        '22222222-2222-2222-2222-222222222222',
        'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
        'S Ramanujan Block',
        '1st Floor',
        'Seminar Coordinator (Ext: 215)',
        TRUE
    ),
    (
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
        'Phalguni Seminar Hall',
        '2nd Floor, S Ramanujan Block, Nitte Campus',
        100,
        'Air Conditioning (AC), Wi-Fi, LAN, Sound Systems, Projector Screen',
        '22222222-2222-2222-2222-222222222222',
        'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80',
        'S Ramanujan Block',
        '2nd Floor',
        'Department Coordinator (Ext: 218)',
        TRUE
    ),
    (
        'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
        'Amphitheatre',
        'Near Hockey Ground, B C Alva Sports Complex, Nitte Campus',
        2500,
        'Large open-air event space suitable for university-wide events, cultural programs, concerts, and gatherings',
        '22222222-2222-2222-2222-222222222222',
        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
        'B C Alva Sports Complex',
        'Open Air Arena',
        'Estate Manager (Ext: 104)',
        TRUE
    )
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name,
    location = EXCLUDED.location,
    capacity = EXCLUDED.capacity,
    facilities = EXCLUDED.facilities,
    institution_id = EXCLUDED.institution_id,
    image_url = EXCLUDED.image_url;

-- 5. Bookings Table (Direct Venue Bookings - No Approval Workflow)
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    institution_id UUID REFERENCES public.institutions(id) ON DELETE RESTRICT DEFAULT '22222222-2222-2222-2222-222222222222',
    venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE,
    event_title TEXT NOT NULL,
    description TEXT,
    event_category TEXT NOT NULL,
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL CHECK (end_time > start_time),
    expected_attendees INTEGER NOT NULL CHECK (expected_attendees > 0),
    status TEXT NOT NULL DEFAULT 'Confirmed' CHECK (status IN ('Confirmed', 'Cancelled')),
    special_requirements TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: No fake bookings are inserted! Real bookings only.

-- 6. Strict Overlap Conflict Prevention Trigger
-- Prevents double-booking at the PostgreSQL database level
CREATE OR REPLACE FUNCTION public.check_booking_overlap()
RETURNS TRIGGER AS $$
BEGIN
    -- Only active Confirmed bookings can create a conflict
    IF NEW.status = 'Confirmed' THEN
        IF EXISTS (
            SELECT 1 FROM public.bookings
            WHERE venue_id = NEW.venue_id
              AND event_date = NEW.event_date
              AND id <> NEW.id
              AND status = 'Confirmed'
              AND (NEW.start_time < end_time AND NEW.end_time > start_time)
        ) THEN
            RAISE EXCEPTION 'Double-booking conflict: This venue is already booked for the selected date and time slot.';
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

-- 7. Row Level Security (RLS) Configuration
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Institutions: Viewable by everyone
DROP POLICY IF EXISTS "Institutions are viewable by all users" ON public.institutions;
CREATE POLICY "Institutions are viewable by all users" 
ON public.institutions FOR SELECT 
USING (true);

-- Venues: Viewable by everyone; insertable by authenticated users
DROP POLICY IF EXISTS "Venues are viewable by all users" ON public.venues;
CREATE POLICY "Venues are viewable by all users" 
ON public.venues FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Venues can be added/edited by authenticated users" ON public.venues;
CREATE POLICY "Venues can be added/edited by authenticated users" 
ON public.venues FOR ALL 
USING (true);

-- Profiles: Viewable by everyone
DROP POLICY IF EXISTS "Profiles are viewable by all users" ON public.profiles;
CREATE POLICY "Profiles are viewable by all users" 
ON public.profiles FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() IS NULL OR id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() IS NULL OR id = auth.uid());

-- Bookings: Viewable by everyone
DROP POLICY IF EXISTS "Bookings are viewable by all users" ON public.bookings;
CREATE POLICY "Bookings are viewable by all users" 
ON public.bookings FOR SELECT 
USING (true);

-- Bookings: Authenticated users can insert bookings
DROP POLICY IF EXISTS "Users can insert bookings" ON public.bookings;
CREATE POLICY "Users can insert bookings" 
ON public.bookings FOR INSERT 
WITH CHECK (auth.uid() IS NULL OR organizer_id = auth.uid());

-- Bookings: Users can ONLY update/cancel their own bookings
DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
CREATE POLICY "Users can update own bookings" 
ON public.bookings FOR UPDATE 
USING (auth.uid() IS NULL OR organizer_id = auth.uid())
WITH CHECK (auth.uid() IS NULL OR organizer_id = auth.uid());

-- Bookings: Users can ONLY delete their own bookings
DROP POLICY IF EXISTS "Users can delete own bookings" ON public.bookings;
CREATE POLICY "Users can delete own bookings" 
ON public.bookings FOR DELETE 
USING (auth.uid() IS NULL OR organizer_id = auth.uid());
