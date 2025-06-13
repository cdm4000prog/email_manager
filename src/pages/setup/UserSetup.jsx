import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  FormControlLabel,
  Switch,
  MenuItem,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

// List of timezones
const timezones = [
  'UTC-12:00', 'UTC-11:00', 'UTC-10:00', 'UTC-09:00', 'UTC-08:00', 'UTC-07:00',
  'UTC-06:00', 'UTC-05:00', 'UTC-04:00', 'UTC-03:00', 'UTC-02:00', 'UTC-01:00',
  'UTC+00:00', 'UTC+01:00', 'UTC+02:00', 'UTC+03:00', 'UTC+04:00', 'UTC+05:00',
  'UTC+06:00', 'UTC+07:00', 'UTC+08:00', 'UTC+09:00', 'UTC+10:00', 'UTC+11:00',
  'UTC+12:00', 'UTC+13:00', 'UTC+14:00',
];

export default function UserSetup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [timezone, setTimezone] = useState('UTC+00:00');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [dailySummary, setDailySummary] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  
  useEffect(() => {
    const fetchUserSettings = async () => {
      try {
        setLoading(true);
        
        if (!user) return;
        
        // Set email from auth
        setEmail(user.email || '');
        
        // Fetch user settings from database
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          // PGRST116 is "no rows returned" error, which is fine for new users
          throw error;
        }
        
        if (data) {
          // Populate form with existing data
          setName(data.name || '');
          setTimezone(data.timezone || 'UTC+00:00');
          setEmailNotifications(data.email_notifications !== false);
          setDailySummary(data.daily_summary !== false);
          setWeeklyReport(data.weekly_report !== false);
        }
        
      } catch (error) {
        console.error('Error fetching user settings:', error);
        setError('Failed to load user settings. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserSettings();
  }, [user]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      
      // Validate form
      if (!name.trim()) {
        throw new Error('Name is required');
      }
      
      // Prepare data
      const userData = {
        user_id: user.id,
        name,
        timezone,
        email_notifications: emailNotifications,
        daily_summary: dailySummary,
        weekly_report: weeklyReport,
        updated_at: new Date(),
      };
      
      // Check if record exists
      const { data: existingData, error: checkError } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }
      
      let result;
      
      if (existingData) {
        // Update existing record
        result = await supabase
          .from('user_settings')
          .update(userData)
          .eq('user_id', user.id);
      } else {
        // Insert new record
        result = await supabase
          .from('user_settings')
          .insert([userData]);
      }
      
      if (result.error) {
        throw result.error;
      }
      
      setSuccess(true);
      
      // Redirect to next setup page if this is first time setup
      const { data: hasEmailAccounts } = await supabase
        .from('email_accounts')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);
      
      if (!hasEmailAccounts || hasEmailAccounts.length === 0) {
        // If no email accounts, continue with setup flow
        setTimeout(() => {
          navigate('/setup/error-email');
        }, 1500);
      }
      
    } catch (error) {
      console.error('Error saving user settings:', error);
      setError(error.message || 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      <Typography variant="h5" component="h1" gutterBottom>
        User Settings
      </Typography>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Settings saved successfully!
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                value={email}
                disabled
                helperText="Email cannot be changed"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                {timezones.map((tz) => (
                  <MenuItem key={tz} value={tz}>
                    {tz}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Notification Preferences
              </Typography>
              
              <FormControl component="fieldset" sx={{ mt: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={emailNotifications}
                      onChange={(e) => setEmailNotifications(e.target.checked)}
                    />
                  }
                  label="Email Notifications"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={dailySummary}
                      onChange={(e) => setDailySummary(e.target.checked)}
                      disabled={!emailNotifications}
                    />
                  }
                  label="Daily Summary"
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={weeklyReport}
                      onChange={(e) => setWeeklyReport(e.target.checked)}
                      disabled={!emailNotifications}
                    />
                  }
                  label="Weekly Report"
                />
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={saving}
                >
                  {saving ? <CircularProgress size={24} /> : 'Save Settings'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
}
