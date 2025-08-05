import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import type { VetOutput } from '../types/schemas';

interface Transcript {
    id: number;
    task_id: string;
    transcript: string;
    notes: string | null;
    metadata: Record<string, any> | null;
    result: VetOutput | null;
    status: 'PENDING' | 'COMPLETED' | 'FAILED';
    created_at: string;
    updated_at: string;
}

const Transcripts: React.FC = () => {
    const [transcripts, setTranscripts] = useState<Transcript[]>([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTranscripts = async () => {
            try {
                const response = await axios.get('http://localhost:8000/transcripts');
                setTranscripts(response.data);
            } catch (err) {
                console.error('Error fetching transcripts:', err);
            }
        };
        fetchTranscripts();
    }, []);

    const handleChangePage = (newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setRowsPerPage(parseInt(e.target.value, 10));
        setPage(0);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-400';
            case 'COMPLETED': return 'bg-green-500';
            case 'FAILED': return 'bg-red-500';
            default: return 'bg-gray-400';
        }
    };

    // Badge component for status
    const Badge = ({ text }: { text: string }) => {
        let color = text.toLowerCase() === 'completed' ? 'green' : text.toLowerCase() === 'pending' ? 'yellow' : text.toLowerCase() === 'failed' ? 'red' : 'gray';
        let bg = 'bg-blue-100', txt = 'text-blue-800';
        if (color === 'red') { bg = 'bg-red-100'; txt = 'text-red-800'; }
        else if (color === 'yellow') { bg = 'bg-yellow-100'; txt = 'text-yellow-800'; }
        else if (color === 'green') { bg = 'bg-green-100'; txt = 'text-green-800'; }
        else if (color === 'gray') { bg = 'bg-gray-100'; txt = 'text-gray-800'; }
        return <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${bg} ${txt} mr-2`}>{text}</span>;
    };

    return (
        <section className="bg-white rounded-2xl shadow-lg p-8 border border-blue-100 w-full">
            <h2 className="text-3xl font-extrabold text-blue-900 mb-8 flex items-center gap-3">
                <span className="inline-block w-2 h-8 bg-blue-400 rounded-full"></span>
                <span role="img" aria-label="Transcript">📄</span> Transcripts
            </h2>
            <div className="flex justify-end mb-6">
                <button
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow transition"
                    onClick={() => navigate('/transcript-form')}
                >
                    Process Transcript
                </button>
            </div>
            {transcripts.length === 0 ? (
                <div className="text-gray-500 text-center py-8">No Transcripts</div>
            ) : (
                <div className="w-full overflow-x-auto">
                    <table className="min-w-full bg-white rounded-lg shadow">
                        <thead>
                            <tr className="bg-blue-100 text-blue-900">
                                <th className="px-4 py-3 font-semibold">Status</th>
                                <th className="px-4 py-3 font-semibold">Transcript</th>
                                <th className="px-4 py-3 font-semibold">Notes</th>
                                <th className="px-4 py-3 font-semibold">Metadata</th>
                                <th className="px-4 py-3 font-semibold">Result</th>
                                <th className="px-4 py-3 font-semibold">Raw Result</th>
                                <th className="px-4 py-3 font-semibold">Created At</th>
                                <th className="px-4 py-3 font-semibold">Updated At</th>
                                <th className="px-4 py-3 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transcripts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((t) => (
                                <tr key={t.task_id} className="border-b last:border-none hover:bg-blue-50 transition">
                                    <td className="px-4 py-3">
                                        <Badge text={t.status} />
                                    </td>
                                    <td className="px-4 py-3">{t.transcript.substring(0, 50)}...</td>
                                    <td className="px-4 py-3">{t.notes || 'N/A'}</td>
                                    <td className="px-4 py-3">{JSON.stringify(t.metadata)}</td>
                                    <td className="px-4 py-3">{t.result ? JSON.stringify(t.result, null, 2).substring(0, 50) + '...' : 'N/A'}</td>
                                    <td className="px-4 py-3">{t.result ? JSON.stringify(t.result).substring(0, 50) + '...' : 'N/A'}</td>
                                    <td className="px-4 py-3">{new Date(t.created_at).toLocaleString()}</td>
                                    <td className="px-4 py-3">{new Date(t.updated_at).toLocaleString()}</td>
                                    <td className="px-4 py-3 flex gap-2">
                                        <button
                                            className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-semibold px-3 py-1 rounded shadow transition"
                                            title="Edit"
                                            onClick={() => navigate(`/transcript-form/${t.task_id}`)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold px-3 py-1 rounded shadow transition"
                                            title="View"
                                            onClick={() => navigate(`/task-display/${t.task_id}`)}
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {/* Pagination */}
                    <div className="flex items-center justify-between p-4 mt-4">
                        <div>
                            <label className="mr-2 text-blue-900 font-semibold">Rows per page:</label>
                            <select
                                value={rowsPerPage}
                                onChange={handleChangeRowsPerPage}
                                className="border border-blue-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-l disabled:opacity-50"
                                onClick={() => handleChangePage(page - 1)}
                                disabled={page === 0}
                            >Prev</button>
                            <span className="px-4 py-1 bg-white border-t border-b border-blue-100">{page + 1} / {Math.ceil(transcripts.length / rowsPerPage)}</span>
                            <button
                                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-r disabled:opacity-50"
                                onClick={() => handleChangePage(page + 1)}
                                disabled={page >= Math.ceil(transcripts.length / rowsPerPage) - 1}
                            >Next</button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default Transcripts;