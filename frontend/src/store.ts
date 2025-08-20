import { create } from 'zustand';
import type { VetOutput } from './types/schemas';

interface TaskState {
    tasks: VetOutput | null;
    setTasks: (tasks: VetOutput) => void;

    query: string; // ✅ global search term
    setQuery: (q: string) => void;
}

export const useTaskStore = create<TaskState>((set) => ({
    tasks: null,
    setTasks: (tasks) => {
        console.log('Setting tasks:', tasks);
        set({ tasks });
    },

    query: '', // ✅ initial empty search string
    setQuery: (q) => set({ query: q }),
}));