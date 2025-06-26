import { GoogleLogin } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';
import { Box, Paper, Typography } from '@mui/material';
import axios from 'axios';
import qs from 'qs';

axios.defaults.withCredentials = true;

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function Login({ onLogin }: { onLogin?: () => void }) {
  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      alert('No credential returned from Google');
      return;
    }
    
    try {
      const requestData = qs.stringify({ credential: credentialResponse.credential });
      
      const res = await axios.post(
        `${API_URL}/auth/google/`,
        requestData,
        { 
          headers: { 
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 15000
        }
      );
      
      if (res.data && typeof res.data === 'object' && 'user' in res.data) {
        if (onLogin) onLogin();
      } else {
        alert('Backend verification failed');
      }
    } catch (err: any) {
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        alert('Login request timed out. Please try again.');
      } else if (err.response?.status === 500) {
        alert('Server error. Please try again later.');
      } else {
        const errorMsg = err.response?.data?.error || err.message || 'Unknown error';
        alert('Google Sign In Failed: ' + errorMsg);
      }
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)' }}>
      <Paper elevation={6} sx={{ p: 6, borderRadius: 4, minWidth: 340, textAlign: 'center', background: 'rgba(26,26,46,0.95)' }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, color: '#6366f1' }}>
          Sign in to TaskManager
        </Typography>
        
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => alert('Google Sign In Failed')}
          useOneTap={false}
          theme="filled_blue"
          size="large"
          text="signin_with"
          shape="rectangular"
        />
      </Paper>
    </Box>
  );
} 