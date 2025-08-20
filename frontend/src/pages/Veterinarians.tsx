import React, { useEffect, useState } from "react";
import axios from "axios";
import { AutoSizer, List, type ListRowProps } from "react-virtualized";
import { EntityCard } from "../components/EntityCard";
import { EntitySkeleton } from "../components/EntitySkeleton";
import { EntityDrawer } from "../components/EntityDrawer";
import { useTaskStore } from "../store";
import { FloatingActionButton } from "../components/FloatingActionButton";

const CARD_HEIGHT = 100; // Approximate card height

export const Veterinarians = () => {
    const [vets, setVets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editing, setEditing] = useState<any>(null);

    const { query } = useTaskStore();

    useEffect(() => {
        fetchVeterinarians();
    }, []);

    const fetchVeterinarians = async () => {
        setLoading(true);
        try {
            const res = await axios.get("/api/veterinarians");
            setVets(res.data);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editing?.id) {
            await axios.put(`/api/veterinarians/${editing.id}`, editing);
        } else {
            await axios.post(`/api/veterinarians`, editing);
        }
        fetchVeterinarians();
        setDrawerOpen(false);
    };

    const handleDelete = async (id: number) => {
        if (confirm("Are you sure you want to delete this veterinarian?")) {
            await axios.delete(`/api/veterinarians/${id}`);
            fetchVeterinarians();
        }
    };

    const filteredVets = vets.filter((v) =>
        [v.name, v.specialization, v.email].some((field) =>
            field?.toLowerCase().includes(query.toLowerCase())
        )
    );

    // react-virtualized row renderer
    const rowRenderer = ({ index, key, style }: ListRowProps) => {
        const vet = filteredVets[index];
        return (
            <div key={key} style={style}>
                <EntityCard
                    avatar="👩‍⚕️"
                    title={vet.name}
                    subtitle={vet.specialization || vet.email}
                    onEdit={() => {
                        setEditing(vet);
                        setDrawerOpen(true);
                    }}
                    onDelete={() => handleDelete(vet.id)}
                />
            </div>
        );
    };

    return (
        <div className="p-6">
            <div className="flex justify-between mb-6">
                <h1 className="text-2xl font-bold">Veterinarians</h1>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <EntitySkeleton key={i} />
                    ))}
                </div>
            ) : filteredVets.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No Veterinarians</p>
            ) : (
                <div style={{ height: 600 }}>
                    <AutoSizer>
                        {({ height, width }) => (
                            <List
                                height={height}
                                width={width}
                                rowCount={filteredVets.length}
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
                    setEditing({ name: "", specialization: "", email: "" });
                    setDrawerOpen(true);
                }}
            />

            <EntityDrawer
                title={editing?.id ? "Edit Veterinarian" : "Add Veterinarian"}
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
                    <label className="block text-sm font-medium mb-1">Specialization</label>
                    <input
                        type="text"
                        value={editing?.specialization || ""}
                        onChange={(e) => setEditing({ ...editing, specialization: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                        type="email"
                        value={editing?.email || ""}
                        onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2"
                    />
                </div>
            </EntityDrawer>
        </div>
    );
};