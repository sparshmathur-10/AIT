import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Box, Paper, Typography } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import axios from 'axios';
import qs from 'qs';

axios.defaults.withCredentials = true;

export default function Login({ onLogin }) {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)' }}>
      <Paper elevation={6} sx={{ p: 6, borderRadius: 4, minWidth: 340, textAlign: 'center', background: 'rgba(26,26,46,0.95)' }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, color: '#6366f1' }}>
          Sign in to TaskManager
        </Typography>
        <GoogleLogin
          onSuccess={async credentialResponse => {
            try {
              const res = await axios.post(
                '/api/auth/google/',
                qs.stringify({ credential: credentialResponse.credential }),
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
              );
              if (res.data && res.data.user) {
                if (onLogin) onLogin();
              } else {
                alert('Backend verification failed');
              }
            } catch (err) {
              alert('Google Sign In Failed: ' + (err?.response?.data?.error || err.message));
            }
          }}
          onError={() => {
            alert('Google Sign In Failed');
          }}
          useOneTap
        />
        <Box sx={{ mt: 3, color: 'text.secondary', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <GoogleIcon sx={{ color: '#ea4335' }} />
          <Typography variant="body2">Sign in with Google</Typography>
        </Box>
      </Paper>
    </Box>
  );
} 