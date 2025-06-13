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
  Paper,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  Slider,
  InputAdornment,
  MenuItem,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function WarmupTimingSetup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Form state
  const [minInterval, setMinInterval] = useState(60); // in minutes
  const [maxInterval, setMaxInterval] = useState(120); // in minutes
  const [businessHoursOnly, setBusinessHoursOnly] = useState(true);
  const [businessHoursStart, setBusinessHoursStart] = useState(9);
  const [businessHoursEnd, setBusinessHoursEnd] = useState(17);
  const [workDays, setWorkDays] = useState([1, 2, 3, 4, 5]); // Monday to Friday
  const [initialDailyLimit, setInitialDailyLimit] = useState(5);
  const [maxDailyLimit, setMaxDailyLimit] = useState(30);
  const [rampUpDays, setRampUpDays] = useState(14);
  const [rampUpType, setRampUpType] = useState('linear');
  
  useEffect(() => {
    const fetchWarmupTimingSettings = async () => {
      try {
        setLoading(true);
        
        if (!user) return;
        
        // Fetch warmup timing settings from database
        const { data, error } = await supabase
          .from('warmup_timing_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          // PGRST116 is "no rows returned" error, which is fine for new users
          throw error;
        }
        
        if (data) {
          // Populate form with existing data
          setMinInterval(data.min_interval_minutes || 60);
          setMaxInterval(data.max_interval_minutes || 120);
          setBusinessHoursOnly(data.business_hours_only !== false);
          setBusinessHoursStart(data.business_hours_start || 9);
          setBusinessHoursEnd(data.business_hours_end || 17);
          setWorkDays(data.work_days || [1, 2, 3, 4, 5]);
          setInitialDailyLimit(data.initial_daily_limit || 5);
          setMaxDailyLimit(data.max_daily_limit || 30);
          setRampUpDays(data.ramp_up_days || 14);
          setRampUpType(data.ramp_up_type || 'linear');
        }
        
      } catch (error) {
        console.error('Error fetching warmup timing settings:', error);
        setError('Failed to load warmup timing settings. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchWarmupTimingSettings();
  }, [user]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      
      // Validate form
      if (minInterval <= 0 || maxInterval <= 0) {
        throw new Error('Intervals must be positive numbers');
      }
      
      if (minInterval >= maxInterval) {
        throw new Error('Maximum interval must be greater than minimum interval');
      }
      
      if (businessHoursStart >= businessHoursEnd) {
        throw new Error('Business hours end time must be after start time');
      }
      
      if (initialDailyLimit <= 0 || maxDailyLimit <= 0) {
        throw new Error('Daily limits must be positive numbers');
      }
      
      if (initialDailyLimit >= maxDailyLimit) {
        throw new Error('Maximum daily limit must be greater than initial daily limit');
      }
      
      if (rampUpDays <= 0) {
        throw new Error('Ramp-up days must be a positive number');
      }
      
      // Prepare data
      const warmupTimingData = {
        user_id: user.id,
        min_interval_minutes: minInterval,
        max_interval_minutes: maxInterval,
        business_hours_only: businessHoursOnly,
        business_hours_start: businessHoursStart,
        business_hours_end: businessHoursEnd,
        work_days: workDays,
        initial_daily_limit: initialDailyLimit,
        max_daily_limit: maxDailyLimit,
        ramp_up_days: rampUpDays,
        ramp_up_type: rampUpType,
        updated_at: new Date(),
      };
      
      // Check if record exists
      const { data: existingData, error: checkError } = await supabase
        .from('warmup_timing_settings')
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
          .from('warmup_timing_settings')
          .update(warmupTimingData)
          .eq('user_id', user.id);
      } else {
        // Insert new record
        result = await supabase
          .from('warmup_timing_settings')
          .insert([warmupTimingData]);
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
          navigate('/setup/email-account');
        }, 1500);
      }
      
    } catch (error) {
      console.error('Error saving warmup timing settings:', error);
      setError(error.message || 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  // Helper function to format hours
  const formatHour = (hour) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour} ${ampm}`;
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
        Warmup Timing Settings
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
                Configure how your email warmup process should be scheduled and ramped up over time.
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Email Sending Intervals
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Set the minimum and maximum time between sending emails. The system will randomly choose a time within this range.
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Minimum Interval"
                    type="number"
                    value={minInterval}
                    onChange={(e) => setMinInterval(parseInt(e.target.value))}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">minutes</InputAdornment>,
                    }}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Maximum Interval"
                    type="number"
                    value={maxInterval}
                    onChange={(e) => setMaxInterval(parseInt(e.target.value))}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">minutes</InputAdornment>,
                    }}
                    inputProps={{ min: 1 }}
                  />
                </Grid>
              </Grid>
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Business Hours
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={businessHoursOnly}
                    onChange={(e) => setBusinessHoursOnly(e.target.checked)}
                  />
                }
                label="Send emails during business hours only"
              />
              
              {businessHoursOnly && (
                <Grid container spacing={3} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={6}>
                    <Typography id="business-hours-start-label" gutterBottom>
                      Start Time: {formatHour(businessHoursStart)}
                    </Typography>
                    <Slider
                      value={businessHoursStart}
                      onChange={(e, newValue) => setBusinessHoursStart(newValue)}
                      min={0}
                      max={23}
                      step={1}
                      marks
                      aria-labelledby="business-hours-start-label"
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Typography id="business-hours-end-label" gutterBottom>
                      End Time: {formatHour(businessHoursEnd)}
                    </Typography>
                    <Slider
                      value={businessHoursEnd}
                      onChange={(e, newValue) => setBusinessHoursEnd(newValue)}
                      min={0}
                      max={23}
                      step={1}
                      marks
                      aria-labelledby="business-hours-end-label"
                    />
                  </Grid>
                </Grid>
              )}
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Daily Limits & Ramp-Up
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Configure how many emails to send per day and how to increase this limit over time.
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Initial Daily Limit"
                    type="number"
                    value={initialDailyLimit}
                    onChange={(e) => setInitialDailyLimit(parseInt(e.target.value))}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">emails</InputAdornment>,
                    }}
                    inputProps={{ min: 1, max: 50 }}
                    helperText="Number of emails to send per day initially"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Maximum Daily Limit"
                    type="number"
                    value={maxDailyLimit}
                    onChange={(e) => setMaxDailyLimit(parseInt(e.target.value))}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">emails</InputAdornment>,
                    }}
                    inputProps={{ min: 1, max: 50 }}
                    helperText="Maximum number of emails to send per day after ramp-up"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Ramp-Up Period"
                    type="number"
                    value={rampUpDays}
                    onChange={(e) => setRampUpDays(parseInt(e.target.value))}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">days</InputAdornment>,
                    }}
                    inputProps={{ min: 1 }}
                    helperText="Number of days to reach maximum daily limit"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Ramp-Up Type"
                    value={rampUpType}
                    onChange={(e) => setRampUpType(e.target.value)}
                    helperText="How to increase the daily limit over time"
                  >
                    <MenuItem value="linear">Linear (steady increase)</MenuItem>
                    <MenuItem value="exponential">Exponential (slow start, fast finish)</MenuItem>
                    <MenuItem value="logarithmic">Logarithmic (fast start, slow finish)</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
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
