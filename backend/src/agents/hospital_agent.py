from src.agents.base_agent import BaseAgent
from src.services.maps_service import maps_service

class HospitalAgent(BaseAgent):
    """Agent to select hospitals based on severity, availability, and distance."""

    def __init__(self):
        super().__init__(
            did="did:zynd:agent_hospital_xyz789",
            name="Hospital Agent"
        )

    async def find_suitable_hospitals(
        self,
        severity: str,
        location: tuple,
        required_specialists: list,
        hospital_db: list
    ):
        suitable_hospitals = []

        for hospital in hospital_db:
            # --- Filter by severity ---
            if severity == "RED" and hospital.get("icu_beds_available", 0) < 1:
                continue
            elif severity == "YELLOW" and hospital.get("emergency_beds_available", 0) < 1:
                continue
            # GREEN: any hospital is fine

            # --- Filter by specialists ---
            has_specialists = all(
                spec in hospital.get("specialists", []) for spec in required_specialists
            )
            if not has_specialists:
                continue

            # --- Get distance and ETA ---
            route_info = await maps_service.get_route_details(location, hospital["coords"])
            if not route_info:
                continue

            hospital_copy = hospital.copy()
            hospital_copy.update({
                "distance_km": route_info["distance_km"],
                "eta_minutes": route_info["duration_min"],
                "has_specialists": has_specialists
            })

            suitable_hospitals.append(hospital_copy)

        # --- Sort by distance and availability ---
        suitable_hospitals.sort(
            key=lambda x: (x.get("distance_km", 999), -(x.get("icu_beds_available", 0) + x.get("emergency_beds_available", 0)))
        )

        return suitable_hospitals[:5]

    # ✅ Implement abstract method from BaseAgent
    async def execute(self, payload: dict) -> list:
        """
        Executes hospital search.
        Expected payload:
        {
            "severity": "RED",
            "location": (lat, lng),
            "required_specialists": [...],
            "hospital_db": [...]
        }
        """
        return await self.find_suitable_hospitals(
            severity=payload["severity"],
            location=payload["location"],
            required_specialists=payload["required_specialists"],
            hospital_db=payload["hospital_db"]
        )


# Instantiate the agent
hospital_agent = HospitalAgent()
