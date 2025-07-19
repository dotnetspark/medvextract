// Input schema for veterinary transcripts
class VetInput {
  transcript string // Veterinary consult dialogue
  notes string? // Optional clinician notes
  metadata VetMetadata // Metadata as a separate class
}

class VetMetadata {
  patient_id string? // Pet ID
  consult_date string? // ISO 8601
  veterinarian_id string?
  clinic_id string? // For multi-clinic enterprises
  template_id string? // Selected SOAP template
  language string? // e.g., "en", "es" for multilingual support
}

// Enums for veterinary-specific fields
enum TaskStatus {
  PENDING
  COMPLETED
  CANCELLED
}

enum MedicationRoute {
  ORAL
  TOPICAL
  INTRAVENOUS
  SUBCUTANEOUS
  OTHER
}

enum NoteType {
  SOAP
  DISCHARGE
  SHIFT_SUMMARY
}

enum ReminderPriority {
  High
  Medium
  Low
}

enum ReminderCategory {
  Lifestyle
  Medication
  Appointment
  Other
}

// Output schemas
class FollowUpTask {
  description string @check(length_check, {{ this|length >= 5 and this|length <= 200 }}) // e.g., "Schedule dental cleaning"
  due_date string? // optional
  assigned_to string? // e.g., "Owner", "Vet Tech"
  status TaskStatus
  context string? // e.g., "Dental health"
}

class MedicationInstruction {
  medication string @check(medication_length, {{ this|length >= 2 and this|length <= 100 }}) // e.g., "Amoxicillin"
  dosage string @check(dosage_length, {{ this|length >= 2 and this|length <= 50 }}) @check(vet_units, {{ this|regex_match("^[0-9]+\\s*(mg/kg|g/ml|ml|units).*") }}) // e.g., "10 mg/kg"
  frequency string // e.g., "Twice daily"
  duration string? // e.g., "7 days"
  route MedicationRoute? // optional
  conditions string? // e.g., "Give with food"
}

class ClientReminder {
  description string @check(length_check, {{ this|length >= 5 and this|length <= 200 }}) // e.g., "Monitor for vomiting"
  priority ReminderPriority
  category ReminderCategory
}

class VetToDo {
  description string @check(length_check, {{ this|length >= 5 and this|length <= 200 }}) // e.g., "Export notes to Ezyvet"
  due_date string? // optional
  status TaskStatus
  related_task_id string? // optional
}

class SOAPNote {
  subjective string @check(subjective_length, {{ this|length >= 10 and this|length <= 1000 }}) // Client-reported symptoms
  objective string // Exam findings
  assessment string // Diagnosis or differential
  plan string // Treatment plan
  note_type NoteType
  template_id string? // Links to VetRec template
  discharge_summary string? // Client-friendly summary
}

class VetOutput {
  follow_up_tasks FollowUpTask[]
  medication_instructions MedicationInstruction[]
  client_reminders ClientReminder[]
  vet_todos VetToDo[]
  soap_notes SOAPNote[]
  warnings string[] // e.g., "Ambiguous dosage detected"
}


function ExtractVetTasks(input: VetInput) -> VetOutput {
  client CustomGPT4o
  prompt #"
    You are an AI veterinary scribe, like VetRec, tasked with analyzing a veterinary consult transcript and optional notes to generate structured outputs, including SOAP notes, tasks, and reminders. Your goal is to:

    1. **SOAP Notes**: Generate veterinary SOAP notes (Subjective, Objective, Assessment, Plan) and optional discharge summaries in client-friendly language, using the specified template_id if provided.
    2. **Follow-up Tasks**: Extract actions like scheduling appointments or diagnostics.
    3. **Medication Instructions**: Extract medication details, including veterinary-specific routes (e.g., subcutaneous).
    4. **Client-Facing Reminders**: Extract owner actions, categorized by type.
    5. **Vet To-Dos**: Extract veterinarian tasks, like PiMS exports or referrals.
    6. **Warnings**: Flag ambiguous or incomplete data.

    **Instructions**:
    - Analyze the transcript (`{{ input.transcript }}`) and notes (`{{ input.notes or 'None' }}`).
    - Use metadata (`{{ input.metadata }}`) for context (e.g., patient_id, template_id, language).
    - Generate SOAP notes in the specified language (default: English) with veterinary terminology for professional notes and layman terms for discharge summaries.
    - Categorize tasks strictly; if ambiguous, choose the most specific category and add a warning.
    - Use ISO 8601 for due dates, estimating from phrases like 'next week' using consult_date.
    - Set status to 'PENDING' unless specified.
    - Support PiMS integration by flagging exportable tasks.
    - Return empty lists for categories with no items.

    **Input**:
    Transcript: {{ input.transcript }}
    Notes: {{ input.notes or 'None' }}
    Metadata: {{ input.metadata }}

    **Output Format**:
    {{ ctx.output_format }}
  "#
}