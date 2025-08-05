import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import type { VetInput, VetOutput } from '../types/schemas';

interface TranscriptFormProps {
    onSubmit: (data: VetOutput) => void;
}

const TranscriptForm: React.FC<TranscriptFormProps> = ({ onSubmit }) => {
    const [transcript, setTranscript] = useState('');
    const [notes, setNotes] = useState('');
    const [templateId, setTemplateId] = useState('SOAP_ER');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const { taskId } = useParams<{ taskId?: string }>();

    useEffect(() => {
        if (taskId) {
            const fetchTranscript = async () => {
                try {
                    const response = await axios.get(`http://localhost:8000/task/${taskId}`);
                    if (response.data.status === 'completed' || response.data.status === 'failed') {
                        const db = await axios.get("http://localhost:8000/transcripts");
                        const transcriptData = db.data.find((t: any) => t.task_id === taskId);
                        if (transcriptData) {
                            setTranscript(transcriptData.transcript);
                            setNotes(transcriptData.notes || '');
                            setTemplateId(transcriptData.metadata?.template_id || 'SOAP_ER');
                        }
                    }
                } catch (err: any) {
                    console.error('Error fetching task status:', err);
                    setError(err.response?.data?.detail || 'Failed to fetch task status.');
                    setIsSubmitting(false);
                }
            };
            fetchTranscript();
        }
    }, [taskId]);

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
            navigate('/');
        } catch (err: any) {
            console.error('Error processing transcript:', err);
            setError(err.response?.data?.detail || 'Failed to process transcript.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 max-w-xl mx-auto mb-8">
            <div className="mb-4">
                <label htmlFor="templateId" className="block text-blue-900 font-semibold mb-2">SOAP Template</label>
                <select
                    id="templateId"
                    value={templateId}
                    onChange={(e) => setTemplateId(e.target.value)}
                    className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                    <option value="SOAP_ER">Emergency SOAP</option>
                    <option value="SOAP_GP">General Practice SOAP</option>
                    <option value="DISCHARGE">Discharge Note</option>
                </select>
            </div>
            <div className="mb-4">
                <label htmlFor="transcript" className="block text-blue-900 font-semibold mb-2">Consult Transcript</label>
                <textarea
                    id="transcript"
                    rows={6}
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    required
                    className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
            </div>
            <div className="mb-4">
                <label htmlFor="notes" className="block text-blue-900 font-semibold mb-2">Additional Notes</label>
                <textarea
                    id="notes"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
            </div>
            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 mt-2 flex items-center justify-center"
            >
                {isSubmitting ? (
                    <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                ) : 'Generate Notes & Tasks'}
            </button>
            {error && (
                <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mt-4 text-center">
                    {error}
                </div>
            )}
        </form>
    );
};

export default TranscriptForm;