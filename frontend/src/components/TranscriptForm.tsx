import React, { useState } from 'react';
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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const response = await axios.post('http://localhost:8000/extract-tasks', {
                transcript,
                notes,
                metadata: {
                    patient_id: 'PET' + Math.random().toString().slice(2, 8),
                    consult_date: new Date().toISOString().split('T')[0],
                    veterinarian_id: 'VET123',
                    clinic_id: 'CLIN456',
                    template_id: templateId,
                    language: 'en',
                },
            } as VetInput);
            onSubmit(response.data); // Pass output directly to parent
            setTranscript('');
            setNotes('');
        } catch (err) {
            setError('Failed to process transcript.');
        } finally {
            setLoading(false);
        }
    };

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
                disabled={loading}
                sx={{ bgcolor: '#007bff', '&:hover': { bgcolor: '#005bff' }, mt: 2 }}
            >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Generate Notes & Tasks'}
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