export type Priority = 'high' | 'medium' | 'low';

export type TaskStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export type MedicationRoute = 'ORAL' | 'TOPICAL' | 'INTRAVENOUS' | 'SUBCUTANEOUS' | 'OTHER';

export type NoteType = 'SOAP' | 'DISCHARGE' | 'SHIFT_SUMMARY';

export interface FollowUpTask {
    description: string;
    due_date?: string | null;
    assigned_to?: string | null;
    status: TaskStatus;
    context?: string | null;
}

export interface MedicationInstruction {
    medication: string;
    dosage: string;
    frequency: string;
    duration?: string | null;
    route?: MedicationRoute | null;
    conditions?: string | null;
}

export interface ClientReminder {
    description: string;
    priority: Priority;
    category: string;
}

export interface VetToDo {
    description: string;
    due_date?: string | null;
    status: TaskStatus;
    related_task_id?: string | null;
}

export interface SOAPNote {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
    note_type: NoteType;
    template_id?: string | null;
    discharge_summary?: string | null;
}

export interface VetOutput {
    follow_up_tasks: FollowUpTask[];
    medication_instructions: MedicationInstruction[];
    client_reminders: ClientReminder[];
    vet_todos: VetToDo[];
    soap_notes: SOAPNote[];
    warnings: string[];
}

export interface VetInput {
    transcript: string;
    notes?: string | null;
    metadata?: {
        patient_id?: string | null;
        consult_date?: string | null;
        veterinarian_id?: string | null;
        clinic_id?: string | null;
        template_id?: string | null;
        language?: string | null;
    };
}