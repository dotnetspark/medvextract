test extract_vet_tasks {
  functions [ExtractVetTasks]
  args {
    input {
      transcript "Dr. Lee: Hello, Mrs. Carter. How’s Fluffy’s appetite? Mrs. Carter: She’s been vomiting and not eating much. Dr. Lee: Okay, let’s examine her. [Exam] Fluffy’s dehydrated, mild fever. I’ll prescribe Cerenia 2 mg/kg once daily for 5 days, subcutaneous. Schedule a blood panel for next week. Monitor her water intake closely. I’ll update Ezyvet with these notes.",
      notes "Follow-up in 7 days. Export notes to Ezyvet.",
      metadata {
        patient_id "PET67890",
        consult_date "2025-07-15",
        veterinarian_id "VET123",
        clinic_id "CLIN456",
        template_id "SOAP_ER",
        language "en"
      }
    }
  }
}
