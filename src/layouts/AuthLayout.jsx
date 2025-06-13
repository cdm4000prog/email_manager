import { Outlet, Navigate } from 'react-router-dom';
import { Box, Paper, Container, Typography, useTheme } from '@mui/material';
import { Email as EmailIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

export default function AuthLayout() {
  const { user, loading } = useAuth();
  const theme = useTheme();

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: theme.palette.grey[100],
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mb: 4,
          }}
        >
          <EmailIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom>
            Emailer Warmup
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center">
            Warm up your email accounts for better deliverability
          </Typography>
        </Box>
        <Paper
          elevation={3}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Outlet />
        </Paper>
      </Container>
    </Box>
  );
}
