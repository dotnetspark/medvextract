import React, { useState, useEffect } from "react";
import axios from "axios";
import { AutoSizer, List, type ListRowProps } from "react-virtualized";
import { useTaskStore } from "../store";
import { EntityDrawer } from "../components/EntityDrawer";
import { EntityCard } from "../components/EntityCard";

interface Transcript {
    id: number;
    task_id: string;
    transcript: string;
    notes?: string | null;
    result?: Record<string, any> | null;
    raw_result?: Record<string, any> | null;
    meta_extra?: Record<string, any> | null;
    status: string;
    error_message?: string | null;
    consult_date?: string | null;
    language?: string | null;
    template_id?: string | null;
    patient_id?: number;
    veterinarian_id?: string;
    clinic_id?: string;
    patient_name?: string | null;
    veterinarian_name?: string | null;
    clinic_name?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
}

const CARD_HEIGHT = 100; // Match EntityCard height

const SkeletonCard = () => (
    <div className="animate-pulse bg-white rounded-xl shadow-md p-5 space-y-3 h-[120px]">
        <div className="h-5 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
    </div>
);

const Transcripts: React.FC = () => {
    const [transcripts, setTranscripts] = useState<Transcript[]>([]);
    const [loading, setLoading] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editing, setEditing] = useState<Transcript | null>(null);
    const [transcriptText, setTranscriptText] = useState("");
    const [notesText, setNotesText] = useState("");
    const [templateId, setTemplateId] = useState("SOAP_ER");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { query } = useTaskStore();


    useEffect(() => {
        fetchData();
    }, []);

    // Debug drawer state
    useEffect(() => {
        console.log("Drawer open:", drawerOpen, "Editing:", editing);
    }, [drawerOpen, editing]);

    useEffect(() => {
        if (editing) {
            setTranscriptText(editing.transcript || "");
            setNotesText(editing.notes || "");
            setTemplateId(editing.template_id || "SOAP_ER");
        } else {
            setTranscriptText("");
            setNotesText("");
            setTemplateId("SOAP_ER");
        }
        setError(null);
        setIsSubmitting(false);
    }, [editing]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await axios.get("/api/transcripts");
            setTranscripts(res.data);
        } catch (err) {
            console.error("Error fetching transcripts:", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredTranscripts = transcripts.filter((t) =>
        [t.patient_name, t.veterinarian_name, t.transcript]
            .some((field) => field?.toLowerCase().includes(query.toLowerCase()))
    );

    // react-virtualized row renderer using EntityCard
    const rowRenderer = ({ index, key, style }: ListRowProps) => {
        const t = filteredTranscripts[index];
        return (
            <div key={key} style={style}>
                <EntityCard
                    avatar="🐶"
                    title={t.patient_name || "Unknown"}
                    subtitle={t.veterinarian_name || "Unknown"}
                    onEdit={() => {
                        setEditing(t);
                        setDrawerOpen(true);
                    }}
                    status={t.status}
                />
            </div>
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);
        try {
            const payload = {
                transcript: transcriptText,
                notes: notesText,
                template_id: templateId,
            };
            if (editing?.id) {
                await axios.put(`/api/transcripts/${editing.id}`, payload);
            } else {
                await axios.post(`/api/transcripts`, payload);
            }
            await fetchData();
            setDrawerOpen(false);
            setEditing(null);
            console.log("Drawer closed after submit");
        } catch (err: any) {
            console.error("Error submitting form:", err);
            setError(err.response?.data?.detail || "Failed to submit transcript.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between mb-6">
                <h1 className="text-2xl font-bold">Transcripts</h1>
            </div>

            {/* Loading and Empty state */}
            {loading ? (
                <div className="space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            ) : filteredTranscripts.length === 0 ? (
                <div className="text-gray-500 text-center py-8">No Transcripts</div>
            ) : (
                <div style={{ height: 720 }}>
                    <AutoSizer>
                        {({ height, width }) => (
                            <List
                                height={height}
                                width={width}
                                rowCount={filteredTranscripts.length}
                                rowHeight={CARD_HEIGHT}
                                rowRenderer={rowRenderer}
                                overscanRowCount={3}
                            />
                        )}
                    </AutoSizer>
                </div>
            )}

            {/* Floating action button to open drawer for new transcript */}
            <button
                onClick={() => {
                    setEditing(null);
                    setDrawerOpen(true);
                }}
                className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg transition transform hover:rotate-90"
                title="Add Transcript"
            >
                +
            </button>

            {/* Drawer (now using EntityDrawer) */}
            <EntityDrawer
                title={editing ? "Edit Transcript" : "Add Transcript"}
                isOpen={drawerOpen}
                onClose={() => {
                    setDrawerOpen(false);
                    setEditing(null);
                    setError(null);
                    console.log("Drawer closed by onClose");
                }}
                onSubmit={handleSubmit}
                isSaving={isSubmitting}
            >
                <div>
                    <label htmlFor="templateId" className="block text-blue-900 font-semibold mb-2">
                        SOAP Template
                    </label>
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
                <div>
                    <label htmlFor="transcript" className="block text-blue-900 font-semibold mb-2">
                        Consult Transcript
                    </label>
                    <textarea
                        id="transcript"
                        rows={6}
                        value={transcriptText}
                        onChange={(e) => setTranscriptText(e.target.value)}
                        required
                        placeholder="Paste or type the consult transcript here..."
                        className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-gray-400"
                    />
                </div>
                <div>
                    <label htmlFor="notes" className="block text-blue-900 font-semibold mb-2">
                        Additional Notes
                    </label>
                    <textarea
                        id="notes"
                        rows={2}
                        value={notesText}
                        onChange={(e) => setNotesText(e.target.value)}
                        placeholder="Any extra notes for the transcript..."
                        className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-gray-400"
                    />
                </div>
                {error && (
                    <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 text-center flex items-center gap-2">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-5 h-5 text-red-600"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
                        </svg>
                        {error}
                    </div>
                )}
            </EntityDrawer>
        </div>
    );
};

export default Transcripts;