import { Box, Container, AppBar, Toolbar, Typography } from '@mui/material';
import { Dashboard as DashboardIcon } from '@mui/icons-material';

export function AppLayout({ children }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }} className="fade-in">
      <Container
        maxWidth="lg"
        sx={{
          mt: 3,
          mb: 4,
          flex: 1,
          px: { xs: 2, md: 3 }
        }}
      >
        {children}
      </Container>
    </Box>
  );
}