import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  FormControlLabel,
  FormGroup,
  Checkbox,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function ErrorEmailSetup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Form state
  const [notificationEmail, setNotificationEmail] = useState('');
  const [notifyOnAuthError, setNotifyOnAuthError] = useState(true);
  const [notifyOnSendError, setNotifyOnSendError] = useState(true);
  const [notifyOnReceiveError, setNotifyOnReceiveError] = useState(true);
  const [notifyOnSpamDetection, setNotifyOnSpamDetection] = useState(true);
  const [notifyOnBounce, setNotifyOnBounce] = useState(true);
  
  useEffect(() => {
    const fetchErrorEmailSettings = async () => {
      try {
        setLoading(true);
        
        if (!user) return;
        
        // Set default notification email to user's email
        setNotificationEmail(user.email || '');
        
        // Fetch error email settings from database
        const { data, error } = await supabase
          .from('error_email_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          // PGRST116 is "no rows returned" error, which is fine for new users
          throw error;
        }
        
        if (data) {
          // Populate form with existing data
          setNotificationEmail(data.notification_email || user.email || '');
          setNotifyOnAuthError(data.notify_on_auth_error !== false);
          setNotifyOnSendError(data.notify_on_send_error !== false);
          setNotifyOnReceiveError(data.notify_on_receive_error !== false);
          setNotifyOnSpamDetection(data.notify_on_spam_detection !== false);
          setNotifyOnBounce(data.notify_on_bounce !== false);
        }
        
      } catch (error) {
        console.error('Error fetching error email settings:', error);
        setError('Failed to load error email settings. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchErrorEmailSettings();
  }, [user]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      
      // Validate form
      if (!notificationEmail.trim()) {
        throw new Error('Notification email is required');
      }
      
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notificationEmail)) {
        throw new Error('Please enter a valid email address');
      }
      
      // Prepare data
      const errorEmailData = {
        user_id: user.id,
        notification_email: notificationEmail,
        notify_on_auth_error: notifyOnAuthError,
        notify_on_send_error: notifyOnSendError,
        notify_on_receive_error: notifyOnReceiveError,
        notify_on_spam_detection: notifyOnSpamDetection,
        notify_on_bounce: notifyOnBounce,
        updated_at: new Date(),
      };
      
      // Check if record exists
      const { data: existingData, error: checkError } = await supabase
        .from('error_email_settings')
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
          .from('error_email_settings')
          .update(errorEmailData)
          .eq('user_id', user.id);
      } else {
        // Insert new record
        result = await supabase
          .from('error_email_settings')
          .insert([errorEmailData]);
      }
      
      if (result.error) {
        throw result.error;
      }
      
      setSuccess(true);
      
      // Redirect to next setup page if this is first time setup
      const { data: hasWarmupSettings } = await supabase
        .from('warmup_timing_settings')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);
      
      if (!hasWarmupSettings || hasWarmupSettings.length === 0) {
        // If no warmup settings, continue with setup flow
        setTimeout(() => {
          navigate('/setup/warmup-timing');
        }, 1500);
      }
      
    } catch (error) {
      console.error('Error saving error email settings:', error);
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
        Error Email Settings
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
            <Grid item xs={12}>
              <Typography variant="body1" paragraph>
                Configure where and when you want to receive error notifications for your email warmup process.
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notification Email"
                type="email"
                value={notificationEmail}
                onChange={(e) => setNotificationEmail(e.target.value)}
                required
                helperText="Where should we send error notifications?"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Notification Types
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Select which types of errors you want to be notified about:
              </Typography>
              
              <FormControl component="fieldset" sx={{ mt: 2 }}>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={notifyOnAuthError}
                        onChange={(e) => setNotifyOnAuthError(e.target.checked)}
                      />
                    }
                    label="Authentication Errors (login failures, expired credentials)"
                  />
                  
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={notifyOnSendError}
                        onChange={(e) => setNotifyOnSendError(e.target.checked)}
                      />
                    }
                    label="Send Errors (failed to send emails)"
                  />
                  
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={notifyOnReceiveError}
                        onChange={(e) => setNotifyOnReceiveError(e.target.checked)}
                      />
                    }
                    label="Receive Errors (failed to check inbox)"
                  />
                  
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={notifyOnSpamDetection}
                        onChange={(e) => setNotifyOnSpamDetection(e.target.checked)}
                      />
                    }
                    label="Spam Detection (warmup emails landing in spam folder)"
                  />
                  
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={notifyOnBounce}
                        onChange={(e) => setNotifyOnBounce(e.target.checked)}
                      />
                    }
                    label="Bounced Emails (emails rejected by recipient server)"
                  />
                </FormGroup>
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
