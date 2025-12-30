from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel, Field
from typing import List

# Import your agents and services
from src.agents.triage_agent import TriageAgent
from src.agents.routing_agent import routing_agent
from src.agents.notification_agent import notification_agent
from src.services.maps_service import maps_service

router = APIRouter()

# --- Request Models ---
class LocationData(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)

class EmergencyRequest(BaseModel):
    location: LocationData
    symptoms: List[str]
    vitals: dict
    age: int
    description: str
    contact_email: str

# --- Mock Hospitals ---
MOCK_HOSPITALS = [
    {"id": 1, "name": "City General Hospital", "coords": (28.7041, 77.1025)},
    {"id": 2, "name": "AIIMS Trauma Center", "coords": (28.5650, 77.2060)},
    {"id": 3, "name": "Max Super Specialty", "coords": (28.5744, 77.2343)}
]

# --- Initialize Triage Agent ---
triage_agent = TriageAgent()

# --- Endpoints ---
@router.post("/emergency")
async def create_emergency(request: EmergencyRequest, background_tasks: BackgroundTasks):
    # 1️⃣ Run triage agent
    triage_input = {
        "symptoms": request.symptoms,
        "vitals": request.vitals,
        "age": request.age
    }
    triage_result = triage_agent.classify_emergency(triage_input)

    # 2️⃣ Get address
    address = await maps_service.get_location_address(request.location.lat, request.location.lng)

    # 3️⃣ Find best hospital
    emergency_coords = (request.location.lat, request.location.lng)
    best_hospital = await routing_agent.find_best_hospital(emergency_coords, MOCK_HOSPITALS)
    if not best_hospital:
        raise HTTPException(status_code=404, detail="No reachable hospitals found")

    # 4️⃣ Send notifications in background
    emergency_data = {
        "severity": triage_result["severity"],
        "priority": triage_result["priority"],
        "description": request.description,
        "address": address,
        "contact_email": request.contact_email
    }
    background_tasks.add_task(notification_agent.send_emergency_alert, emergency_data, best_hospital)

    # 5️⃣ Return full response
    return {
        "status": "success",
        "triage_result": triage_result,
        "assigned_hospital": best_hospital["name"],
        "eta_minutes": best_hospital["route_info"]["duration_min"],
        "detected_address": address
    }
