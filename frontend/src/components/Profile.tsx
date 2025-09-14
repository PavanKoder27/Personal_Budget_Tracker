import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Grid,
  Avatar,
  IconButton,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  useTheme,
} from '@mui/material';
import PageHeading from './shared/PageHeading';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Profile: React.FC = () => {
  const { user, logout, updateUser } = useAuth();
  const theme = useTheme();
  const darkMode = theme.palette.mode === 'dark';
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Profile Info State
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profilePicture, setProfilePicture] = useState<string>('');
  
  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    if (user?.profilePicture) {
      setProfilePicture(user.profilePicture);
    }
  }, [user]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setMessage('');
    setError('');
  };

  const handleProfilePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const MAX_SIZE_MB = 10; // binary size limit
    const sizeMB = (file.size / (1024*1024)).toFixed(2);
    console.log('[PROFILE] selected file', { name: file.name, type: file.type, sizeBytes: file.size, sizeMB });

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File size ${sizeMB}MB exceeds ${MAX_SIZE_MB}MB limit`);
      return;
    }

    // Allow legacy variants mirrored on backend
    const allowedClient = ['image/png','image/x-png','image/jpeg','image/jpg','image/pjpeg','image/gif','image/webp','image/bmp','image/svg+xml'];
    const typeLower = file.type.toLowerCase();
    if (!allowedClient.includes(typeLower)) {
      setError(`Unsupported file type (${file.type}). Use PNG, JPEG, GIF, WebP, BMP, or SVG.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target?.result as string;
      if (!base64String.startsWith('data:')) {
        setError('Invalid data URL generated.');
        return;
      }
      const commaIndex = base64String.indexOf(',');
      const approxBytes = Math.ceil((base64String.length - (commaIndex + 1)) * 0.75);
      if (approxBytes > MAX_SIZE_MB * 1024 * 1024) {
        setError('Encoded image exceeds 10MB limit – try compressing.');
        return;
      }
      console.log('[PROFILE] base64 ready', { approxKB: Math.round(approxBytes/1024) });
      setProfilePicture(base64String);
      setError('');
    };
    reader.onerror = () => setError('Failed to read the image file. Please try again.');
    reader.readAsDataURL(file);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const updateData: any = { name, email };
      if (profilePicture) {
        updateData.profilePicture = profilePicture;
      }
      
      const response = await api.put('/auth/me', updateData);
      
      // Update the user context with the new data
      updateUser({
        name: updateData.name,
        email: updateData.email,
        profilePicture: updateData.profilePicture
      });
      
      setMessage('Profile updated successfully! ✨');
      
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      console.error('Profile update error:', error);
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }
    
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      setLoading(false);
      return;
    }
    
    try {
      await api.put('/auth/change-password', {
        currentPassword,
        newPassword
      });
      
      setMessage('Password changed successfully! Please login again.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      setTimeout(() => {
        logout();
      }, 2000);
    } catch (error: any) {
      console.error('Password change error:', error);
      setError(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: darkMode 
          ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: darkMode
            ? 'radial-gradient(circle at 20% 80%, rgba(168, 85, 247, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)'
            : 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 105, 180, 0.3) 0%, transparent 50%)',
          zIndex: 0,
        }
      }}
    >
      <Container maxWidth="md" sx={{ pt: 4, pb: 4, position: 'relative', zIndex: 1 }}>
        <Card 
          elevation={8}
          sx={{ 
            borderRadius: 4,
            background: darkMode
              ? 'rgba(255, 255, 255, 0.05)'
              : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)',
            backdropFilter: 'blur(20px)',
            border: darkMode
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : 'none',
          }}
        >
        <CardContent sx={{ p: 0 }}>
          {/* Header */}
          <Box sx={{ 
            background: darkMode
              ? 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)'
              : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            color: 'white',
            p: 4,
            textAlign: 'center',
            borderRadius: '16px 16px 0 0'
          }}>
            <Avatar
              src={profilePicture || undefined}
              sx={{ 
                width: 120, 
                height: 120, 
                margin: '0 auto 16px',
                fontSize: '3rem',
                border: '4px solid rgba(255,255,255,0.3)',
                background: profilePicture ? 'transparent' : 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
              }}
            >
              {!profilePicture && (user?.name?.charAt(0).toUpperCase() || 'U')}
            </Avatar>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: 'white' }}>
              {user?.name || 'User'}
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, color: 'rgba(255,255,255,0.9)' }}>
              {user?.email || 'No email'}
            </Typography>
          </Box>

          {/* Tabs */}
          <Box sx={{ 
            borderBottom: 1, 
            borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'divider',
            background: darkMode ? 'rgba(255, 255, 255, 0.02)' : '#ffffff',
          }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              aria-label="profile tabs"
              centered
              sx={{
                position: 'relative',
                px: 2,
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  letterSpacing: '.25px',
                  fontSize: '0.95rem',
                  minHeight: 60,
                  lineHeight: 1.2,
                  padding: '14px 32px',
                  margin: '6px 8px',
                  borderRadius: '26px',
                  color: darkMode ? 'rgba(255,255,255,0.70)' : '#334155',
                  background: darkMode ? 'rgba(255,255,255,0.05)' : '#ffffff',
                  boxShadow: darkMode ? '0 2px 4px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08) inset' : '0 2px 4px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04) inset',
                  backdropFilter: 'blur(4px)',
                  transition: 'all .35s cubic-bezier(.4,0,.2,1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    background: darkMode ? 'rgba(255,255,255,0.10)' : '#f1f5f9',
                    boxShadow: darkMode ? '0 4px 10px rgba(0,0,0,0.5), 0 0 0 1px rgba(168,85,247,0.25) inset' : '0 4px 12px rgba(0,0,0,0.12), 0 0 0 1px rgba(99,102,241,0.25) inset',
                    transform: 'translateY(-2px)'
                  },
                  '&.Mui-selected': {
                    color: darkMode ? '#ffffff' : '#1e3a8a',
                    background: darkMode
                      ? 'linear-gradient(135deg, rgba(168,85,247,0.35) 0%, rgba(59,130,246,0.35) 100%)'
                      : 'linear-gradient(135deg,#ffffff 0%,#ffffff 100%)',
                    boxShadow: darkMode
                      ? '0 6px 18px -4px rgba(0,0,0,0.7), 0 0 0 1px rgba(168,85,247,0.5) inset'
                      : '0 6px 16px -4px rgba(0,0,0,0.12), 0 0 0 1px rgba(79,70,229,0.4) inset',
                    transform: 'translateY(-3px)'
                  },
                  '&:active': {
                    transform: 'scale(.96)'
                  }
                },
                '& .MuiTabs-flexContainer': {
                  justifyContent: 'center'
                },
                '& .MuiTabs-indicator': {
                  display: 'none'
                }
              }}
            >
              <Tab 
                label="� Profile Info" 
              />
              <Tab 
                label="🔒 Change Password" 
              />
            </Tabs>
          </Box>

          {/* Messages */}
          {message && (
            <Box sx={{ p: 2 }}>
              <Alert severity="success" sx={{ borderRadius: 2 }}>
                {message}
              </Alert>
            </Box>
          )}

          {error && (
            <Box sx={{ p: 2 }}>
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {error}
              </Alert>
            </Box>
          )}

          {/* Tab Panels */}
          <TabPanel value={tabValue} index={0}>
            <Box component="form" onSubmit={handleProfileUpdate}>
              <Grid container spacing={3}>
                {/* Profile Picture Section */}
                <Grid item xs={12} sx={{ textAlign: 'center', mb: 2 }}>
                  <Box sx={{ position: 'relative', display: 'inline-block' }}>
                    <Avatar
                      src={profilePicture || undefined}
                      sx={{ 
                        width: 150, 
                        height: 150, 
                        margin: '0 auto',
                        fontSize: '4rem',
                        border: '4px solid',
                        borderColor: 'primary.main',
                        background: profilePicture ? 'transparent' : 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
                      }}
                    >
                      {!profilePicture && (user?.name?.charAt(0).toUpperCase() || 'U')}
                    </Avatar>
                    <IconButton
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        background: 'primary.main',
                        color: 'white',
                        '&:hover': {
                          background: 'primary.dark',
                        },
                      }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      📷
                    </IconButton>
                    <input
                      ref={fileInputRef}
                      type="file"
                      hidden
                      accept="image/png,image/x-png,image/jpeg,image/jpg,image/pjpeg,image/gif,image/webp,image/bmp,image/svg+xml"
                      onChange={handleProfilePictureChange}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    PNG / JPG / GIF / WebP / BMP / SVG up to 10MB. Click the camera icon to change.
                  </Typography>
                </Grid>

                {/* Name Field */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="👤 Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                      }
                    }}
                  />
                </Grid>

                {/* Email Field */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="📧 Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                      }
                    }}
                  />
                </Grid>

                {/* Action Buttons */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setName(user?.name || '');
                        setEmail(user?.email || '');
                        setProfilePicture(user?.profilePicture || '');
                        setError('');
                        setMessage('');
                      }}
                      sx={{ borderRadius: 3 }}
                    >
                      ❌ Reset
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading}
                      sx={{ 
                        borderRadius: 3,
                        background: 'linear-gradient(45deg, #4f46e5, #7c3aed)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #3730a3, #6b21a8)',
                        }
                      }}
                    >
                      {loading ? '🔄 Updating...' : '✅ Update Profile'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box component="form" onSubmit={handlePasswordChange}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 2, color: 'text.primary' }}>
                    🔒 Change Your Password
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Ensure your password is strong and unique to keep your account secure.
                  </Typography>
                </Grid>

                {/* Current Password */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="🔑 Current Password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                      }
                    }}
                  />
                </Grid>

                {/* New Password */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="🆕 New Password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    helperText="Password must be at least 6 characters long"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                      }
                    }}
                  />
                </Grid>

                {/* Confirm New Password */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="✅ Confirm New Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    error={confirmPassword !== '' && newPassword !== confirmPassword}
                    helperText={
                      confirmPassword !== '' && newPassword !== confirmPassword 
                        ? "Passwords don't match" 
                        : "Re-enter your new password"
                    }
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                      }
                    }}
                  />
                </Grid>

                {/* Action Buttons */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                      sx={{ borderRadius: 3 }}
                    >
                      🗑️ Clear
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                      sx={{ 
                        borderRadius: 3,
                        background: 'linear-gradient(45deg, #ef4444, #f97316)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #dc2626, #ea580c)',
                        }
                      }}
                    >
                      {loading ? '🔄 Changing...' : '🔒 Change Password'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </TabPanel>
        </CardContent>
      </Card>
      </Container>
    </Box>
  );
};

export default Profile;
