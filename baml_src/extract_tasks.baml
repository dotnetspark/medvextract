// Input schema for veterinary transcripts
class VetInput {
  transcript string // Veterinary consult dialogue
  notes string? // Optional clinician notes
  patient_id string // Pet ID
  consult_date string // ISO 8601
  veterinarian_id string
  clinic_id string // For multi-clinic enterprises
  template_id string // Selected SOAP template
  language string // e.g., "en", "es" for multilingual support
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
    You are an AI veterinary scribe, like VetRec, tasked with analyzing a veterinary consult transcript and optional notes to generate structured outputs, including SOAP notes, tasks, and reminders.

    ## Goals
    1. **SOAP Notes** – Produce Subjective, Objective, Assessment, and Plan sections, plus optional Discharge Summaries for owners, in the specified template and language.
    2. **Follow-up Tasks** – Identify specific actions such as scheduling diagnostics or procedures.
    3. **Medication Instructions** – List prescribed medications with dosage, route, frequency, and other pertinent details.
    4. **Client-Facing Reminders** – Owner instructions, categorized by priority and type.
    5. **Vet To-Dos** – Internal clinician/admin actions (e.g., PiMS exports, referrals).
    6. **Warnings** – Flag any ambiguous, incomplete, or inconsistent data.

    ## Instructions
    - Analyze the full transcript text:
      Transcript: `{{ input.transcript }}`
    - Use supplementary clinician notes if available:
      Notes: `{{ input.notes or 'None' }}`
    - Use the following **context fields** directly for grounding:
      • Patient ID: {{ input.patient_id }}
      • Consult Date: {{ input.consult_date }}
      • Veterinarian ID: {{ input.veterinarian_id }}
      • Clinic ID: {{ input.clinic_id }}
      • Template ID: {{ input.template_id }}
      • Language: {{ input.language or 'en' }}

    - Generate SOAP notes in the target language (default: English), ensuring:
      • Veterinary-accurate terminology for professional sections.
      • Layman-friendly terms for discharge summaries.
    - Categorize all tasks precisely. If ambiguous, choose the most specific category and note it under Warnings.
    - For due dates, convert relative terms like “next week” into ISO 8601 format based on `consult_date`.
    - Set task statuses to `"PENDING"` unless explicitly stated.
    - Retain empty arrays (`[]`) for any list fields with no items.
    - If any needed context is missing from the structured fields, default to `"Unknown"` rather than fabricating data.

    ## Output Format
    {{ ctx.output_format }}
  "#
}