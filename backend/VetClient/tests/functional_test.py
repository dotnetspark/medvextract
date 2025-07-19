# test_baml_vet_client.py

from backend.VetClient.baml_vet_client import baml_vet_client
from backend.models.schemas import VetInput
import asyncio

# Mock/test data
test_input = VetInput(
    transcript="Dr. Kim: Bella’s limping today. I’ll prescribe Rimadyl. Come back in 5 days.",
    notes="Schedule recheck for Bella.",
    metadata={
        "patient_id": "PET12345",
        "consult_date": "2025-07-18",
        "veterinarian_id": "VET789",
        "clinic_id": "CLIN321",
        "template_id": "SOAP_ER",
        "language": "en"
    }
)


async def run_test():
    client = baml_vet_client()
    try:
        output = await client.extract_vet_tasks(test_input)
        print("✅ Output:", output)
    except Exception as e:
        print("❌ Error:", str(e))

if __name__ == "__main__":
    asyncio.run(run_test())
