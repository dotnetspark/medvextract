// frontend/src/App.tsx
import React, { use, useState } from 'react';
import { Container, Typography, ThemeProvider, createTheme, Box } from '@mui/material';
import { useTaskStore } from './store';
import TranscriptForm from './components/TranscriptForm';
import TaskDisplay from './components/TaskDisplay';
import type { VetOutput } from './types/schemas';

const theme = createTheme({
  palette: {
    primary: { main: '#007bff' }, // VetRec blue
    background: { default: '#f5faff' }, // Light blue background
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
    h4: { color: '#003087', fontWeight: 700 },
    h6: { color: '#003087', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

const App: React.FC = () => {
  const { tasks } = useTaskStore();
  console.log('Current tasks:', tasks);

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth={false} disableGutters sx={{ width: '100vw', height: '100vh', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', bgcolor: '#f5faff', m: 0, p: 0 }}>
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <Typography variant="h4" gutterBottom align="center">
            Medvextract
          </Typography>
          <Typography variant="body1" align="center" sx={{ mb: 4, color: '#003087' }}>
            LLM-Powered Medical Visit Action Extraction System
          </Typography>
          <Box sx={{ width: '100%', maxWidth: 600, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {tasks ? (
              <TaskDisplay data={tasks} />
            ) : (
              <TranscriptForm onSubmit={useTaskStore.getState().setTasks} />
            )}
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default App;