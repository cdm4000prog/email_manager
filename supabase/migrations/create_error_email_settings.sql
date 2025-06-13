/*
  # Create error email settings table
  
  1. New Tables
    - `error_email_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `notification_email` (text)
      - `notify_on_auth_error` (boolean)
      - `notify_on_send_error` (boolean)
      - `notify_on_receive_error` (boolean)
      - `notify_on_spam_detection` (boolean)
      - `notify_on_bounce` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on `error_email_settings` table
    - Add policies for users to manage their own settings
*/

CREATE TABLE IF NOT EXISTS error_email_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  notification_email text NOT NULL,
  notify_on_auth_error boolean DEFAULT true,
  notify_on_send_error boolean DEFAULT true,
  notify_on_receive_error boolean DEFAULT true,
  notify_on_spam_detection boolean DEFAULT true,
  notify_on_bounce boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE error_email_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own error email settings"
  ON error_email_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own error email settings"
  ON error_email_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own error email settings"
  ON error_email_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);