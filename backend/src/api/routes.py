from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel, Field
from typing import List

# Import your agents and services
from src.agents.triage_agent import TriageAgent
from src.agents.routing_agent import routing_agent
from src.agents.notification_agent import notification_agent
from src.agents.hospital_agent import hospital_agent
from src.services.maps_service import maps_service
from src.database.db import MOCK_HOSPITALS

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

class HospitalRequest(BaseModel):
    severity: str
    location: LocationData
    required_specialists: List[str]

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
    triage_result = triage_agent.execute(triage_input)

    # 2️⃣ Get address
    address = await maps_service.get_location_address(request.location.lat, request.location.lng)
    emergency_coords = (request.location.lat, request.location.lng)

    # 3️⃣ Find best hospital using routing agent
    best_hospital = await routing_agent.find_best_hospital(emergency_coords, MOCK_HOSPITALS)
    if not best_hospital:
        raise HTTPException(status_code=404, detail="No reachable hospitals found")

    # 4️⃣ Find top suitable hospitals using hospital agent
    top_hospitals = await hospital_agent.find_suitable_hospitals(
        severity=triage_result["severity"],
        location=emergency_coords,
        required_specialists=triage_result["recommended_specialists"],
        hospital_db=MOCK_HOSPITALS
    )

    # 5️⃣ Send notifications in background
    emergency_data = {
        "severity": triage_result["severity"],
        "priority": triage_result["priority"],
        "description": request.description,
        "address": address,
        "contact_email": request.contact_email
    }
    background_tasks.add_task(notification_agent.send_emergency_alert, emergency_data, best_hospital)

    # 6️⃣ Return full response
    return {
        "status": "success",
        "triage_result": triage_result,
        "assigned_hospital": best_hospital["name"],
        "eta_minutes": best_hospital["route_info"]["duration_min"],
        "top_hospitals": top_hospitals,
        "detected_address": address
    }


# --- Optional: Direct hospital query endpoint ---
@router.post("/hospitals")
async def get_hospitals(request: HospitalRequest):
    location_tuple = (request.location.lat, request.location.lng)
    
    suitable_hospitals = await hospital_agent.find_suitable_hospitals(
        severity=request.severity,
        location=location_tuple,
        required_specialists=request.required_specialists,
        hospital_db=MOCK_HOSPITALS
    )
    
    return {"hospitals": suitable_hospitals}
