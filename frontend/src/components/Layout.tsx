import React from 'react';
import { 
  Box, AppBar, Toolbar, Typography, Button, Container, Fab, useTheme, Avatar, Menu, MenuItem, Divider,
  IconButton, Drawer, List, ListItem, ListItemButton, ListItemText, Stack
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MenuIcon from '@mui/icons-material/Menu';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AnimatedBackground from './AnimatedBackground';
import TransactionForm from './TransactionForm';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user, apiUp, lastNetworkError, refreshHealth } = useAuth();
  const theme = useTheme();
  const darkMode = theme.palette.mode === 'dark';
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = () => {
    handleProfileMenuClose();
    navigate('/profile');
  };

  // Increased width for larger navigation buttons & avatar
  const drawerWidth = 260;

  const navItems = [
    { label: 'Dashboard', path: '/' },
    { label: 'Transactions', path: '/transactions' },
    { label: 'Budgets', path: '/budgets' },
    { label: 'Reports', path: '/reports' },
    { label: 'Groups', path: '/groups' },
    { label: 'Profile', path: '/profile' },
    { label: 'UML Diagram', path: '/uml' },
  ];

  const [mobileOpen, setMobileOpen] = React.useState(false);
  const toggleMobile = () => setMobileOpen(p => !p);
  const [quickOpen, setQuickOpen] = React.useState(false);

  const activeMatch = (path: string) => location.pathname === path;

  const NavButton: React.FC<{label: string; path: string}> = ({ label, path }) => {
    const active = activeMatch(path);
    return (
      <Button
        onClick={() => { handleNavigation(path); setMobileOpen(false); }}
        fullWidth
        sx={{
          justifyContent: 'flex-start',
          fontWeight: 600,
          position: 'relative',
          mb: 0.5,
          textTransform: 'none',
          borderRadius: 2,
          px: 2,
          py: 1.25,
          letterSpacing: 0.3,
          fontSize: 15,
          color: darkMode
            ? (active ? '#fff' : 'rgba(255,255,255,0.85)')
            : (active ? '#fff' : 'rgba(30,41,59,0.9)'),
          background: active
            ? darkMode
              ? 'linear-gradient(120deg,#4f46e5,#7c3aed,#4f46e5)'
              : 'linear-gradient(120deg,#6366f1,#8b5cf6,#6366f1)'
            : (darkMode
              ? 'transparent'
              : 'linear-gradient(145deg,rgba(99,102,241,0.10),rgba(139,92,246,0.10))'),
          backgroundSize: active ? '220% 220%' : '100% 100%',
          animation: active ? 'gradientMove 6s ease infinite' : 'none',
          boxShadow: active
            ? (darkMode
              ? '0 4px 16px -4px rgba(0,0,0,0.4)'
              : '0 6px 18px -6px rgba(99,102,241,0.35)')
            : '0 0 0 0 rgba(0,0,0,0)',
          backdropFilter: active && !darkMode ? 'blur(4px)' : 'none',
          border: active
            ? (darkMode ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(99,102,241,0.4)')
            : (darkMode ? '1px solid transparent' : '1px solid rgba(99,102,241,0.15)'),
          transition: 'all .35s',
          overflow: 'hidden',
          willChange: 'transform, background-position, box-shadow',
          '@keyframes gradientMove': {
            '0%': { backgroundPosition: '0% 50%' },
            '50%': { backgroundPosition: '100% 50%' },
            '100%': { backgroundPosition: '0% 50%' }
          },
          '&:before': {
            content: '""',
            position: 'absolute',
            left: 6,
            top: 8,
            bottom: 8,
            width: active ? 6 : 0,
            borderRadius: 3,
            background: 'linear-gradient(180deg,#6366f1,#8b5cf6)',
            boxShadow: active ? '0 0 0 1px rgba(255,255,255,0.3),0 4px 10px -2px rgba(99,102,241,0.5)' : 'none',
            transition: 'width .45s cubic-bezier(.68,-0.4,.32,1.4), box-shadow .4s',
          },
          '&:after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            opacity: 0,
            background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.35), transparent 60%)',
            transform: 'scale(.6)',
            transition: 'opacity .6s, transform .6s',
            pointerEvents: 'none'
          },
          '&:hover': {
            background: active
              ? (darkMode
                ? 'linear-gradient(120deg,#4338ca,#7c3aed,#4338ca)'
                : 'linear-gradient(120deg,#4f46e5,#7c3aed,#4f46e5)')
              : (darkMode ? 'rgba(255,255,255,0.08)' : 'linear-gradient(145deg,rgba(99,102,241,0.18),rgba(139,92,246,0.18))'),
            transform: 'translateX(4px)',
            boxShadow: active
              ? (darkMode ? '0 6px 18px -4px rgba(0,0,0,0.55)' : '0 10px 28px -8px rgba(99,102,241,0.55)')
              : '0 6px 18px -6px rgba(99,102,241,0.35)',
            '&:after': { opacity: 1, transform: 'scale(1)' },
            '&:before': { width: 6 }
          },
          '&:active': {
            transform: 'translateX(2px) scale(.98)'
          }
        }}
      >{label}</Button>
    );
  };

  const drawerContent = (
    <Box sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: darkMode
        ? 'linear-gradient(180deg,#0f172a 0%, #1e1b4b 50%, #312e81 100%)'
        : 'linear-gradient(180deg,rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.85) 60%, rgba(241,245,249,0.9) 100%)',
      color: darkMode ? 'white' : '#1e293b',
      p: 2.2,
      borderRight: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
      boxShadow: darkMode
        ? 'inset 0 0 0 1px rgba(255,255,255,0.05)'
        : '0 4px 12px -2px rgba(15,23,42,0.08), 0 8px 24px -4px rgba(15,23,42,0.06)',
      backdropFilter: darkMode ? 'none' : 'blur(12px)',
      position: 'relative',
      '&:before': !darkMode ? {
        content: '""',
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at 80% 10%, rgba(99,102,241,0.15) 0%, transparent 55%), radial-gradient(circle at 20% 90%, rgba(139,92,246,0.18) 0%, transparent 60%)',
        pointerEvents: 'none'
      } : {}
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Avatar
          src={user?.profilePicture || undefined}
          onClick={handleProfileMenuOpen}
          sx={{
            width: 64, height: 64, mr: 2, cursor: 'pointer',
            border: darkMode ? '2px solid rgba(255,255,255,0.3)' : '2px solid rgba(99,102,241,0.3)',
            background: user?.profilePicture ? 'transparent' : (darkMode
              ? 'linear-gradient(135deg,#ff6b6b,#4ecdc4)'
              : 'linear-gradient(135deg,#6366f1,#8b5cf6)'),
            color: '#fff',
            fontWeight: 700,
            letterSpacing: .5,
            transition: 'all 0.35s',
            boxShadow: darkMode ? '0 4px 16px -4px rgba(0,0,0,0.6)' : '0 4px 14px -4px rgba(99,102,241,0.35)',
            '&:hover': { transform: 'scale(1.08) rotate(-2deg)' }
          }}
        >{!user?.profilePicture && (user?.name?.charAt(0).toUpperCase() || 'U')}</Avatar>
        <Box>
          <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.1 }}>{user?.name || 'User'}</Typography>
          <Typography variant="caption" sx={{ opacity: 0.7 }}>{user?.email || 'No email'}</Typography>
        </Box>
      </Box>
      <Stack spacing={0.5} sx={{ flex: 1, overflowY: 'auto', pr: 0.5 }}>
        {navItems.map(n => <NavButton key={n.path} label={n.label} path={n.path} />)}
      </Stack>
      <Button
        onClick={() => { handleLogout(); setMobileOpen(false); }}
        fullWidth
        sx={{
          mt: 1,
          textTransform: 'none',
          fontWeight: 600,
          letterSpacing: 0.5,
          borderRadius: 2,
          background: darkMode
            ? 'linear-gradient(90deg,#ef4444,#dc2626)'
            : 'linear-gradient(90deg,#f43f5e,#dc2626)',
          color: '#fff',
          py: 1.15,
          boxShadow: darkMode ? '0 4px 16px -4px rgba(0,0,0,0.5)' : '0 4px 14px -4px rgba(244,63,94,0.45)',
          '&:hover': { background: darkMode ? 'linear-gradient(90deg,#dc2626,#b91c1c)' : 'linear-gradient(90deg,#e11d48,#be123c)' }
        }}
      >Logout</Button>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile Top AppBar */}
      <AppBar
        position="fixed"
        sx={{
          display: { xs: 'flex', md: 'none' },
          background: darkMode
            ? 'linear-gradient(90deg,#0f172a 0%, #312e81 100%)'
            : 'linear-gradient(90deg,#ffffff 0%, #f1f5f9 100%)',
          boxShadow: '0 4px 16px -2px rgba(0,0,0,0.4)'
        }}
      >
        <Toolbar sx={{ minHeight: 64, px: 2 }}>
          <IconButton edge="start" color="inherit" onClick={toggleMobile} sx={{ mr: 1 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1, color: darkMode ? '#fff' : '#1e293b' }}>Budget Tracker</Typography>
        </Toolbar>
      </AppBar>

      {/* Permanent drawer for desktop */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
            onClose={toggleMobile}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': { width: drawerWidth, border: 'none' }
            }}
        >
          {drawerContent}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', md: 'block' },
              '& .MuiDrawer-paper': {
                width: drawerWidth,
                position: 'relative',
                border: 'none',
                background: 'transparent'
              }
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

  {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        PaperProps={{
          elevation: 8,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            borderRadius: 3,
            background: darkMode
              ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(51, 65, 85, 0.95) 100%)'
              : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
            backdropFilter: 'blur(20px)',
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              left: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {user?.name || 'User'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.email || 'No email'}
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={handleProfileClick} sx={{ py: 1.5, borderRadius: 1, m: 1 }}>
          👤 View Profile
        </MenuItem>
        <MenuItem 
          onClick={() => {
            handleProfileMenuClose();
            handleLogout();
          }} 
          sx={{ 
            py: 1.5, 
            borderRadius: 1, 
            m: 1,
            color: 'error.main',
            '&:hover': {
              backgroundColor: 'error.main',
              color: 'error.contrastText',
            }
          }}
        >
          🚪 Logout
        </MenuItem>
      </Menu>

      <Box component="main" sx={{
        flexGrow: 1,
        width: { md: `calc(100% - ${drawerWidth}px)` },
        mt: { xs: 8, md: 0 },
        background: darkMode
          ? 'linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#334155 100%)'
          : 'linear-gradient(135deg,#f1f5f9 0%, #e2e8f0 100%)',
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Connectivity banner */}
        {!apiUp && (
          <Box sx={{
            position: 'fixed',
            top: { xs: 70, md: 16 },
            right: { xs: 12, md: 24 },
            zIndex: 1400,
            background: 'linear-gradient(90deg,#dc2626,#b91c1c)',
            color: '#fff',
            px: 2.5,
            py: 1.2,
            borderRadius: 3,
            boxShadow: '0 6px 20px -4px rgba(220,38,38,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            fontWeight: 600,
            letterSpacing: 0.3
          }}>
            <span>⚠️ API Offline</span>
            <Button
              size="small"
              variant="contained"
              onClick={refreshHealth}
              sx={{
                textTransform: 'none',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: 2,
                fontWeight: 600,
                '&:hover': { background: 'rgba(255,255,255,0.3)' }
              }}
            >Retry</Button>
          </Box>
        )}
        {apiUp && lastNetworkError === null && (
          <Box sx={{
            position: 'fixed',
            top: { xs: 70, md: 16 },
            right: { xs: 12, md: 24 },
            zIndex: 1200,
            background: darkMode ? 'linear-gradient(90deg,#16a34a,#15803d)' : 'linear-gradient(90deg,#22c55e,#16a34a)',
            color: '#fff',
            px: 2,
            py: 0.8,
            borderRadius: 30,
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            boxShadow: '0 4px 14px -4px rgba(16,185,129,0.6)'
          }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: '#fff', boxShadow: '0 0 0 4px rgba(255,255,255,0.3)', mr: 0.5 }} />
            Online
          </Box>
        )}
        {/* Global animated icon background */}
        <AnimatedBackground />
        <Container maxWidth="xl" sx={{ py: 4, position: 'relative', zIndex: 1 }}>
          {children}
        </Container>
      </Box>

      {/* Floating Add button for quick transactions */}
      <Fab
        color="secondary"
        aria-label="add"
        sx={{ position: 'fixed', right: 20, bottom: 24, zIndex: 1300, transition: 'transform 200ms ease, box-shadow 200ms ease', '&:hover': { transform: 'translateY(-6px) scale(1.06)', boxShadow: theme => `0 12px 30px ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.18)' : 'rgba(0,0,0,0.4)'}` } }}
        onClick={() => setQuickOpen(true)}
      >
        <AddIcon />
      </Fab>
      {/* Quick Add dialog (reuses TransactionForm) */}
      <TransactionForm
        open={quickOpen}
        onClose={() => setQuickOpen(false)}
        onSuccess={() => {
          setQuickOpen(false);
          // If currently on transactions page, a local fetch will run; otherwise, optionally navigate
          if (location.pathname !== '/transactions') {
            navigate('/transactions');
          }
        }}
      />
    </Box>
  );
};

export default Layout;
