import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import Dashboard from "./Dashboard";
import Login from "./Login";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useEffect, useState } from "react";

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#6366f1' },
    background: { default: '#0f0f23', paper: '#1a1a2e' },
    text: { primary: '#f8fafc', secondary: '#94a3b8' }
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 12, textTransform: 'none' }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 16, border: '1px solid rgba(255, 255, 255, 0.05)' }
      }
    }
  }
});

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || '/api';

  useEffect(() => {
    fetch(`${API_URL}/auth/profile/`, { credentials: 'include' })
      .then(res => {
        console.log('Auth check response:', res.status, res.ok);
        return res.ok ? setAuthed(true) : setAuthed(false);
      })
      .catch(err => {
        console.error('Auth check error:', err);
        setAuthed(false);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  return (
    <GoogleOAuthProvider clientId="938526209070-p87aip5pgetff98rkenmk6ki6hnmorh5.apps.googleusercontent.com">
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {authed ? <Dashboard /> : <Login onLogin={() => setAuthed(true)} />}
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}
