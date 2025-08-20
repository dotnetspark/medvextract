import React, { useEffect, useState } from "react";
import axios from "axios";
import { AutoSizer, List, type ListRowProps } from "react-virtualized";
import { EntityCard } from "../components/EntityCard";
import { EntitySkeleton } from "../components/EntitySkeleton";
import { EntityDrawer } from "../components/EntityDrawer";
import { useTaskStore } from "../store";
import { FloatingActionButton } from "../components/FloatingActionButton";

const CARD_HEIGHT = 120; // Approximate fixed height of EntityCard including margin

export const Patients = () => {
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editing, setEditing] = useState<any>(null);

    const { query } = useTaskStore();

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        setLoading(true);
        try {
            const res = await axios.get("/api/patients");
            setPatients(res.data);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editing?.id) {
            await axios.put(`/api/patients/${editing.id}`, editing);
        } else {
            await axios.post(`/api/patients`, editing);
        }
        fetchPatients();
        setDrawerOpen(false);
    };

    const handleDelete = async (id: number) => {
        if (confirm("Are you sure you want to delete this patient?")) {
            await axios.delete(`/api/patients/${id}`);
            fetchPatients();
        }
    };

    const filteredPatients = patients.filter((p) =>
        [p.name, p.species, p.breed, p.owner_contact].some((field) =>
            field?.toLowerCase().includes(query.toLowerCase())
        )
    );

    // Row renderer for react-virtualized List
    const rowRenderer = ({ index, key, style }: ListRowProps) => {
        const patient = filteredPatients[index];
        return (
            <div key={key} style={style}>
                <EntityCard
                    avatar="🐶"
                    title={patient.name}
                    subtitle={`${patient.species || ""} ${patient.breed || ""}`}
                    onEdit={() => {
                        setEditing(patient);
                        setDrawerOpen(true);
                    }}
                    onDelete={() => handleDelete(patient.id)}
                />
            </div>
        );
    };

    return (
        <div className="p-6">
            <div className="flex justify-between mb-6">
                <h1 className="text-2xl font-bold">Patients</h1>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <EntitySkeleton key={i} />
                    ))}
                </div>
            ) : filteredPatients.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No Patients</p>
            ) : (
                <div style={{ height: 600 }}>
                    <AutoSizer>
                        {({ height, width }) => (
                            <List
                                height={height}
                                width={width}
                                rowCount={filteredPatients.length}
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
                    setEditing({ name: "", species: "", breed: "", owner_contact: "" });
                    setDrawerOpen(true);
                }}
            />

            <EntityDrawer
                title={editing?.id ? "Edit Patient" : "Add Patient"}
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
                    <label className="block text-sm font-medium mb-1">Species</label>
                    <input
                        type="text"
                        value={editing?.species || ""}
                        onChange={(e) => setEditing({ ...editing, species: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Breed</label>
                    <input
                        type="text"
                        value={editing?.breed || ""}
                        onChange={(e) => setEditing({ ...editing, breed: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Owner Contact</label>
                    <input
                        type="text"
                        value={editing?.owner_contact || ""}
                        onChange={(e) => setEditing({ ...editing, owner_contact: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2"
                    />
                </div>
            </EntityDrawer>
        </div>
    );
};