-- Migration 005: Create batch check‑in procedures and batch_checkins table
-- This migration adds the batch_checkins table and RPC functions for batch check‑in operations.

-- 1. Table to store batch metadata
CREATE TABLE IF NOT EXISTS batch_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_id UUID REFERENCES shifts(id) NOT NULL,
    performed_by UUID REFERENCES staffs(id) NOT NULL,
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT NOT NULL CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'CANCELLED'))
);

-- 2. Function to record a single check‑in within a batch
CREATE OR REPLACE FUNCTION public.record_batch_checkin(
    p_registration_id UUID,
    p_card_code TEXT,
    p_lat NUMERIC,
    p_lng NUMERIC,
    p_performed_by UUID
) RETURNS VOID AS $$
DECLARE
    v_sessions_before INT;
BEGIN
    -- Verify the registration exists and has remaining sessions
    SELECT remaining_sessions INTO v_sessions_before FROM registrations WHERE id = p_registration_id;
    IF v_sessions_before IS NULL OR v_sessions_before <= 0 THEN
        RAISE EXCEPTION 'No remaining sessions for registration %', p_registration_id;
    END IF;

    -- Decrement remaining sessions
    UPDATE registrations
    SET remaining_sessions = remaining_sessions - 1
    WHERE id = p_registration_id;

    -- Insert a check‑in log (ticket_code generated as HE26 + random part on server side)
    INSERT INTO checkin_logs (registration_id, card_code, ticket_code, sessions_before, sessions_after, checked_in_at)
    VALUES (
        p_registration_id,
        p_card_code,
        concat('HE26', substr(md5(random()::text), 0, 9)), -- 8 random chars
        v_sessions_before,
        v_sessions_before - 1,
        now()
    );

    -- Optionally log performed_by somewhere (not stored in checkin_logs but can be joined via batch_checkins later)
    PERFORM 1; -- placeholder
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Function to cancel a single check‑in (admin only)
CREATE OR REPLACE FUNCTION public.cancel_batch_checkin(
    p_log_id UUID,
    p_performed_by UUID
) RETURNS VOID AS $$
DECLARE
    v_registration_id UUID;
    v_sessions_before INT;
BEGIN
    -- Verify performed_by is admin (simple role check placeholder)
    IF NOT (SELECT role FROM staffs WHERE id = p_performed_by) IN ('ADMIN') THEN
        RAISE EXCEPTION 'Only admin can cancel check‑in';
    END IF;

    SELECT registration_id INTO v_registration_id FROM checkin_logs WHERE id = p_log_id;
    SELECT remaining_sessions INTO v_sessions_before FROM registrations WHERE id = v_registration_id;

    -- Increment remaining sessions
    UPDATE registrations
    SET remaining_sessions = remaining_sessions + 1
    WHERE id = v_registration_id;

    -- Delete the log
    DELETE FROM checkin_logs WHERE id = p_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function to finalize a batch (save & close or save & print)
CREATE OR REPLACE FUNCTION public.finalize_batch_checkin(
    p_batch_id UUID,
    p_performed_by UUID,
    p_action TEXT
) RETURNS VOID AS $$
BEGIN
    UPDATE batch_checkins
    SET status = CASE WHEN p_action = 'save_print' THEN 'COMPLETED' ELSE 'COMPLETED' END,
        performed_at = now()
    WHERE id = p_batch_id;
    -- In a real implementation we would generate a PDF/CSV if p_action = 'save_print'.
    PERFORM 1; -- placeholder
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Grant execute rights to authenticated role
GRANT EXECUTE ON FUNCTION public.record_batch_checkin(UUID, TEXT, NUMERIC, NUMERIC, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_batch_checkin(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_batch_checkin(UUID, UUID, TEXT) TO authenticated;

-- 6. Enable Row Level Security on new table
ALTER TABLE batch_checkins ENABLE ROW LEVEL SECURITY;

-- 7. Policies for batch_checkins
CREATE POLICY "Allow admin and staff read batch_checkins"
    ON batch_checkins FOR SELECT TO authenticated USING (auth.role() IN ('ADMIN', 'STAFF'));

CREATE POLICY "Allow admin and staff insert batch_checkins"
    ON batch_checkins FOR INSERT TO authenticated WITH CHECK (auth.role() IN ('ADMIN', 'STAFF'));

CREATE POLICY "Allow admin update batch_checkins"
    ON batch_checkins FOR UPDATE TO authenticated USING (auth.role() = 'ADMIN') WITH CHECK (auth.role() = 'ADMIN');

CREATE POLICY "Allow admin delete batch_checkins"
    ON batch_checkins FOR DELETE TO authenticated USING (auth.role() = 'ADMIN');
