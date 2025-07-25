import React, { useEffect, useState } from 'react';
import { TextField, Button, Box, MenuItem, Select, InputLabel, FormControl, CircularProgress, Typography } from '@mui/material';
import axios from 'axios';
import type { VetInput, VetOutput } from '../types/schemas';

interface TranscriptFormProps {
    onSubmit: (data: VetOutput) => void;
}

const TranscriptForm: React.FC<TranscriptFormProps> = ({ onSubmit }) => {
    const [transcript, setTranscript] = useState('');
    const [notes, setNotes] = useState('');
    const [templateId, setTemplateId] = useState('SOAP_ER');
    const [error, setError] = useState<string | null>(null);
    const [taskId, setTaskId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);
        try {
            const input: VetInput = {
                transcript,
                notes,
                metadata: {
                    patient_id: 'PET' + Math.random().toString().slice(2, 8),
                    consult_date: new Date().toISOString().split('T')[0],
                    veterinarian_id: 'VET123',
                    clinic_id: 'CLIN456',
                    template_id: templateId,
                },
            };
            console.log('Submitting transcript:', input);
            const response = await axios.post('http://localhost:8000/extract-tasks', input);
            console.log('Submit response:', response.data);
            setTaskId(response.data.task_id);
        } catch (err: any) {
            console.error('Error processing transcript:', err);
            setError(err.response?.data?.detail || 'Failed to process transcript.');
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        if (taskId) {
            console.log('Fetching results for task:', taskId);
            const interval = setInterval(async () => {
                try {
                    const response = await axios.get(`http://localhost:8000/task/${taskId}`);
                    console.log('Task status response:', response.data);
                    if (response.data.status === 'completed') {
                        console.log('Task completed:', response.data);
                        onSubmit(response.data.result as VetOutput);
                        setTaskId(null);
                        setIsSubmitting(false); // Only set to false after completion
                        clearInterval(interval);
                    } else if (response.data.status === 'failed') {
                        setError(`Task failed: ${response.data.error}`);
                        setTaskId(null);
                        setIsSubmitting(false); // Only set to false after failure
                        clearInterval(interval);
                    }
                    else {
                        console.log('Task still in progress:', response.data.status);
                        // Do not set isSubmitting to false here
                    }
                } catch (err: any) {
                    console.error('Error fetching task status:', err);
                    setError(err.response?.data?.detail || 'Failed to fetch task status.');
                    setTaskId(null);
                    setIsSubmitting(false); // Only set to false after error
                    clearInterval(interval);
                }
            }, 2000); // Poll every 2 seconds
            return () => clearInterval(interval); // Cleanup interval on unmount
        }
    }, [taskId, onSubmit]);

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mb: 4, bgcolor: 'white', p: 3, borderRadius: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>SOAP Template</InputLabel>
                <Select
                    value={templateId}
                    onChange={(e) => setTemplateId(e.target.value)}
                    label="SOAP Template"
                    sx={{ bgcolor: 'white' }}
                >
                    <MenuItem value="SOAP_ER">Emergency SOAP</MenuItem>
                    <MenuItem value="SOAP_GP">General Practice SOAP</MenuItem>
                    <MenuItem value="DISCHARGE">Discharge Note</MenuItem>
                </Select>
            </FormControl>
            <TextField
                label="Consult Transcript"
                multiline
                rows={6}
                fullWidth
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                margin="normal"
                required
                sx={{ bgcolor: 'white' }}
            />
            <TextField
                label="Additional Notes"
                multiline
                rows={2}
                fullWidth
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                margin="normal"
                sx={{ bgcolor: 'white' }}
            />
            <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                sx={{ bgcolor: '#007bff', '&:hover': { bgcolor: '#005bff' }, mt: 2 }}
            >
                {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Generate Notes & Tasks'}
            </Button>
            {error && (
                <Typography color="error.main" mt={2}>
                    {error}
                </Typography>
            )}
        </Box>
    );
};

export default TranscriptForm;