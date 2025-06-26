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
    
    // Clear any existing session data to force fresh authentication
    console.log('Clearing existing session data...');
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
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
            console.log('=== GOOGLE OAUTH SUCCESS CALLBACK START ===');
            console.log('Credential response:', credentialResponse);
            console.log('Credential length:', credentialResponse.credential?.length || 0);
            
            if (!credentialResponse.credential) {
              console.error('No credential in response');
              alert('No credential returned from Google');
              return;
            }
            
            console.log('Google login successful, sending to backend...');
            console.log('API URL:', `${API_URL}/auth/google/`);
            
            try {
              console.log('Making POST request to backend...');
              const requestData = qs.stringify({ credential: credentialResponse.credential });
              console.log('Request data length:', requestData.length);
              
              // Add cache-busting and ensure fresh request
              const res = await axios.post(
                `${API_URL}/auth/google/?_t=${Date.now()}`,
                requestData,
                { 
                  headers: { 
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                  },
                  timeout: 15000
                }
              );
              
              console.log('Backend response received!');
              console.log('Response status:', res.status);
              console.log('Response data:', res.data);
              
              if (res.data && typeof res.data === 'object' && 'user' in res.data) {
                console.log('Login successful, user:', (res.data as any).user);
                console.log('Calling onLogin callback...');
                if (onLogin) onLogin();
                console.log('=== GOOGLE OAUTH SUCCESS CALLBACK END ===');
              } else {
                console.error('Backend verification failed - no user in response');
                console.log('Response structure:', Object.keys(res.data || {}));
                alert('Backend verification failed');
              }
            } catch (err: any) {
              console.error('=== LOGIN ERROR ===');
              console.error('Error type:', err.constructor.name);
              console.error('Error message:', err.message);
              console.error('Error status:', err.response?.status);
              console.error('Error data:', err.response?.data);
              console.error('Error config:', err.config);
              console.error('Network error:', err.code);
              
              if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
                alert('Login request timed out. Please try again.');
              } else if (err.response?.status === 500) {
                alert('Server error. Please try again later.');
              } else {
                const errorMsg = err.response?.data?.error || err.message || 'Unknown error';
                alert('Google Sign In Failed: ' + errorMsg);
              }
            }
          }}
          onError={() => {
            console.error('=== GOOGLE OAUTH ERROR CALLBACK ===');
            console.error('Google OAuth error occurred');
            alert('Google Sign In Failed');
          }}
        />
        
        {/* Test button to check backend connectivity */}
        <Button 
          variant="outlined" 
          onClick={async () => {
            try {
              console.log('=== TESTING BACKEND CONNECTIVITY ===');
              console.log('Testing URL:', `${API_URL}/auth/profile/`);
              
              const res = await axios.get(`${API_URL}/auth/profile/`, {
                timeout: 10000
              });
              
              console.log('Backend test successful!');
              console.log('Status:', res.status);
              console.log('Data:', res.data);
              alert('Backend is reachable! Status: ' + res.status);
            } catch (err: any) {
              console.error('=== BACKEND TEST FAILED ===');
              console.error('Error:', err.message);
              console.error('Status:', err.response?.status);
              console.error('Data:', err.response?.data);
              alert('Backend test failed: ' + (err.response?.status || err.message));
            }
          }}
          sx={{ mt: 2 }}
        >
          Test Backend Connection
        </Button>
        
        {/* Test Google OAuth library */}
        <Button 
          variant="outlined" 
          onClick={() => {
            console.log('=== TESTING GOOGLE OAUTH LIBRARY ===');
            console.log('Google loaded:', googleLoaded);
            console.log('Window google:', (window as any).google);
            console.log('Google accounts:', (window as any).google?.accounts);
            
            // Try to manually trigger Google OAuth
            if ((window as any).google?.accounts?.id) {
              console.log('Attempting to manually trigger Google OAuth...');
              try {
                (window as any).google.accounts.id.prompt();
                console.log('Google OAuth prompt triggered successfully');
              } catch (e) {
                console.error('Error triggering Google OAuth prompt:', e);
              }
            } else {
              console.error('Google OAuth library not properly loaded');
            }
            
            alert(`Google OAuth loaded: ${googleLoaded}`);
          }}
          sx={{ mt: 1, ml: 1 }}
        >
          Test Google OAuth
        </Button>
        
        {/* Test database */}
        <Button 
          variant="outlined" 
          onClick={async () => {
            try {
              console.log('=== TESTING DATABASE ===');
              console.log('Testing URL:', `${API_URL}/test_database/`);
              
              const res = await axios.get(`${API_URL}/test_database/`, {
                timeout: 10000
              });
              
              console.log('Database test successful!');
              console.log('Response:', res.data);
              alert('Database test: ' + JSON.stringify(res.data, null, 2));
            } catch (err: any) {
              console.error('=== DATABASE TEST FAILED ===');
              console.error('Error:', err.message);
              console.error('Status:', err.response?.status);
              console.error('Data:', err.response?.data);
              alert('Database test failed: ' + (err.response?.data?.error || err.message));
            }
          }}
          sx={{ mt: 1, ml: 1 }}
        >
          Test Database
        </Button>
        
        {/* Clear Cache button */}
        <Button 
          variant="outlined" 
          onClick={() => {
            console.log('=== CLEARING CACHE ===');
            // Clear all cookies
            document.cookie.split(";").forEach(function(c) { 
              document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
            });
            // Clear localStorage
            localStorage.clear();
            // Clear sessionStorage
            sessionStorage.clear();
            console.log('Cache cleared successfully');
            alert('Cache cleared! Please refresh the page and try signing in again.');
            window.location.reload();
          }}
          sx={{ mt: 1, ml: 1 }}
        >
          Clear Cache
        </Button>
      </Paper>
    </Box>
  );
} 