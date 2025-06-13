/*
  # Create warmup timing settings table
  
  1. New Tables
    - `warmup_timing_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `min_interval_minutes` (integer)
      - `max_interval_minutes` (integer)
      - `business_hours_only` (boolean)
      - `business_hours_start` (integer)
      - `business_hours_end` (integer)
      - `work_days` (integer[])
      - `initial_daily_limit` (integer)
      - `max_daily_limit` (integer)
      - `ramp_up_days` (integer)
      - `ramp_up_type` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on `warmup_timing_settings` table
    - Add policies for users to manage their own settings
*/

CREATE TABLE IF NOT EXISTS warmup_timing_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  min_interval_minutes integer DEFAULT 60,
  max_interval_minutes integer DEFAULT 120,
  business_hours_only boolean DEFAULT true,
  business_hours_start integer DEFAULT 9,
  business_hours_end integer DEFAULT 17,
  work_days integer[] DEFAULT '{1,2,3,4,5}'::integer[],
  initial_daily_limit integer DEFAULT 5,
  max_daily_limit integer DEFAULT 30,
  ramp_up_days integer DEFAULT 14,
  ramp_up_type text DEFAULT 'linear',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE warmup_timing_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own warmup timing settings"
  ON warmup_timing_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own warmup timing settings"
  ON warmup_timing_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own warmup timing settings"
  ON warmup_timing_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);