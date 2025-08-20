import React, { useEffect, useState } from "react";
import axios from "axios";
import { AutoSizer, List, type ListRowProps } from "react-virtualized";
import { EntityCard } from "../components/EntityCard";
import { EntitySkeleton } from "../components/EntitySkeleton";
import { EntityDrawer } from "../components/EntityDrawer";
import { useTaskStore } from "../store";
import { FloatingActionButton } from "../components/FloatingActionButton";

const CARD_HEIGHT = 100; // Approximate card height - adjust to match your EntityCard styling

export const Clinics = () => {
    const [clinics, setClinics] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editing, setEditing] = useState<any>(null);

    const { query } = useTaskStore();

    useEffect(() => {
        fetchClinics();
    }, []);

    const fetchClinics = async () => {
        setLoading(true);
        try {
            const res = await axios.get("/api/clinics");
            setClinics(res.data);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editing?.id) {
            await axios.put(`/api/clinics/${editing.id}`, editing);
        } else {
            await axios.post(`/api/clinics`, editing);
        }
        fetchClinics();
        setDrawerOpen(false);
    };

    const handleDelete = async (id: number) => {
        if (confirm("Are you sure you want to delete this clinic?")) {
            await axios.delete(`/api/clinics/${id}`);
            fetchClinics();
        }
    };

    const filteredClinics = clinics.filter((c) =>
        [c.name, c.location].some(
            (field) => field?.toLowerCase().includes(query.toLowerCase())
        )
    );

    // react-virtualized row renderer
    const rowRenderer = ({ index, key, style }: ListRowProps) => {
        const clinic = filteredClinics[index];
        return (
            <div key={key} style={style}>
                <EntityCard
                    avatar="🏥"
                    title={clinic.name}
                    subtitle={clinic.location}
                    onEdit={() => {
                        setEditing(clinic);
                        setDrawerOpen(true);
                    }}
                    onDelete={() => handleDelete(clinic.id)}
                />
            </div>
        );
    };

    return (
        <div className="p-6">
            <div className="flex justify-between mb-6">
                <h1 className="text-2xl font-bold">Clinics</h1>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <EntitySkeleton key={i} />
                    ))}
                </div>
            ) : filteredClinics.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No Clinics</p>
            ) : (
                <div style={{ height: 600 }}>
                    <AutoSizer>
                        {({ height, width }) => (
                            <List
                                height={height}
                                width={width}
                                rowCount={filteredClinics.length}
                                rowHeight={CARD_HEIGHT}
                                rowRenderer={rowRenderer}
                                overscanRowCount={3}
                            />
                        )}
                    </AutoSizer>
                </div>
            )}

            <FloatingActionButton
                onClick={() => {
                    setEditing({ name: "", location: "" });
                    setDrawerOpen(true);
                }}
            />

            <EntityDrawer
                title={editing?.id ? "Edit Clinic" : "Add Clinic"}
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                onSubmit={handleSubmit}
            >
                <div>
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <input
                        type="text"
                        value={editing?.name || ""}
                        onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Location</label>
                    <input
                        type="text"
                        value={editing?.location || ""}
                        onChange={(e) => setEditing({ ...editing, location: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2"
                    />
                </div>
            </EntityDrawer>
        </div>
    );
};