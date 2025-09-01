-- Add attendance source tracking to participants table
-- This tracks who marked the attendance (Chair vs Press)

ALTER TABLE participants 
ADD COLUMN day1_marked_by TEXT,
ADD COLUMN day1_marked_by_user TEXT,
ADD COLUMN day1_marked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN day2_marked_by TEXT,
ADD COLUMN day2_marked_by_user TEXT,
ADD COLUMN day2_marked_at TIMESTAMP WITH TIME ZONE;