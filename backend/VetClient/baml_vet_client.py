from backend.VetClient import baml_env
from baml_client.async_client import b
from backend.models.schemas import VetInput, VetOutput


class baml_vet_client:
    def __init__(self):
        self.baml = b

    async def extract_vet_tasks(self, input: VetInput) -> VetOutput:
        try:
            result = await self.baml.ExtractVetTasks(input=input)
            return result
        except Exception as e:
            raise Exception(f"extract_vet_tasks task failed: {str(e)}")
