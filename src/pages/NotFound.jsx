import { Box, Button, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { Home as HomeIcon } from '@mui/icons-material';

export default function NotFound() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        textAlign: 'center',
        p: 4,
      }}
    >
      <Typography variant="h1" component="h1" gutterBottom>
        404
      </Typography>
      <Typography variant="h4" component="h2" gutterBottom>
        Page Not Found
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        The page you are looking for doesn't exist or has been moved.
      </Typography>
      <Button
        component={Link}
        to="/"
        variant="contained"
        startIcon={<HomeIcon />}
        sx={{ mt: 2 }}
      >
        Back to Home
      </Button>
    </Box>
  );
}
