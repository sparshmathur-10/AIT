import { GoogleLogin } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';
import { Box, Paper, Typography, Button } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import axios from 'axios';
import qs from 'qs';
import { useState, useEffect } from 'react';

axios.defaults.withCredentials = true;

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function Login({ onLogin }: { onLogin?: () => void }) {
  const [googleLoaded, setGoogleLoaded] = useState(false);

  useEffect(() => {
    // Check if Google OAuth is loaded
    if ((window as any).google && (window as any).google.accounts) {
      setGoogleLoaded(true);
      console.log('Google OAuth library loaded successfully');
    } else {
      console.error('Google OAuth library not loaded');
    }
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)' }}>
      <Paper elevation={6} sx={{ p: 6, borderRadius: 4, minWidth: 340, textAlign: 'center', background: 'rgba(26,26,46,0.95)' }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, color: '#6366f1' }}>
          Sign in to TaskManager
        </Typography>
        
        {!googleLoaded && (
          <Typography variant="body2" color="error" sx={{ mb: 2 }}>
            Google OAuth library not loaded. Please refresh the page.
          </Typography>
        )}
        
        <GoogleLogin
          onSuccess={async (credentialResponse: CredentialResponse) => {
            console.log('Google OAuth success callback triggered');
            console.log('Credential response:', credentialResponse);
            
            if (!credentialResponse.credential) {
              console.error('No credential in response');
              alert('No credential returned from Google');
              return;
            }
            console.log('Google login successful, sending to backend...');
            try {
              // Add timeout to the request
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
              
              console.log('Making request to:', `${API_URL}/auth/google/`);
              const res = await axios.post(
                `${API_URL}/auth/google/`,
                qs.stringify({ credential: credentialResponse.credential }),
                { 
                  headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                }
              );
              
              clearTimeout(timeoutId);
              console.log('Backend login response:', res.data);
              if (res.data && typeof res.data === 'object' && 'user' in res.data) {
                console.log('Login successful, user:', (res.data as any).user);
                if (onLogin) onLogin();
              } else {
                console.error('Backend verification failed - no user in response');
                alert('Backend verification failed');
              }
            } catch (err: any) {
              console.error('Login error:', err);
              console.error('Error details:', {
                message: err.message,
                status: err.response?.status,
                data: err.response?.data,
                config: err.config
              });
              if (err.name === 'AbortError') {
                alert('Login request timed out. Please try again.');
              } else {
                const errorMsg = (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'error' in err.response.data) ? (err.response.data.error) : (err instanceof Error ? err.message : 'Unknown error');
                alert('Google Sign In Failed: ' + errorMsg);
              }
            }
          }}
          onError={() => {
            console.error('Google OAuth error occurred');
            alert('Google Sign In Failed');
          }}
          useOneTap
        />
        
        {/* Test button to check backend connectivity */}
        <Button 
          variant="outlined" 
          onClick={async () => {
            try {
              console.log('Testing backend connectivity...');
              const res = await axios.get(`${API_URL}/auth/profile/`);
              console.log('Backend test response:', res.status);
              alert('Backend is reachable! Status: ' + res.status);
            } catch (err: any) {
              console.error('Backend test failed:', err);
              alert('Backend test failed: ' + (err.response?.status || err.message));
            }
          }}
          sx={{ mt: 2 }}
        >
          Test Backend Connection
        </Button>
        <Box sx={{ mt: 3, color: 'text.secondary', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <GoogleIcon sx={{ color: '#ea4335' }} />
          <Typography variant="body2">Sign in with Google</Typography>
        </Box>
      </Paper>
    </Box>
  );
} 