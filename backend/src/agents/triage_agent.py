from src.agents.base_agent import BaseAgent
from src.models.schemas import TriageInput

class TriageAgent(BaseAgent):

    def __init__(self):
        super().__init__(
            did="did:zynd:agent_triage_abc123",
            name="Triage Agent"
        )

    def execute(self, payload: dict) -> dict:
        data = TriageInput(**payload)

        symptoms = data.symptoms
        vitals = data.vitals
        age = data.age

        severity = "GREEN"
        priority = 3
        risk = "Routine issue"
        specialists = ["general_physician"]

        if "chest_pain" in symptoms and age >= 60:
            severity = "RED"
            priority = 1
            risk = "CRITICAL - Possible cardiac event"
            specialists = ["cardiologist", "emergency_physician"]

        elif "severe_bleeding" in symptoms or "fracture" in symptoms:
            severity = "RED"
            priority = 1
            risk = "CRITICAL - Trauma"
            specialists = ["trauma_surgeon"]

        elif "fever" in symptoms or "moderate_pain" in symptoms:
            severity = "YELLOW"
            priority = 2
            risk = "Urgent but stable"
            specialists = ["general_physician"]

        return {
            **self._meta(),
            "severity": severity,
            "priority": priority,
            "estimated_risk": risk,
            "recommended_specialists": specialists
        }

    # ✅ Add this method so routes.py works
    def classify_emergency(self, payload: dict) -> dict:
        return self.execute(payload)
