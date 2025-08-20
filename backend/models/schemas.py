from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import date, datetime
from enum import Enum


# ---------------------------
# Enums (match DB + API values)
# ---------------------------
class Priority(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class TaskStatus(str, Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class MedicationRoute(str, Enum):
    ORAL = "ORAL"
    TOPICAL = "TOPICAL"
    INTRAVENOUS = "INTRAVENOUS"
    SUBCUTANEOUS = "SUBCUTANEOUS"
    OTHER = "OTHER"


class NoteType(str, Enum):
    SOAP = "SOAP"
    DISCHARGE = "DISCHARGE"
    SHIFT_SUMMARY = "SHIFT_SUMMARY"


class ReminderCategory(str, Enum):
    LIFESTYLE = "LIFESTYLE"
    MEDICATION = "MEDICATION"
    APPOINTMENT = "APPOINTMENT"
    OTHER = "OTHER"


# ---------------------------
# Output Component Models
# ---------------------------
class FollowUpTask(BaseModel):
    description: str
    due_date: Optional[date] = None
    assigned_to: Optional[str] = None
    status: TaskStatus
    context: Optional[str] = None

    model_config = ConfigDict(
        json_schema_extra={"example": {
            "description": "Schedule blood panel for Fluffy",
            "due_date": "2025-07-22",
            "assigned_to": "Owner",
            "status": "PENDING",
            "context": "Vomiting and dehydration"
        }}
    )


class MedicationInstruction(BaseModel):
    medication: str
    dosage: str
    frequency: str
    duration: Optional[str] = None
    route: Optional[MedicationRoute] = None
    conditions: Optional[str] = None

    model_config = ConfigDict(
        json_schema_extra={"example": {
            "medication": "Cerenia",
            "dosage": "2 mg/kg",
            "frequency": "Once daily",
            "duration": "5 days",
            "route": "SUBCUTANEOUS",
            "conditions": None
        }}
    )


class ClientReminder(BaseModel):
    description: str
    priority: Priority
    category: ReminderCategory

    model_config = ConfigDict(
        json_schema_extra={"example": {
            "description": "Monitor Fluffy’s water intake closely",
            "priority": "HIGH",
            "category": "LIFESTYLE"
        }}
    )


class VetToDo(BaseModel):
    description: str
    due_date: Optional[date] = None
    status: TaskStatus
    related_task_id: Optional[str] = None

    model_config = ConfigDict(
        json_schema_extra={"example": {
            "description": "Export notes to Ezyvet",
            "due_date": "2025-07-16",
            "status": "PENDING",
            "related_task_id": None
        }}
    )


class SOAPNote(BaseModel):
    subjective: str
    objective: str
    assessment: str
    plan: str
    note_type: NoteType
    template_id: Optional[str] = None
    discharge_summary: Optional[str] = None

    model_config = ConfigDict(
        json_schema_extra={"example": {
            "subjective": "Owner reports Fluffy has been vomiting and has reduced appetite.",
            "objective": "Dehydrated, mild fever detected during exam.",
            "assessment": "Suspected gastroenteritis, dehydration.",
            "plan": "Prescribe Cerenia 2 mg/kg once daily for 5 days, subcutaneous. Schedule blood panel next week.",
            "note_type": "SOAP",
            "template_id": "SOAP_ER",
            "discharge_summary": "Give Fluffy Cerenia as prescribed to help with vomiting. Ensure she drinks water and schedule a blood test for next week."
        }}
    )


# ---------------------------
# Output Model
# ---------------------------
class VetOutput(BaseModel):
    follow_up_tasks: List[FollowUpTask]
    medication_instructions: List[MedicationInstruction]
    client_reminders: List[ClientReminder]
    vet_todos: List[VetToDo]
    soap_notes: List[SOAPNote]
    warnings: List[str]

    model_config = ConfigDict(
        json_schema_extra={"example": {
            "follow_up_tasks": [{
                "description": "Schedule blood panel for Fluffy",
                "due_date": "2025-07-22",
                "assigned_to": "Owner",
                "status": "PENDING",
                "context": "Vomiting and dehydration"
            }],
            "medication_instructions": [{
                "medication": "Cerenia",
                "dosage": "2 mg/kg",
                "frequency": "Once daily",
                "duration": "5 days",
                "route": "SUBCUTANEOUS",
                "conditions": None
            }],
            "client_reminders": [{
                "description": "Monitor Fluffy’s water intake closely",
                "priority": "HIGH",
                "category": "LIFESTYLE"
            }],
            "vet_todos": [{
                "description": "Export notes to Ezyvet",
                "due_date": "2025-07-16",
                "status": "PENDING",
                "related_task_id": None
            }],
            "soap_notes": [{
                "subjective": "Owner reports Fluffy has been vomiting and has reduced appetite.",
                "objective": "Dehydrated, mild fever detected during exam.",
                "assessment": "Suspected gastroenteritis, dehydration.",
                "plan": "Prescribe Cerenia 2 mg/kg once daily for 5 days, subcutaneous. Schedule blood panel next week.",
                "note_type": "SOAP",
                "template_id": "SOAP_ER",
                "discharge_summary": "Give Fluffy Cerenia as prescribed to help with vomiting. Ensure she drinks water and schedule a blood test for next week."
            }],
            "warnings": []
        }}
    )


# ---------------------------
# Input Model
# ---------------------------
class VetInput(BaseModel):
    transcript: str
    notes: Optional[str] = None
    patient_id: str  # matches DB: clinic/vet/patient IDs are String except Patient PK is int
    consult_date: date
    veterinarian_id: str
    clinic_id: str
    template_id: str
    language: str

    model_config = ConfigDict(
        json_schema_extra={"example": {
            "transcript": "Dr. Lee: Hello, Mrs. Carter. How’s Fluffy’s appetite? ...",
            "notes": "Follow-up in 7 days. Export notes to Ezyvet.",
            "patient_id": "PET67890",
            "consult_date": "2025-07-15",
            "veterinarian_id": "VET123",
            "clinic_id": "CLIN456",
            "template_id": "SOAP_ER",
            "language": "EN"
        }}
    )
