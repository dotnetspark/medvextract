import { create } from 'zustand';
import type { VetOutput } from './types/schemas';

interface TaskState {
    tasks: VetOutput | null;
    setTasks: (tasks: VetOutput) => void;
}

export const useTaskStore = create<TaskState>((set) => ({
    tasks: null,
    setTasks: (tasks) => set({ tasks }),
}));