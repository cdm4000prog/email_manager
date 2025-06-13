import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Tooltip,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Save as SaveIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function EmailAccountSetup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [emailAccounts, setEmailAccounts] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('add'); // 'add' or 'edit'
  const [currentAccountId, setCurrentAccountId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);
  
  // Form state
  const [email, setEmail] = useState('');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState(587);
  const [smtpUsername, setSmtpUsername] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [imapHost, setImapHost] = useState('');
  const [imapPort, setImapPort] = useState(993);
  const [imapUsername, setImapUsername] = useState('');
  const [imapPassword, setImapPassword] = useState('');
  const [useSSL, setUseSSL] = useState(true);
  const [active, setActive] = useState(true);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [showImapPassword, setShowImapPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  
  useEffect(() => {
    fetchEmailAccounts();
  }, [user]);
  
  const fetchEmailAccounts = async () => {
    try {
      setLoading(true);
      
      if (!user) return;
      
      // Fetch email accounts from database
      const { data, error } = await supabase
        .from('email_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setEmailAccounts(data || []);
      
    } catch (error) {
      console.error('Error fetching email accounts:', error);
      setError('Failed to load email accounts. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleOpenAddDialog = () => {
    // Reset form
    setEmail('');
    setSmtpHost('');
    setSmtpPort(587);
    setSmtpUsername('');
    setSmtpPassword('');
    setImapHost('');
    setImapPort(993);
    setImapUsername('');
    setImapPassword('');
    setUseSSL(true);
    setActive(true);
    setFormErrors({});
    
    // Open dialog in add mode
    setDialogMode('add');
    setCurrentAccountId(null);
    setOpenDialog(true);
  };
  
  const handleOpenEditDialog = (account) => {
    // Populate form with account data
    setEmail(account.email);
    setSmtpHost(account.smtp_host);
    setSmtpPort(account.smtp_port);
    setSmtpUsername(account.smtp_username);
    setSmtpPassword(account.smtp_password);
    setImapHost(account.imap_host);
    setImapPort(account.imap_port);
    setImapUsername(account.imap_username);
    setImapPassword(account.imap_password);
    setUseSSL(account.use_ssl);
    setActive(account.active);
    setFormErrors({});
    
    // Open dialog in edit mode
    setDialogMode('edit');
    setCurrentAccountId(account.id);
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  const validateForm = () => {
    const errors = {};
    
    if (!email) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Invalid email format';
    
    if (!smtpHost) errors.smtpHost = 'SMTP host is required';
    if (!smtpPort) errors.smtpPort = 'SMTP port is required';
    if (!smtpUsername) errors.smtpUsername = 'SMTP username is required';
    if (!smtpPassword) errors.smtpPassword = 'SMTP password is required';
    
    if (!imapHost) errors.imapHost = 'IMAP host is required';
    if (!imapPort) errors.imapPort = 'IMAP port is required';
    if (!imapUsername) errors.imapUsername = 'IMAP username is required';
    if (!imapPassword) errors.imapPassword = 'IMAP password is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async () => {
    if (!user) return;
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    try {
      setError(null);
      
      // Prepare data
      const accountData = {
        user_id: user.id,
        email,
        smtp_host: smtpHost,
        smtp_port: smtpPort,
        smtp_username: smtpUsername,
        smtp_password: smtpPassword,
        imap_host: imapHost,
        imap_port: imapPort,
        imap_username: imapUsername,
        imap_password: imapPassword,
        use_ssl: useSSL,
        active,
        updated_at: new Date(),
      };
      
      let result;
      
      if (dialogMode === 'add') {
        // Insert new record
        result = await supabase
          .from('email_accounts')
          .insert([accountData]);
      } else {
        // Update existing record
        result = await supabase
          .from('email_accounts')
          .update(accountData)
          .eq('id', currentAccountId);
      }
      
      if (result.error) {
        throw result.error;
      }
      
      // Refresh email accounts list
      await fetchEmailAccounts();
      
      // Close dialog
      handleCloseDialog();
      
      // Show success message
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (error) {
      console.error('Error saving email account:', error);
      setError(error.message || 'Failed to save email account. Please try again.');
    }
  };
  
  const handleOpenDeleteConfirm = (account) => {
    setAccountToDelete(account);
    setDeleteConfirmOpen(true);
  };
  
  const handleCloseDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setAccountToDelete(null);
  };
  
  const handleDeleteAccount = async () => {
    if (!accountToDelete) return;
    
    try {
      setError(null);
      
      // Delete account
      const { error } = await supabase
        .from('email_accounts')
        .delete()
        .eq('id', accountToDelete.id);
      
      if (error) {
        throw error;
      }
      
      // Refresh email accounts list
      await fetchEmailAccounts();
      
      // Close confirm dialog
      handleCloseDeleteConfirm();
      
      // Show success message
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (error) {
      console.error('Error deleting email account:', error);
      setError(error.message || 'Failed to delete email account. Please try again.');
      handleCloseDeleteConfirm();
    }
  };
  
  const handleToggleActive = async (account) => {
    try {
      setError(null);
      
      // Update active status
      const { error } = await supabase
        .from('email_accounts')
        .update({ active: !account.active, updated_at: new Date() })
        .eq('id', account.id);
      
      if (error) {
        throw error;
      }
      
      // Refresh email accounts list
      await fetchEmailAccounts();
      
    } catch (error) {
      console.error('Error updating email account status:', error);
      setError(error.message || 'Failed to update email account status. Please try again.');
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
        Email Accounts
      </Typography>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Email account saved successfully!
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            Manage Email Accounts
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenAddDialog}
          >
            Add Email Account
          </Button>
        </Box>
        
        {emailAccounts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <EmailIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Email Accounts
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              You haven't added any email accounts yet. Add an email account to start the warmup process.
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleOpenAddDialog}
            >
              Add Your First Email Account
            </Button>
          </Box>
        ) : (
          <List>
            {emailAccounts.map((account) => (
              <ListItem
                key={account.id}
                divider
                sx={{
                  bgcolor: account.active ? 'inherit' : 'action.hover',
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <EmailIcon sx={{ mr: 1, color: account.active ? 'primary.main' : 'text.disabled' }} />
                      <Typography variant="subtitle1">
                        {account.email}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" component="span">
                        SMTP: {account.smtp_host}:{account.smtp_port} | IMAP: {account.imap_host}:{account.imap_port}
                      </Typography>
                      <Typography
                        variant="body2"
                        component="span"
                        sx={{
                          ml: 1,
                          color: account.active ? 'success.main' : 'text.disabled',
                        }}
                      >
                        • {account.active ? 'Active' : 'Inactive'}
                      </Typography>
                    </>
                  }
                />
                <ListItemSecondaryAction>
                  <Tooltip title={account.active ? 'Deactivate' : 'Activate'}>
                    <Switch
                      edge="end"
                      checked={account.active}
                      onChange={() => handleToggleActive(account)}
                    />
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton
                      edge="end"
                      onClick={() => handleOpenEditDialog(account)}
                      sx={{ ml: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      edge="end"
                      onClick={() => handleOpenDeleteConfirm(account)}
                      sx={{ ml: 1 }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
      
      {/* Add/Edit Email Account Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'add' ? 'Add Email Account' : 'Edit Email Account'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText paragraph>
            Enter the email account details for the warmup process. Make sure to use the correct SMTP and IMAP settings for your email provider.
          </DialogContentText>
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={!!formErrors.email}
                helperText={formErrors.email}
                disabled={dialogMode === 'edit'} // Can't change email in edit mode
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  SMTP Settings (Outgoing Mail)
                </Typography>
              </Divider>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="SMTP Host"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                error={!!formErrors.smtpHost}
                helperText={formErrors.smtpHost}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="SMTP Port"
                type="number"
                value={smtpPort}
                onChange={(e) => setSmtpPort(parseInt(e.target.value))}
                error={!!formErrors.smtpPort}
                helperText={formErrors.smtpPort}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="SMTP Username"
                value={smtpUsername}
                onChange={(e) => setSmtpUsername(e.target.value)}
                error={!!formErrors.smtpUsername}
                helperText={formErrors.smtpUsername}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="SMTP Password"
                type={showSmtpPassword ? 'text' : 'password'}
                value={smtpPassword}
                onChange={(e) => setSmtpPassword(e.target.value)}
                error={!!formErrors.smtpPassword}
                helperText={formErrors.smtpPassword}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                        edge="end"
                      >
                        {showSmtpPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  IMAP Settings (Incoming Mail)
                </Typography>
              </Divider>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="IMAP Host"
                value={imapHost}
                onChange={(e) => setImapHost(e.target.value)}
                error={!!formErrors.imapHost}
                helperText={formErrors.imapHost}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="IMAP Port"
                type="number"
                value={imapPort}
                onChange={(e) => setImapPort(parseInt(e.target.value))}
                error={!!formErrors.imapPort}
                helperText={formErrors.imapPort}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="IMAP Username"
                value={imapUsername}
                onChange={(e) => setImapUsername(e.target.value)}
                error={!!formErrors.imapUsername}
                helperText={formErrors.imapUsername}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="IMAP Password"
                type={showImapPassword ? 'text' : 'password'}
                value={imapPassword}
                onChange={(e) => setImapPassword(e.target.value)}
                error={!!formErrors.imapPassword}
                helperText={formErrors.imapPassword}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowImapPassword(!showImapPassword)}
                        edge="end"
                      >
                        {showImapPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Additional Settings
                </Typography>
              </Divider>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={useSSL}
                    onChange={(e) => setUseSSL(e.target.checked)}
                  />
                }
                label="Use SSL/TLS"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            startIcon={<SaveIcon />}
          >
            {dialogMode === 'add' ? 'Add Account' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleCloseDeleteConfirm}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the email account <strong>{accountToDelete?.email}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteConfirm}>Cancel</Button>
          <Button onClick={handleDeleteAccount} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
