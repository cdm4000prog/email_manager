/*
  # Create email accounts table
  
  1. New Tables
    - `email_accounts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `email` (text)
      - `smtp_host` (text)
      - `smtp_port` (integer)
      - `smtp_username` (text)
      - `smtp_password` (text)
      - `imap_host` (text)
      - `imap_port` (integer)
      - `imap_username` (text)
      - `imap_password` (text)
      - `use_ssl` (boolean)
      - `active` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on `email_accounts` table
    - Add policies for users to manage their own email accounts
*/

CREATE TABLE IF NOT EXISTS email_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  smtp_host text NOT NULL,
  smtp_port integer NOT NULL,
  smtp_username text NOT NULL,
  smtp_password text NOT NULL,
  imap_host text NOT NULL,
  imap_port integer NOT NULL,
  imap_username text NOT NULL,
  imap_password text NOT NULL,
  use_ssl boolean DEFAULT true NOT NULL,
  active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, email)
);

-- Enable Row Level Security
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own email accounts"
  ON email_accounts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email accounts"
  ON email_accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email accounts"
  ON email_accounts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own email accounts"
  ON email_accounts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
