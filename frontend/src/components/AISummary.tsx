import React, { useState } from 'react';
import { Box, Button, Card, CardContent, Typography, CircularProgress, Alert, Divider } from '@mui/material';
import axios from 'axios';

export interface TaskForAI {
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string | null;
  completed: boolean;
}

interface AISummaryProps {
  tasks: TaskForAI[];
}

const API_URL = import.meta.env.VITE_API_URL || '/api';

const AISummary: React.FC<AISummaryProps> = ({ tasks }) => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGetSummary = async () => {
    setLoading(true);
    setError(null);
    setSummary(null);
    try {
      const res = await axios.post(
        `${API_URL}/ai/summary/`,
        { tasks },
        { withCredentials: true }
      );
      setSummary(res.data.summary);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to get AI summary.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ maxWidth: 700, mx: 'auto', my: 4, boxShadow: 6, borderRadius: 4 }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h5" fontWeight={700}>
            <span role="img" aria-label="AI">🤖</span> AI Task Summary
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleGetSummary}
            disabled={loading || tasks.length === 0}
            sx={{ borderRadius: 3, fontWeight: 600 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Get AI Summary'}
          </Button>
        </Box>
        <Divider sx={{ mb: 2 }} />
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {summary && (
          <Box sx={{ whiteSpace: 'pre-line', fontSize: 17, color: 'text.primary', background: 'rgba(102,126,234,0.05)', p: 2, borderRadius: 2, boxShadow: 1 }}>
            {summary}
          </Box>
        )}
        {!summary && !loading && !error && (
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            Click the button to get a smart, actionable summary of your current tasks.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default AISummary;
