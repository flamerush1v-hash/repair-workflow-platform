-- RepairFlow: separate Admin decision for accepting/rejecting a new repair request.
-- Run once in Supabase > SQL Editor > New query.
-- This is separate from the customer's later estimate approval/rejection.

ALTER TABLE public.repair_tickets
  ADD COLUMN IF NOT EXISTS request_status text NOT NULL DEFAULT 'Pending';

ALTER TABLE public.repair_tickets
  ADD COLUMN IF NOT EXISTS request_rejection_reason text NOT NULL DEFAULT '';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'repair_tickets_request_status_check'
      AND conrelid = 'public.repair_tickets'::regclass
  ) THEN
    ALTER TABLE public.repair_tickets
      ADD CONSTRAINT repair_tickets_request_status_check
      CHECK (request_status IN ('Pending', 'Accepted', 'Rejected'));
  END IF;
END $$;

-- Existing ticket rows become Pending by default if the columns are newly added.
-- Admin can then explicitly accept or reject them from the RepairFlow interface.
