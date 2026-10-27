-- ==============================================================================
-- Nitte EventSync - Migration: Remove Approvals & Enable Direct Booking
-- Run this in your Supabase Dashboard -> SQL Editor
-- ==============================================================================

-- 1. Update any existing bookings to 'Confirmed'
UPDATE public.bookings 
SET status = 'Confirmed' 
WHERE status IN ('Pending', 'Approved');

-- 2. Update default status on bookings to 'Confirmed'
ALTER TABLE public.bookings 
ALTER COLUMN status SET DEFAULT 'Confirmed';

-- 3. Update check constraint on status (drop old constraint and add new)
DO $$
BEGIN
    ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
    ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check CHECK (status IN ('Confirmed', 'Cancelled'));
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Constraint update skipped or not applicable: %', SQLERRM;
END $$;

-- 4. Drop booking_approvals table if no longer used
DROP TABLE IF EXISTS public.booking_approvals CASCADE;

-- 5. Update the Database Overlap Prevention Trigger
CREATE OR REPLACE FUNCTION public.check_booking_overlap()
RETURNS TRIGGER AS $$
BEGIN
    -- Reject any overlapping active confirmed booking at the same venue on the same date
    IF NEW.status = 'Confirmed' THEN
        IF EXISTS (
            SELECT 1 FROM public.bookings
            WHERE venue_id = NEW.venue_id
              AND event_date = NEW.event_date
              AND id <> NEW.id
              AND status = 'Confirmed'
              AND (NEW.start_time < end_time AND NEW.end_time > start_time)
        ) THEN
            RAISE EXCEPTION 'This venue is already booked for the selected time. Please choose another time or venue.';
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

-- 6. Ensure RLS Policies for Bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Bookings are viewable by all users" ON public.bookings;
CREATE POLICY "Bookings are viewable by all users" 
ON public.bookings FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Users can insert bookings" ON public.bookings;
CREATE POLICY "Users can insert bookings" 
ON public.bookings FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update bookings" ON public.bookings;
CREATE POLICY "Users can update bookings" 
ON public.bookings FOR UPDATE 
USING (true);
