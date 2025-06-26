import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import axios from 'axios';
import AISummary, { TaskForAI } from '../components/AISummary';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const Dashboard: React.FC = () => {
  const [tasks, setTasks] = useState<TaskForAI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_URL}/auth/profile/`, { withCredentials: true });
        setUser(res.data);
      } catch (err) {
        setError('Failed to load user profile.');
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${API_URL}/tasks/`, { withCredentials: true });
        // Map backend tasks to TaskForAI
        setTasks(
          res.data.map((t: any) => ({
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            due_date: t.due_date,
            completed: t.status === 'done',
          }))
        );
      } catch (err) {
        setError('Failed to load tasks.');
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  if (loading) return <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>;
  if (error) return <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>;

  return (
    <Box maxWidth={900} mx="auto" mt={4}>
      <Typography variant="h4" fontWeight={700} mb={2}>
        Welcome{user?.first_name ? `, ${user.first_name}` : ''}!
      </Typography>
      <Typography color="text.secondary" mb={3}>
        Your tasks are always synced and available on any device.
      </Typography>
      <AISummary tasks={tasks} />
      {/* You can add more dashboard widgets here */}
    </Box>
  );
};

export default Dashboard;
