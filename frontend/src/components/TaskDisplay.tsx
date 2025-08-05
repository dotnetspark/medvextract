import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import type { VetOutput } from '../types/schemas';

const TaskDisplay: React.FC = () => {
    const { taskId } = useParams<{ taskId: string }>();
    const [data, setData] = useState<VetOutput | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const rowsPerPage = 5;
    const [expandedSoap, setExpandedSoap] = useState<number | null>(null);

    useEffect(() => {
        if (taskId) {
            const fetchData = async () => {
                try {
                    const response = await axios.get(`http://localhost:8000/task/${taskId}`);
                    console.log('Fetched task data:', response.data);
                    if (response.data.status === 'completed') {
                        setData(response.data.result);
                    } else if (response.data.status === 'failed') {
                        setError(`Task failed: ${response.data.error || 'Unknown error'}`);
                    } else {
                        setError('Task is still in progress. Please check back later.');
                    }
                } catch (err: any) {
                    console.error('Error fetching task data:', err);
                    setError(err.response?.data?.detail || 'Failed to fetch task data.');
                }
            };
            fetchData();
        }
    }, [taskId]);

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 my-8 text-center animate-fade-in">
                <div className="text-red-600 font-semibold text-lg mb-2">{error}</div>
                <div className="text-gray-500">Please try again or contact support.</div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-lg p-8 my-8 animate-pulse text-center">
                <div className="h-6 w-1/3 mx-auto bg-blue-100 rounded mb-4"></div>
                <div className="h-4 w-1/2 mx-auto bg-blue-100 rounded mb-2"></div>
                <div className="h-4 w-1/4 mx-auto bg-blue-100 rounded"></div>
                <div className="mt-4 text-blue-900 font-semibold">Loading...</div>
            </div>
        );
    }

    const {
        soap_notes = [],
        follow_up_tasks = [],
        medication_instructions = [],
        client_reminders = [],
        vet_todos = [],
        warnings = [],
    } = data;

    const paginatedTasks = (arr: any[]) => arr.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

    // Badge component for status/priority
    const Badge = ({ text, color }: { text: string, color: string }) => {
        let bg = 'bg-blue-100', txt = 'text-blue-800';
        if (color === 'red') { bg = 'bg-red-100'; txt = 'text-red-800'; }
        else if (color === 'yellow') { bg = 'bg-yellow-100'; txt = 'text-yellow-800'; }
        else if (color === 'green') { bg = 'bg-green-100'; txt = 'text-green-800'; }
        return <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${bg} ${txt} mr-2`}>{text}</span>;
    };

    // Table header cell
    const Th = ({ children }: { children: React.ReactNode }) => (
        <th className="px-4 py-2 bg-blue-50 text-blue-900 font-semibold text-sm uppercase tracking-wider border-b border-blue-100">{children}</th>
    );

    // Table data cell
    const Td = ({ children, ...props }: React.PropsWithChildren<React.TdHTMLAttributes<HTMLTableCellElement>>) => (
        <td className="px-4 py-2 border-b border-blue-50 text-sm" {...props}>{children}</td>
    );

    return (
        <div className="max-w-5xl mx-auto py-10 px-4">
            <div className="grid gap-8">
                {/* SOAP Notes */}
                <section className="bg-white rounded-2xl shadow-lg p-8 border border-blue-100">
                    <h2 className="text-3xl font-extrabold text-blue-900 mb-6 flex items-center gap-3">
                        <span className="inline-block w-2 h-8 bg-blue-400 rounded-full"></span>
                        <span role="img" aria-label="SOAP">🩺</span> SOAP Notes
                    </h2>
                    {soap_notes.length === 0 ? (
                        <div className="text-gray-400 italic mb-6">No SOAP notes found.</div>
                    ) : (
                        <div className="space-y-4">
                            {soap_notes.map((note, idx) => (
                                <div key={idx} className="border-l-4 border-blue-300 pl-4 bg-blue-50 rounded-lg shadow hover:shadow-xl transition">
                                    <div className="py-3">
                                        <span className="font-bold text-blue-800 text-lg">{note.note_type}</span>
                                        <span className="text-xs bg-blue-200 text-blue-700 px-2 py-1 rounded ml-2">{note.template_id || 'Default'}</span>
                                    </div>
                                    <div className="mt-3 text-base space-y-1">
                                        <div><span className="font-semibold">Subjective:</span> {note.subjective || <span className="text-gray-400">N/A</span>}</div>
                                        <div><span className="font-semibold">Objective:</span> {note.objective || <span className="text-gray-400">N/A</span>}</div>
                                        <div><span className="font-semibold">Assessment:</span> {note.assessment || <span className="text-gray-400">N/A</span>}</div>
                                        <div><span className="font-semibold">Plan:</span> {note.plan || <span className="text-gray-400">N/A</span>}</div>
                                        {note.discharge_summary && (
                                            <div className="mt-1"><span className="font-semibold">Discharge Summary:</span> {note.discharge_summary}</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Follow-Up Tasks */}
                <section className="bg-white rounded-2xl shadow-lg p-8 border border-blue-100">
                    <h2 className="text-3xl font-extrabold text-blue-900 mb-6 flex items-center gap-3">
                        <span className="inline-block w-2 h-8 bg-blue-400 rounded-full"></span>
                        <span role="img" aria-label="Follow-up">📝</span> Follow-Up Tasks
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white rounded-lg shadow">
                            <thead>
                                <tr>
                                    <Th>Description</Th>
                                    <Th>Due Date</Th>
                                    <Th>Assigned To</Th>
                                    <Th>Status</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedTasks(follow_up_tasks).length === 0 ? (
                                    <tr><Td colSpan={4}><span className="text-gray-400">No follow-up tasks.</span></Td></tr>
                                ) : paginatedTasks(follow_up_tasks).map((task, idx) => (
                                    <tr key={idx} className="hover:bg-blue-50 transition">
                                        <Td>{task.description}</Td>
                                        <Td>{task.due_date || <span className="text-gray-400">N/A</span>}</Td>
                                        <Td>{task.assigned_to || <span className="text-gray-400">N/A</span>}</Td>
                                        <Td><Badge text={task.status} color={task.status.toLowerCase() === 'completed' ? 'green' : task.status.toLowerCase() === 'pending' ? 'yellow' : 'red'} /></Td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {/* Pagination */}
                        {follow_up_tasks.length > rowsPerPage && (
                            <div className="flex justify-end mt-2">
                                <button
                                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-l disabled:opacity-50"
                                    onClick={() => setPage(page - 1)}
                                    disabled={page === 0}
                                >Prev</button>
                                <span className="px-4 py-1 bg-white border-t border-b border-blue-100">{page + 1} / {Math.ceil(follow_up_tasks.length / rowsPerPage)}</span>
                                <button
                                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-r disabled:opacity-50"
                                    onClick={() => setPage(page + 1)}
                                    disabled={page >= Math.ceil(follow_up_tasks.length / rowsPerPage) - 1}
                                >Next</button>
                            </div>
                        )}
                    </div>
                </section>

                {/* Medication Instructions */}
                <section className="bg-white rounded-2xl shadow-lg p-8 border border-blue-100">
                    <h2 className="text-3xl font-extrabold text-blue-900 mb-6 flex items-center gap-3">
                        <span className="inline-block w-2 h-8 bg-blue-400 rounded-full"></span>
                        <span role="img" aria-label="Medication">💊</span> Medication Instructions
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white rounded-lg shadow">
                            <thead>
                                <tr>
                                    <Th>Medication</Th>
                                    <Th>Dosage</Th>
                                    <Th>Frequency</Th>
                                    <Th>Duration</Th>
                                    <Th>Route</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedTasks(medication_instructions).length === 0 ? (
                                    <tr><Td colSpan={5}><span className="text-gray-400">No medication instructions.</span></Td></tr>
                                ) : paginatedTasks(medication_instructions).map((med, idx) => (
                                    <tr key={idx} className="hover:bg-blue-50 transition">
                                        <Td>{med.medication}</Td>
                                        <Td>{med.dosage}</Td>
                                        <Td>{med.frequency}</Td>
                                        <Td>{med.duration || <span className="text-gray-400">N/A</span>}</Td>
                                        <Td>{med.route || <span className="text-gray-400">N/A</span>}</Td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {medication_instructions.length > rowsPerPage && (
                            <div className="flex justify-end mt-2">
                                <button
                                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-l disabled:opacity-50"
                                    onClick={() => setPage(page - 1)}
                                    disabled={page === 0}
                                >Prev</button>
                                <span className="px-4 py-1 bg-white border-t border-b border-blue-100">{page + 1} / {Math.ceil(medication_instructions.length / rowsPerPage)}</span>
                                <button
                                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-r disabled:opacity-50"
                                    onClick={() => setPage(page + 1)}
                                    disabled={page >= Math.ceil(medication_instructions.length / rowsPerPage) - 1}
                                >Next</button>
                            </div>
                        )}
                    </div>
                </section>

                {/* Client Reminders */}
                <section className="bg-white rounded-2xl shadow-lg p-8 border border-blue-100">
                    <h2 className="text-3xl font-extrabold text-blue-900 mb-6 flex items-center gap-3">
                        <span className="inline-block w-2 h-8 bg-blue-400 rounded-full"></span>
                        <span role="img" aria-label="Reminder">⏰</span> Client Reminders
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white rounded-lg shadow">
                            <thead>
                                <tr>
                                    <Th>Description</Th>
                                    <Th>Priority</Th>
                                    <Th>Category</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedTasks(client_reminders).length === 0 ? (
                                    <tr><Td colSpan={3}><span className="text-gray-400">No client reminders.</span></Td></tr>
                                ) : paginatedTasks(client_reminders).map((reminder, idx) => (
                                    <tr key={idx} className="hover:bg-blue-50 transition">
                                        <Td>{reminder.description}</Td>
                                        <Td><Badge text={reminder.priority} color={reminder.priority.toLowerCase() === 'high' ? 'red' : reminder.priority.toLowerCase() === 'medium' ? 'yellow' : 'blue'} /></Td>
                                        <Td>{reminder.category}</Td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {client_reminders.length > rowsPerPage && (
                            <div className="flex justify-end mt-2">
                                <button
                                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-l disabled:opacity-50"
                                    onClick={() => setPage(page - 1)}
                                    disabled={page === 0}
                                >Prev</button>
                                <span className="px-4 py-1 bg-white border-t border-b border-blue-100">{page + 1} / {Math.ceil(client_reminders.length / rowsPerPage)}</span>
                                <button
                                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-r disabled:opacity-50"
                                    onClick={() => setPage(page + 1)}
                                    disabled={page >= Math.ceil(client_reminders.length / rowsPerPage) - 1}
                                >Next</button>
                            </div>
                        )}
                    </div>
                </section>

                {/* Veterinarian To-Dos */}
                <section className="bg-white rounded-2xl shadow-lg p-8 border border-blue-100">
                    <h2 className="text-3xl font-extrabold text-blue-900 mb-6 flex items-center gap-3">
                        <span className="inline-block w-2 h-8 bg-blue-400 rounded-full"></span>
                        <span role="img" aria-label="To-Do">📋</span> Veterinarian To-Dos
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white rounded-lg shadow">
                            <thead>
                                <tr>
                                    <Th>Description</Th>
                                    <Th>Due Date</Th>
                                    <Th>Status</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedTasks(vet_todos).length === 0 ? (
                                    <tr><Td colSpan={3}><span className="text-gray-400">No veterinarian to-dos.</span></Td></tr>
                                ) : paginatedTasks(vet_todos).map((todo, idx) => (
                                    <tr key={idx} className="hover:bg-blue-50 transition">
                                        <Td>{todo.description}</Td>
                                        <Td>{todo.due_date || <span className="text-gray-400">N/A</span>}</Td>
                                        <Td><Badge text={todo.status} color={todo.status.toLowerCase() === 'completed' ? 'green' : todo.status.toLowerCase() === 'pending' ? 'yellow' : 'red'} /></Td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {vet_todos.length > rowsPerPage && (
                            <div className="flex justify-end mt-2">
                                <button
                                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-l disabled:opacity-50"
                                    onClick={() => setPage(page - 1)}
                                    disabled={page === 0}
                                >Prev</button>
                                <span className="px-4 py-1 bg-white border-t border-b border-blue-100">{page + 1} / {Math.ceil(vet_todos.length / rowsPerPage)}</span>
                                <button
                                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-r disabled:opacity-50"
                                    onClick={() => setPage(page + 1)}
                                    disabled={page >= Math.ceil(vet_todos.length / rowsPerPage) - 1}
                                >Next</button>
                            </div>
                        )}
                    </div>
                </section>

                {/* Warnings */}
                <section className="bg-white rounded-2xl shadow-lg p-8 border border-blue-100">
                    <h2 className="text-3xl font-extrabold text-blue-900 mb-6 flex items-center gap-3">
                        <span className="inline-block w-2 h-8 bg-blue-400 rounded-full"></span>
                        <span role="img" aria-label="Warning">⚠️</span> Warnings
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white rounded-lg shadow">
                            <tbody>
                                {warnings.length ? (
                                    warnings.map((warning, idx) => (
                                        <tr key={idx}>
                                            <Td colSpan={3}><Badge text="Warning" color="red" />{warning}</Td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <Td colSpan={3}><span className="text-gray-400">No warnings</span></Td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default TaskDisplay;