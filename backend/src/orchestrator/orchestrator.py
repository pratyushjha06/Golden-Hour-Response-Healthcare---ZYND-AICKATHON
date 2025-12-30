from fastapi import HTTPException
import uuid

from src.agents.triage_agent import TriageAgent
from src.agents.hospital_agent import hospital_agent
from src.agents.routing_agent import routing_agent
from src.agents.notification_agent import notification_agent
from src.services.maps_service import maps_service
from src.database.db import MOCK_HOSPITALS


class EmergencyOrchestrator:
    """
    Central coordinator that manages the emergency workflow:
    Triage → Hospital → Routing → Notification
    """

    def __init__(self):
        self.triage_agent = TriageAgent()

    async def handle_emergency(self, request, background_tasks):
        """
        Main orchestration function called by API layer
        """

        # Generate request ID (good practice)
        request_id = str(uuid.uuid4())

        # 1️⃣ TRIAGE AGENT
        triage_input = {
            "symptoms": request.symptoms,
            "vitals": request.vitals,
            "age": request.age
        }
        triage_result = self.triage_agent.execute(triage_input)

        # 2️⃣ GET ADDRESS FROM MAPS SERVICE
        address = await maps_service.get_location_address(
            request.location.lat,
            request.location.lng
        )
        emergency_coords = (request.location.lat, request.location.lng)

        # 3️⃣ HOSPITAL AGENT (Top suitable hospitals)
        top_hospitals = await hospital_agent.find_suitable_hospitals(
            severity=triage_result["severity"],
            location=emergency_coords,
            required_specialists=triage_result["recommended_specialists"],
            hospital_db=MOCK_HOSPITALS
        )

        if not top_hospitals:
            raise HTTPException(
                status_code=404,
                detail="No suitable hospitals found"
            )

        # 4️⃣ ROUTING AGENT (Best hospital by ETA)
        # Ensure routing agent receives clean coords input
        routing_candidates = [
            {
                "id": h["id"],
                "name": h["name"],
                "coords": h["coords"]
            }
            for h in top_hospitals
        ]

        best_hospital = await routing_agent.find_best_hospital(
            emergency_coords,
            routing_candidates
        )

        if not best_hospital:
            raise HTTPException(
                status_code=404,
                detail="No reachable hospitals found"
            )

        # 5️⃣ NOTIFICATION AGENT (Background task)
        emergency_data = {
            "severity": triage_result["severity"],
            "priority": triage_result["priority"],
            "description": request.description,
            "address": address,
            "contact_email": request.contact_email
        }

        background_tasks.add_task(
            notification_agent.send_emergency_alert,
            emergency_data,
            best_hospital
        )

        # 6️⃣ FINAL RESPONSE
        return {
            "request_id": request_id,
            "status": "success",
            "triage_result": triage_result,
            "assigned_hospital": best_hospital["name"],
            "eta_minutes": best_hospital["route_info"]["duration_min"],
            "top_hospitals": top_hospitals,
            "detected_address": address
        }


# Singleton orchestrator instance
orchestrator = EmergencyOrchestrator()
