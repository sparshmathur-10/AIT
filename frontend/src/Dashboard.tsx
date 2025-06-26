import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Checkbox,
  Paper,
  AppBar,
  Toolbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Fade,
  Slide,
  CircularProgress,
} from '@mui/material';
import { 
  Delete as DeleteIcon, 
  SmartToy as AIIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as UncheckedIcon
} from '@mui/icons-material';
import { getAISummary } from './api';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Configure axios to include credentials and CSRF token
axios.defaults.withCredentials = true;

// Function to get CSRF token from cookies
function getCSRFToken() {
  const name = 'csrftoken';
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// Add CSRF token to all requests
axios.interceptors.request.use(function (config) {
  const token = getCSRFToken();
  if (token && config.headers) {
    config.headers['X-CSRFToken'] = token;
  }
  return config;
});

interface Task {
  id: number;
  title: string;
  completed: boolean;
}

const Transition = React.forwardRef(function Transition(
  props: any,
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [summaryDialog, setSummaryDialog] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    // First get CSRF token, then load tasks
    const initializeApp = async () => {
      try {
        // Get CSRF token
        await axios.get(`${API_URL}/auth/csrf/`);
        
        // Now load tasks
        const res = await axios.get(`${API_URL}/tasks/`);
        console.log('Backend /tasks/ response:', res.data);
        let arr: Task[] = [];
        if (Array.isArray(res.data)) {
          arr = (res.data as any[]).map((t: any) => ({
            id: Number(t.id),
            title: String(t.title),
            completed: Boolean(t.completed)
          }));
        } else if (res.data && Array.isArray((res.data as any).results)) {
          arr = ((res.data as any).results as any[]).map((t: any) => ({
            id: Number(t.id),
            title: String(t.title),
            completed: Boolean(t.completed)
          }));
        }
        setTasks(arr);
      } catch (err: any) {
        setError('Failed to load tasks');
        console.error('Error loading tasks:', err);
      }
    };

    initializeApp();
  }, []);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    setAdding(true);
    try {
      const res = await axios.post(`${API_URL}/tasks/`, { title: newTask, description: '', priority: 'medium' });
      setTasks([...tasks, res.data as Task]);
      setNewTask('');
    } catch (err: any) {
      alert('Failed to add task: ' + (err.response?.data?.detail || err.message));
      console.error('Add task error:', err.response || err);
    } finally {
      setAdding(false);
    }
  };

  const toggleTask = async (id: number) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const res = await axios.patch(`${API_URL}/tasks/${id}/`, { completed: !task.completed });
    setTasks(tasks.map(t => t.id === id ? (res.data as Task) : t));
  };

  const deleteTask = async (id: number) => {
    await axios.delete(`${API_URL}/tasks/${id}/`);
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handleAISummary = async () => {
    setLoading(true);
    setSummaryDialog(true);
    const summary = await getAISummary(tasks);
    setAiSummary(summary);
    setLoading(false);
  };

  if (error) {
    return <div style={{ color: 'red', textAlign: 'center', marginTop: 40 }}>{error}</div>;
  }

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 100%)' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar sx={{ px: { xs: 2, md: 4 } }}>
          <Typography variant="h6" sx={{ 
            flexGrow: 1, 
            background: 'linear-gradient(45deg, #6366f1, #ec4899)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 700
          }}>
            TaskManager
          </Typography>
          <Button 
            variant="contained"
            startIcon={<AIIcon />}
            onClick={handleAISummary}
            disabled={tasks.length === 0 || loading}
            sx={{
              background: 'linear-gradient(45deg, #6366f1, #818cf8)',
              '&:hover': {
                background: 'linear-gradient(45deg, #4f46e5, #6366f1)'
              }
            }}
          >
            AI Summary
          </Button>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="md" sx={{ py: 4, px: { xs: 2, md: 4 } }}>
        <Fade in timeout={800}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ 
              mb: 4, 
              textAlign: 'center',
              background: 'linear-gradient(45deg, #f8fafc, #94a3b8)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Your Tasks
            </Typography>
            
            <Paper sx={{ p: 4, mb: 4, boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)' }}>
              <Box component="form" onSubmit={addTask} sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="What needs to be done?"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="Enter a new task..."
                  sx={{
                    '& .MuiInputLabel-root': {
                      color: 'text.secondary'
                    }
                  }}
                />
                <Button 
                  type="submit" 
                  variant="contained" 
                  disabled={!newTask.trim() || adding}
                  startIcon={<AddIcon />}
                  sx={{
                    background: 'linear-gradient(45deg, #6366f1, #818cf8)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #4f46e5, #6366f1)'
                    },
                    '&:disabled': {
                      background: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  Add
                </Button>
              </Box>
            </Paper>

            <Paper sx={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)' }}>
              <List sx={{ p: 0 }}>
                {tasks.map((task, index) => (
                  <Fade in timeout={300 + index * 100} key={task.id}>
                    <ListItem 
                      sx={{ 
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        '&:last-child': { borderBottom: 'none' },
                        py: 2,
                        px: 3
                      }}
                    >
                      <Checkbox
                        checked={task.completed}
                        onChange={() => toggleTask(task.id)}
                        icon={<UncheckedIcon sx={{ color: 'text.secondary' }} />}
                        checkedIcon={<CheckCircleIcon sx={{ color: '#6366f1' }} />}
                        sx={{ mr: 2 }}
                      />
                      <ListItemText
                        primary={task.title}
                        sx={{
                          textDecoration: task.completed ? 'line-through' : 'none',
                          color: task.completed ? 'text.secondary' : 'text.primary',
                          '& .MuiListItemText-primary': {
                            fontSize: '1.1rem',
                            fontWeight: task.completed ? 400 : 500
                          }
                        }}
                      />
                      <ListItemSecondaryAction>
                        <IconButton 
                          onClick={() => deleteTask(task.id)}
                          sx={{
                            color: '#ef4444',
                            '&:hover': {
                              backgroundColor: 'rgba(239, 68, 68, 0.1)'
                            }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  </Fade>
                ))}
              </List>
            </Paper>

            {tasks.length === 0 && (
              <Fade in timeout={500}>
                <Paper sx={{ p: 4, textAlign: 'center', mt: 3 }}>
                  <Typography color="text.secondary" variant="h6">
                    No tasks yet. Add your first task above!
                  </Typography>
                </Paper>
              </Fade>
            )}

            {tasks.length > 0 && (
              <Fade in timeout={800}>
                <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Chip 
                    label={`Total: ${tasks.length}`} 
                    color="primary" 
                    variant="outlined"
                    sx={{ borderRadius: 2 }}
                  />
                  <Chip 
                    label={`Done: ${tasks.filter(t => t.completed).length}`} 
                    color="success" 
                    variant="outlined"
                    sx={{ borderRadius: 2 }}
                  />
                  <Chip 
                    label={`Pending: ${tasks.filter(t => !t.completed).length}`} 
                    color="warning" 
                    variant="outlined"
                    sx={{ borderRadius: 2 }}
                  />
                </Box>
              </Fade>
            )}
          </Box>
        </Fade>
      </Container>

      <Dialog 
        open={summaryDialog} 
        onClose={() => setSummaryDialog(false)}
        TransitionComponent={Transition}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 100%)',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }
        }}
      >
        <DialogTitle sx={{ 
          textAlign: 'center',
          background: 'linear-gradient(45deg, #6366f1, #ec4899)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 600
        }}>
          🤖 AI Task Analysis (GitHub DeepSeek)
        </DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Typography sx={{ 
              whiteSpace: 'pre-wrap',
              lineHeight: 1.8,
              fontSize: '1.1rem',
              color: 'text.primary'
            }}>
              {aiSummary}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={() => setSummaryDialog(false)}
            variant="contained"
            sx={{
              background: 'linear-gradient(45deg, #6366f1, #818cf8)',
              '&:hover': {
                background: 'linear-gradient(45deg, #4f46e5, #6366f1)'
              }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 