import { GoogleLogin } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';
import { Box, Paper, Typography, Button } from '@mui/material';
import axios from 'axios';
import qs from 'qs';
import { useState, useEffect } from 'react';

axios.defaults.withCredentials = true;

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function Login({ onLogin }: { onLogin?: () => void }) {
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebug = (message: string) => {
    console.log(`[DEBUG] ${message}`);
    setDebugInfo(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  useEffect(() => {
    addDebug('Login component mounted');
    
    // Check Google OAuth library status
    const checkGoogleOAuth = () => {
      addDebug('Checking Google OAuth library...');
      
      if ((window as any).google) {
        addDebug('Google object found');
        if ((window as any).google.accounts) {
          addDebug('Google accounts API found');
          setGoogleLoaded(true);
        } else {
          addDebug('Google accounts API NOT found');
        }
      } else {
        addDebug('Google object NOT found');
      }
      
      // Check for any Google OAuth errors
      if ((window as any).google?.accounts?.id) {
        addDebug('Google OAuth ID API available');
      } else {
        addDebug('Google OAuth ID API NOT available');
      }
    };

    // Check immediately
    checkGoogleOAuth();
    
    // Check again after a delay
    setTimeout(checkGoogleOAuth, 2000);
    setTimeout(checkGoogleOAuth, 5000);
    
    // Monitor for Google OAuth library loading
    const interval = setInterval(() => {
      if (!googleLoaded && (window as any).google?.accounts) {
        addDebug('Google OAuth library loaded via interval check');
        setGoogleLoaded(true);
        clearInterval(interval);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [googleLoaded]);

  const clearAllCookies = () => {
    addDebug('=== CLEARING ALL COOKIES ===');
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    localStorage.clear();
    sessionStorage.clear();
    addDebug('All cookies and storage cleared');
    alert('Cache cleared! Please refresh the page and try signing in again.');
    window.location.reload();
  };

  const handleGoogleLogin = async () => {
    addDebug('=== MANUAL GOOGLE OAUTH TRIGGER ===');
    
    if (!googleLoaded) {
      addDebug('Google OAuth not loaded - showing alert');
      alert('Google OAuth not loaded. Please refresh the page.');
      return;
    }

    try {
      addDebug('Attempting to trigger Google OAuth prompt...');
      
      // Use Google's programmatic API
      if ((window as any).google?.accounts?.id) {
        addDebug('Google OAuth ID API available, calling prompt...');
        (window as any).google.accounts.id.prompt((notification: any) => {
          addDebug(`Google OAuth notification received: ${JSON.stringify(notification)}`);
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            const reason = notification.getNotDisplayedReason();
            addDebug(`Google OAuth prompt failed: ${reason}`);
            alert(`Google Sign In failed: ${reason}`);
          }
        });
      } else {
        addDebug('Google OAuth ID API not available');
        alert('Google OAuth not available. Please refresh the page.');
      }
    } catch (error) {
      addDebug(`Error triggering Google OAuth: ${error}`);
      alert('Failed to start Google Sign In. Please try again.');
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    addDebug('=== GOOGLE OAUTH SUCCESS CALLBACK START ===');
    addDebug(`Credential response received: ${JSON.stringify(credentialResponse)}`);
    addDebug(`Credential length: ${credentialResponse.credential?.length || 0}`);
    
    if (!credentialResponse.credential) {
      addDebug('No credential in response');
      alert('No credential returned from Google');
      return;
    }
    
    addDebug('Google login successful, sending to backend...');
    addDebug(`API URL: ${API_URL}/auth/google/`);
    
    try {
      addDebug('Making POST request to backend...');
      const requestData = qs.stringify({ credential: credentialResponse.credential });
      addDebug(`Request data length: ${requestData.length}`);
      
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
      
      addDebug('Backend response received!');
      addDebug(`Response status: ${res.status}`);
      addDebug(`Response data: ${JSON.stringify(res.data)}`);
      
      if (res.data && typeof res.data === 'object' && 'user' in res.data) {
        addDebug('Login successful, user found in response');
        addDebug(`User: ${JSON.stringify((res.data as any).user)}`);
        addDebug('Calling onLogin callback...');
        if (onLogin) onLogin();
        addDebug('=== GOOGLE OAUTH SUCCESS CALLBACK END ===');
      } else {
        addDebug('Backend verification failed - no user in response');
        addDebug(`Response structure: ${Object.keys(res.data || {})}`);
        alert('Backend verification failed');
      }
    } catch (err: any) {
      addDebug('=== LOGIN ERROR ===');
      addDebug(`Error type: ${err.constructor.name}`);
      addDebug(`Error message: ${err.message}`);
      addDebug(`Error status: ${err.response?.status}`);
      addDebug(`Error data: ${JSON.stringify(err.response?.data)}`);
      addDebug(`Error config: ${JSON.stringify(err.config)}`);
      addDebug(`Network error: ${err.code}`);
      
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
        
        {/* Debug Info */}
        <Box sx={{ mb: 2, p: 2, bgcolor: 'rgba(0,0,0,0.3)', borderRadius: 1, maxHeight: 200, overflow: 'auto' }}>
          <Typography variant="caption" color="text.secondary">
            Debug Info:
          </Typography>
          {debugInfo.slice(-5).map((info, i) => (
            <Typography key={i} variant="caption" display="block" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              {info}
            </Typography>
          ))}
        </Box>
        
        {!googleLoaded && (
          <Typography variant="body2" color="error" sx={{ mb: 2 }}>
            Google OAuth library not loaded. Please refresh the page.
          </Typography>
        )}
        
        {/* GoogleLogin component - properly visible */}
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => {
            addDebug('=== GOOGLE OAUTH ERROR CALLBACK ===');
            addDebug('Google OAuth error occurred');
            alert('Google Sign In Failed');
          }}
          useOneTap={false}
          theme="filled_blue"
          size="large"
          text="signin_with"
          shape="rectangular"
        />
        
        {/* Alternative manual trigger button */}
        <Button 
          variant="outlined"
          onClick={handleGoogleLogin}
          disabled={!googleLoaded}
          sx={{ 
            mt: 2,
            background: 'linear-gradient(45deg, #4285f4, #34a853)',
            color: 'white',
            '&:hover': {
              background: 'linear-gradient(45deg, #3367d6, #2d8f47)'
            }
          }}
        >
          Alternative Google Sign In
        </Button>
        
        <Button 
          variant="text" 
          onClick={clearAllCookies}
          sx={{ mt: 2, color: 'text.secondary' }}
        >
          Clear Cache
        </Button>
      </Paper>
    </Box>
  );
} 