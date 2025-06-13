import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Email as EmailIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  ArrowUpward as ArrowUpwardIcon,
  Pause as PauseIcon,
  PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [emailAccounts, setEmailAccounts] = useState([]);
  const [warmupStats, setWarmupStats] = useState({
    totalEmails: 0,
    activeAccounts: 0,
    deliveryRate: 0,
    emailsSentToday: 0,
    emailsReceivedToday: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch email accounts
        const { data: accountsData, error: accountsError } = await supabase
          .from('email_accounts')
          .select('*')
          .eq('user_id', user.id);

        if (accountsError) throw accountsError;
        
        setEmailAccounts(accountsData || []);
        
        // In a real app, you would fetch actual stats from your database
        // For this demo, we'll simulate some data
        
        // Simulate warmup stats
        const activeAccounts = accountsData ? accountsData.filter(acc => acc.active).length : 0;
        
        setWarmupStats({
          totalEmails: Math.floor(Math.random() * 1000) + 100,
          activeAccounts,
          deliveryRate: Math.floor(Math.random() * 20) + 80, // 80-100%
          emailsSentToday: Math.floor(Math.random() * 50) + 10,
          emailsReceivedToday: Math.floor(Math.random() * 40) + 5,
        });
        
        // Simulate recent activity
        const activities = [
          {
            id: 1,
            type: 'sent',
            email: accountsData && accountsData.length > 0 ? accountsData[0].email : 'example@domain.com',
            timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
            status: 'success',
          },
          {
            id: 2,
            type: 'received',
            email: accountsData && accountsData.length > 0 ? accountsData[0].email : 'example@domain.com',
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
            status: 'success',
          },
          {
            id: 3,
            type: 'sent',
            email: accountsData && accountsData.length > 1 ? accountsData[1].email : 'another@domain.com',
            timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 minutes ago
            status: 'success',
          },
          {
            id: 4,
            type: 'error',
            email: accountsData && accountsData.length > 0 ? accountsData[0].email : 'example@domain.com',
            timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
            status: 'error',
            message: 'Authentication failed',
          },
          {
            id: 5,
            type: 'received',
            email: accountsData && accountsData.length > 1 ? accountsData[1].email : 'another@domain.com',
            timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(), // 1.5 hours ago
            status: 'success',
          },
        ];
        
        setRecentActivity(activities);
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const handleRefresh = () => {
    // In a real app, this would refresh the data
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const handleToggleAccountStatus = (accountId, currentStatus) => {
    // In a real app, this would update the account status in the database
    setEmailAccounts(accounts => 
      accounts.map(account => 
        account.id === accountId 
          ? { ...account, active: !currentStatus } 
          : account
      )
    );
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          Dashboard
        </Typography>
        <Button 
          startIcon={<RefreshIcon />} 
          onClick={handleRefresh}
          variant="outlined"
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {emailAccounts.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <EmailIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No Email Accounts Set Up
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            You need to add at least one email account to start the warmup process.
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            component={Link}
            to="/setup/email-account"
            startIcon={<EmailIcon />}
          >
            Add Email Account
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {/* Stats Overview */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Warmup Overview
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={6} sm={4} md={2}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {warmupStats.totalEmails}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Emails
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {warmupStats.activeAccounts}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Accounts
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={4} md={2}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success.main">
                      {warmupStats.deliveryRate}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Delivery Rate
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={4} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="info.main">
                      {warmupStats.emailsSentToday}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Sent Today
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={4} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="info.main">
                      {warmupStats.emailsReceivedToday}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Received Today
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Email Accounts */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Email Accounts
                </Typography>
                <Button 
                  size="small" 
                  component={Link} 
                  to="/setup/email-account"
                  endIcon={<SettingsIcon />}
                >
                  Manage
                </Button>
              </Box>
              <List>
                {emailAccounts.map((account) => (
                  <ListItem
                    key={account.id}
                    divider
                    secondaryAction={
                      <Tooltip title={account.active ? "Pause" : "Resume"}>
                        <IconButton 
                          edge="end" 
                          onClick={() => handleToggleAccountStatus(account.id, account.active)}
                          color={account.active ? "default" : "primary"}
                        >
                          {account.active ? <PauseIcon /> : <PlayArrowIcon />}
                        </IconButton>
                      </Tooltip>
                    }
                  >
                    <ListItemIcon>
                      <EmailIcon color={account.active ? "primary" : "disabled"} />
                    </ListItemIcon>
                    <ListItemText
                      primary={account.email}
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          <Chip 
                            label={account.active ? "Active" : "Paused"} 
                            size="small" 
                            color={account.active ? "success" : "default"}
                            sx={{ mr: 1 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {account.smtp_host}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Recent Activity */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <List>
                {recentActivity.map((activity) => (
                  <ListItem key={activity.id} divider>
                    <ListItemIcon>
                      {activity.type === 'sent' && <ArrowUpwardIcon color="primary" />}
                      {activity.type === 'received' && <CheckCircleIcon color="success" />}
                      {activity.type === 'error' && <ErrorIcon color="error" />}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body1" component="span">
                            {activity.type === 'sent' && 'Email sent'}
                            {activity.type === 'received' && 'Email received'}
                            {activity.type === 'error' && 'Error occurred'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            {formatTimestamp(activity.timestamp)}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" component="span">
                            {activity.email}
                          </Typography>
                          {activity.message && (
                            <Typography variant="caption" color="error" display="block">
                              {activity.message}
                            </Typography>
                          )}
                        </>
                      }
                    />
                    <Chip 
                      label={activity.status === 'success' ? 'Success' : 'Failed'} 
                      size="small" 
                      color={activity.status === 'success' ? 'success' : 'error'}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Warmup Progress */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Warmup Progress
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Your email warmup is in progress. The system will gradually increase the volume of emails to improve deliverability.
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <ScheduleIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6">
                          Warmup Schedule
                        </Typography>
                      </Box>
                      <Typography variant="body2" paragraph>
                        Current daily limit: <strong>{warmupStats.emailsSentToday} emails</strong>
                      </Typography>
                      <Typography variant="body2">
                        Next scheduled increase: <strong>Tomorrow</strong>
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        component={Link} 
                        to="/setup/warmup-timing"
                      >
                        Adjust Settings
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <EmailIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6">
                          Delivery Status
                        </Typography>
                      </Box>
                      <Typography variant="body2" paragraph>
                        Inbox placement rate: <strong>{warmupStats.deliveryRate}%</strong>
                      </Typography>
                      <Typography variant="body2">
                        Emails in spam: <strong>0</strong>
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button size="small">
                        View Detailed Stats
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
