import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, useMap } from 'react-leaflet';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useTriageEmergency } from '../hooks/useTriageEmergency';
import { useEmergencyStatus } from '../hooks/useEmergencyStatus';


// Fix for default marker icon issue in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});


// Component to update map center dynamically
function ChangeMapView({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 13, {
        animate: true,
        duration: 1
      });
    }
  }, [center, zoom, map]);
  
  return null;
}


// Component to handle map clicks
function LocationMarker({ position, setPosition, setFormData, formData }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition({ lat, lng });
      setFormData({
        ...formData,
        latitude: lat.toString(),
        longitude: lng.toString(),
        address: `Selected: ${lat.toFixed(4)}, ${lng.toFixed(4)}`
      });
    },
  });


  return position === null ? null : (
    <Marker position={position}>
      <Popup>Selected Location</Popup>
    </Marker>
  );
}


export default function EmergencyForm({ onEmergencyCreated }) {
  const navigate = useNavigate();
  const [emergencyId, setEmergencyId] = useState(null);
  
  const [formData, setFormData] = useState({
    patientName: '',
    age: '',
    gender: '',
    contact: '',
    bloodPressure: '',
    heartRate: '',
    oxygenLevel: '',
    symptoms: '',
    latitude: '',
    longitude: '',
    address: ''
  });


  const [showMap, setShowMap] = useState(false);
  const [mapCenter, setMapCenter] = useState([28.7041, 77.1025]); // Default: Delhi
  const [markerPosition, setMarkerPosition] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Symptoms autocomplete state
  const [symptomInput, setSymptomInput] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [symptomSuggestions, setSuggestionSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState(null);
const [isLocating, setIsLocating] = useState(false);



  // Comprehensive symptoms database
  const symptomsDatabase = [
    // A
    'Abdominal pain', 'Abdominal swelling', 'Acid reflux', 'Acne', 'Agitation', 'Allergic reaction', 'Ankle swelling', 'Anxiety', 'Arm pain', 'Arm weakness',
    // B
    'Back pain', 'Bleeding', 'Blisters', 'Bloating', 'Blood in stool', 'Blood in urine', 'Blurred vision', 'Body aches', 'Bone pain', 'Breast lump', 'Breathing difficulty', 'Bruising', 'Burning sensation',
    // C
    'Chest pain', 'Chest tightness', 'Chills', 'Chronic fatigue', 'Cold hands and feet', 'Cold sweats', 'Confusion', 'Congestion', 'Constipation', 'Cough', 'Coughing up blood', 'Cramps', 'Crying spells',
    // D
    'Decreased appetite', 'Dehydration', 'Depression', 'Diarrhea', 'Difficulty concentrating', 'Difficulty sleeping', 'Difficulty swallowing', 'Discharge', 'Dizziness', 'Double vision', 'Drowsiness', 'Dry mouth', 'Dry skin',
    // E
    'Ear pain', 'Ear ringing', 'Excessive sweating', 'Excessive thirst', 'Eye pain', 'Eye redness', 'Eye swelling',
    // F
    'Facial pain', 'Facial swelling', 'Fainting', 'Fatigue', 'Fever', 'Fluid retention', 'Flushing', 'Foot pain', 'Forgetfulness', 'Frequent urination',
    // G
    'Gas', 'Groin pain', 'Gum bleeding',
    // H
    'Hair loss', 'Hallucinations', 'Hand numbness', 'Hand tremors', 'Headache', 'Hearing loss', 'Heart palpitations', 'Heartburn', 'Heavy menstrual bleeding', 'High blood pressure', 'Hiccups', 'Hip pain', 'Hives', 'Hoarseness', 'Hot flashes',
    // I
    'Increased appetite', 'Indigestion', 'Insomnia', 'Irregular heartbeat', 'Irritability', 'Itching', 'Itchy eyes',
    // J
    'Jaundice', 'Jaw pain', 'Joint pain', 'Joint stiffness', 'Joint swelling',
    // K
    'Kidney pain', 'Knee pain',
    // L
    'Lack of coordination', 'Leg cramps', 'Leg pain', 'Leg swelling', 'Leg weakness', 'Lightheadedness', 'Loss of appetite', 'Loss of balance', 'Loss of consciousness', 'Low blood pressure', 'Lower back pain', 'Lump in throat',
    // M
    'Memory loss', 'Menstrual cramps', 'Mood swings', 'Mouth sores', 'Muscle aches', 'Muscle cramps', 'Muscle spasms', 'Muscle stiffness', 'Muscle weakness',
    // N
    'Nasal congestion', 'Nausea', 'Neck pain', 'Neck stiffness', 'Nervousness', 'Night sweats', 'Nosebleed', 'Numbness',
    // O
    'Obesity',
    // P
    'Painful urination', 'Pale skin', 'Pelvic pain', 'Pins and needles', 'Poor appetite',
    // R
    'Rapid breathing', 'Rapid heartbeat', 'Rash', 'Rectal bleeding', 'Redness', 'Restlessness', 'Runny nose',
    // S
    'Sadness', 'Scalp itching', 'Seizures', 'Sensitivity to light', 'Severe headache', 'Shaking', 'Shortness of breath', 'Shoulder pain', 'Skin discoloration', 'Skin dryness', 'Skin rash', 'Sleep disturbances', 'Slurred speech', 'Sneezing', 'Sore throat', 'Stomach cramps', 'Stomach pain', 'Stuffy nose', 'Sudden weight gain', 'Sudden weight loss', 'Sweating', 'Swelling', 'Swollen glands', 'Swollen lymph nodes',
    // T
    'Thirst', 'Throat irritation', 'Tingling', 'Tinnitus', 'Tiredness', 'Toothache', 'Tremors',
    // U
    'Unintentional weight loss', 'Unusual bleeding', 'Upper abdominal pain', 'Upset stomach', 'Urinary incontinence', 'Urinary urgency',
    // V
    'Vaginal bleeding', 'Vaginal discharge', 'Vertigo', 'Vision changes', 'Vision loss', 'Vomiting', 'Vomiting blood',
    // W
    'Watery eyes', 'Weakness', 'Weight gain', 'Weight loss', 'Wheezing',
    // Y
    'Yellowing of skin'
  ];


  // Hook for submitting emergency
  const { mutate: submitEmergency, isPending: isSubmitting, error: submitError } = useTriageEmergency();


  // Hook for polling emergency status
  const { 
    data: statusData, 
    isLoading: isPolling,
    error: pollingError 
  } = useEmergencyStatus(emergencyId, {
    enabled: !!emergencyId,
    onHospitalAssigned: (data) => {
      console.log('🏥 Hospital assigned:', data);
      
      // Navigate to results page with all data
      navigate('/triage-results', {
        state: {
          emergencyId: emergencyId,
          emergency: data,
          hospital: data.hospital,
          patientName: formData.patientName
        }
      });
    }
  });


  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };


  // Handle symptom input change with autocomplete
  const handleSymptomInputChange = (e) => {
    const value = e.target.value;
    setSymptomInput(value);

    if (value.trim().length > 0) {
      // Filter symptoms based on input
      const filtered = symptomsDatabase.filter(symptom =>
        symptom.toLowerCase().startsWith(value.toLowerCase())
      );
      setSuggestionSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestionSuggestions([]);
      setShowSuggestions(false);
    }
  };


  // Add symptom from suggestion
  const addSymptom = (symptom) => {
    if (!selectedSymptoms.includes(symptom)) {
      const newSymptoms = [...selectedSymptoms, symptom];
      setSelectedSymptoms(newSymptoms);
      updateFormDataSymptoms(newSymptoms);
    }
    setSymptomInput('');
    setSuggestionSuggestions([]);
    setShowSuggestions(false);
  };


  // Add "Others" option
  const addOtherSymptom = () => {
    if (symptomInput.trim() && !selectedSymptoms.includes(symptomInput.trim())) {
      const newSymptoms = [...selectedSymptoms, symptomInput.trim()];
      setSelectedSymptoms(newSymptoms);
      updateFormDataSymptoms(newSymptoms);
    }
    setSymptomInput('');
    setSuggestionSuggestions([]);
    setShowSuggestions(false);
  };


  // Remove symptom
  const removeSymptom = (symptom) => {
    const newSymptoms = selectedSymptoms.filter(s => s !== symptom);
    setSelectedSymptoms(newSymptoms);
    updateFormDataSymptoms(newSymptoms);
  };


  // Update formData symptoms
  const updateFormDataSymptoms = (symptoms) => {
    setFormData({
      ...formData,
      symptoms: symptoms.join(', ')
    });
  };


  // Get current location using browser geolocation
 const getCurrentLocation = () => {
  if (!navigator.geolocation) {
    alert('❌ Geolocation not supported');
    return;
  }

  setIsLocating(true);
  setLocationAccuracy(null);

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;

      // Save accuracy
      setLocationAccuracy(Math.round(accuracy));

      // ❌ Ignore bad readings
      if (accuracy > 100) return;

      // ✅ Accept good location
      setFormData(prev => ({
        ...prev,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        address: 'Current Location'
      }));

      setMapCenter([latitude, longitude]);
      setMarkerPosition({ lat: latitude, lng: longitude });
      setShowMap(true);

      navigator.geolocation.clearWatch(watchId);
      setIsLocating(false);

      alert(`📍 Location locked (±${Math.round(accuracy)}m)`);
    },
    (error) => {
      console.error(error);
      setIsLocating(false);
      alert('❌ Location access denied or unavailable');
    },
    {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0
    }
  );
};



  // Improved search using Nominatim API directly
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      alert('⚠️ Please enter a location to search');
      return;
    }
    
    setIsSearching(true);
    setSearchResults([]);
    
    try {
      const encodedQuery = encodeURIComponent(searchQuery);
      const url = `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&addressdetails=1&limit=10`;
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'EmergencyHealthcareApp/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error('Search service unavailable');
      }
      
      const data = await response.json();
      
      if (data.length === 0) {
        alert('❌ No results found. Try:\n• Different spelling\n• Nearby city name\n• Less specific search');
      } else {
        setSearchResults(data);
      }
    } catch (err) {
      console.error('Search error:', err);
      alert('❌ Search failed. Please check your internet connection and try again.');
    } finally {
      setIsSearching(false);
    }
  };


  // Handle search result selection
  const selectSearchResult = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    
    setFormData({
      ...formData,
      latitude: lat.toString(),
      longitude: lng.toString(),
      address: result.display_name
    });
    
    setMapCenter([lat, lng]);
    setMarkerPosition({ lat, lng });
    setShowMap(true);
    setSearchResults([]);
    setSearchQuery('');
  };


  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate location
    if (!formData.latitude || !formData.longitude) {
      alert('❌ Please select a location on the map');
      return;
    }
    
    // Validate symptoms
    if (selectedSymptoms.length === 0) {
      alert('❌ Please add at least one symptom');
      return;
    }
    
    const emergencyData = {
      patientName: formData.patientName,
      age: formData.age,
      gender: formData.gender,
      contact: formData.contact,
      vitals: {
        bloodPressure: formData.bloodPressure,
        heartRate: formData.heartRate ? parseInt(formData.heartRate) : null,
        oxygenLevel: formData.oxygenLevel ? parseInt(formData.oxygenLevel) : null
      },
      symptoms: formData.symptoms,
      location: {
        lat: parseFloat(formData.latitude),
        lng: parseFloat(formData.longitude)
      }
    };


    console.log('📤 Submitting emergency:', emergencyData);


    submitEmergency(emergencyData, {
      onSuccess: (data) => {
        console.log('✅ Emergency submitted successfully:', data);
        
        // Start polling by setting emergency ID
        if (data.emergencyId) {
          setEmergencyId(data.emergencyId);
          
          // Also call the parent callback if provided
          if (onEmergencyCreated) {
            onEmergencyCreated(data.emergencyId, data);
          }
        }
      },
      onError: (error) => {
        console.error('❌ Submission failed:', error);
        alert(`❌ Error: ${error.message}`);
      }
    });
  };


  // Auto-fill with test data
  const fillTestData = () => {
    const testLat = 28.7041;
    const testLng = 77.1025;
    
    setFormData({
      patientName: 'Rajesh Kumar',
      age: '40-45',
      gender: 'Male',
      contact: '+91 9876543210',
      bloodPressure: '140/90',
      heartRate: '95',
      oxygenLevel: '92',
      symptoms: 'Chest pain, Shortness of breath, Sweating',
      latitude: testLat.toString(),
      longitude: testLng.toString(),
      address: 'New Delhi, India'
    });
    
    setSelectedSymptoms(['Chest pain', 'Shortness of breath', 'Sweating']);
    setMapCenter([testLat, testLng]);
    setMarkerPosition({ lat: testLat, lng: testLng });
    setShowMap(true);
  };


  // Age range options
  const ageRanges = [
    '0-5', '5-10', '10-15', '15-20', '20-25', '25-30', '30-35', '35-40',
    '40-45', '45-50', '50-55', '55-60', '60-65', '65-70', '70-75', '75-80',
    '80-85', '85-90', '90-95', '95-100', '100+'
  ];


  // Gender options
  const genderOptions = ['Male', 'Female', 'Others'];


  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>🚨 Emergency Intake Form</h2>
        <button onClick={fillTestData} type="button" style={styles.testButton}>
          Fill Test Data
        </button>
      </div>


      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Patient Info */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Patient Information</h3>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Patient Name</label>
            <input
              type="text"
              name="patientName"
              value={formData.patientName}
              onChange={handleChange}
              style={styles.input}
              placeholder="Enter full name"
              required
            />
          </div>


          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Age</label>
              <select
                name="age"
                value={formData.age}
                onChange={handleChange}
                style={styles.select}
                required
              >
                <option value="">Select age range</option>
                {ageRanges.map((range) => (
                  <option key={range} value={range}>
                    {range} years
                  </option>
                ))}
              </select>
            </div>


            <div style={styles.formGroup}>
              <label style={styles.label}>Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                style={styles.select}
                required
              >
                <option value="">Select gender</option>
                {genderOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>


          <div style={styles.formGroup}>
            <label style={styles.label}>Contact Number</label>
            <input
              type="tel"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              style={styles.input}
              placeholder="e.g., +91 9876543210"
              required
            />
          </div>
        </div>


        {/* Vitals */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Vital Signs</h3>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>Blood Pressure</label>
            <input
              type="text"
              name="bloodPressure"
              value={formData.bloodPressure}
              onChange={handleChange}
              style={styles.input}
              placeholder="e.g., 120/80"
            />
          </div>


          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Heart Rate (bpm)</label>
              <input
                type="number"
                name="heartRate"
                value={formData.heartRate}
                onChange={handleChange}
                style={styles.input}
                placeholder="e.g., 75"
                min="30"
                max="200"
              />
            </div>


            <div style={styles.formGroup}>
              <label style={styles.label}>Oxygen Level (%)</label>
              <input
                type="number"
                name="oxygenLevel"
                value={formData.oxygenLevel}
                onChange={handleChange}
                style={styles.input}
                placeholder="e.g., 98"
                min="50"
                max="100"
              />
            </div>
          </div>
        </div>


        {/* Symptoms - IMPROVED UI */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Symptoms</h3>
          
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Type Symptoms <span style={styles.required}>*</span>
            </label>
            
            {/* Help Box */}
            <div style={styles.symptomHelpBox}>
              <span style={styles.helpIcon}>💡</span>
              <span>Start typing to see suggestions (e.g., "H" for Headache)</span>
            </div>
            
            {/* Symptom Input with Better Styling */}
            <div style={styles.symptomInputContainer}>
              <input
                type="text"
                value={symptomInput}
                onChange={handleSymptomInputChange}
                onFocus={() => symptomInput && setShowSuggestions(true)}
                style={styles.symptomInput}
                placeholder="Type symptom name..."
              />
              
              {/* Suggestions Dropdown */}
              {showSuggestions && symptomSuggestions.length > 0 && (
                <div style={styles.suggestionsDropdown}>
                  <div style={styles.suggestionsHeader}>
                    💊 Suggested Symptoms
                  </div>
                  {symptomSuggestions.slice(0, 10).map((symptom, index) => (
                    <div
                      key={index}
                      style={styles.suggestionItem}
                      onClick={() => addSymptom(symptom)}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4a4a4a'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <span style={styles.suggestionIcon}>✓</span>
                      {symptom}
                    </div>
                  ))}
                  
                  {/* Others Option */}
                  {symptomInput.trim() && (
                    <div
                      style={styles.othersOption}
                      onClick={addOtherSymptom}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2a5a2a'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2a4a2a'}
                    >
                      <span style={styles.othersIcon}>➕</span>
                      Add "{symptomInput}" (Others)
                    </div>
                  )}
                </div>
              )}
            </div>


            {/* Selected Symptoms Tags */}
            {selectedSymptoms.length > 0 && (
              <div style={styles.selectedSymptomsContainer}>
                <div style={styles.selectedSymptomsHeader}>
                  <span style={styles.selectedIcon}>✅</span>
                  <span>Selected Symptoms ({selectedSymptoms.length})</span>
                </div>
                <div style={styles.symptomsTagsContainer}>
                  {selectedSymptoms.map((symptom, index) => (
                    <div key={index} style={styles.symptomTag}>
                      <span style={styles.symptomTagText}>{symptom}</span>
                      <button
                        type="button"
                        onClick={() => removeSymptom(symptom)}
                        style={styles.removeSymptomBtn}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Validation Message */}
            {selectedSymptoms.length === 0 && (
              <div style={styles.validationHint}>
                ⚠️ Please add at least one symptom to continue
              </div>
            )}
          </div>
        </div>


        {/* Location Section */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>📍 Location</h3>
          
          {/* Location Buttons */}
          <div style={styles.locationButtons}>
           <button 
  type="button"
  onClick={getCurrentLocation}
  disabled={isLocating}
  style={{
    ...styles.locationButton,
    opacity: isLocating ? 0.6 : 1,
    cursor: isLocating ? 'not-allowed' : 'pointer'
  }}
>
  {isLocating ? '📡 Detecting location...' : '📍 Use Current Location'}
</button>

            <button 
              type="button"
              onClick={() => setShowMap(!showMap)}
              style={{...styles.locationButton, backgroundColor: '#2196F3'}}
            >
              🗺️ {showMap ? 'Hide Map' : 'Select on Map'}
            </button>
          </div>


          {/* Search Location */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Search Location</label>
            <div style={styles.searchHelp}>
              💡 Try: "Greater Noida", "Noida Sector 62", "Delhi AIIMS"
            </div>
            <div style={styles.searchContainer}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                style={styles.searchInput}
                placeholder="Type city, landmark, or area name"
              />
              <button
                type="button"
                onClick={handleSearch}
                disabled={isSearching}
                style={styles.searchButton}
              >
                {isSearching ? '⏳' : '🔍'}
              </button>
            </div>


            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div style={styles.searchResults}>
                {searchResults.slice(0, 8).map((result, index) => (
                  <div
                    key={index}
                    style={styles.searchResultItem}
                    onClick={() => selectSearchResult(result)}
                  >
                    <div style={styles.resultTitle}>📍 {result.display_name.split(',')[0]}</div>
                    <div style={styles.resultSubtitle}>{result.display_name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>


          {/* Selected Location Display */}
          {formData.address && (
            <div style={styles.locationDisplay}>
              <div style={styles.locationIcon}>📍</div>
              <div>
                <div style={styles.locationLabel}>Selected Location:</div>
                <div style={styles.locationText}>{formData.address}</div>
              </div>
            </div>
          )}
          {locationAccuracy && (
  <div
    style={{
      marginTop: '6px',
      marginLeft: '28px',
      fontSize: '0.85rem',
      color: locationAccuracy <= 50 ? '#2e7d32' : '#f57c00'
    }}
  >
    📡 Accuracy: ±{locationAccuracy} meters
  </div>
)}



          {/* OpenStreetMap Display */}
          {showMap && (
            <div style={styles.mapContainer}>
              <div style={styles.mapInstructions}>
                💡 Click anywhere on the map to set location
              </div>
              <MapContainer
                center={mapCenter}
                zoom={13}
                style={{ height: '400px', width: '100%', borderRadius: '8px' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <ChangeMapView center={mapCenter} zoom={13} />
                <LocationMarker 
                  position={markerPosition} 
                  setPosition={setMarkerPosition}
                  setFormData={setFormData}
                  formData={formData}
                />
                {markerPosition && locationAccuracy && (
  <Circle
    center={[markerPosition.lat, markerPosition.lng]}
    radius={locationAccuracy}
    pathOptions={{
      color: locationAccuracy <= 50 ? 'green' : 'orange',
      fillColor: locationAccuracy <= 50 ? 'green' : 'orange',
      fillOpacity: 0.15
    }}
  />
)}

              </MapContainer>
            </div>
          )}
        </div>


        {/* Status Display */}
        {isSubmitting && (
          <div style={styles.statusBox}>
            <div style={styles.statusIcon}>📤</div>
            <div style={styles.statusText}>Submitting emergency request...</div>
          </div>
        )}


        {isPolling && statusData && (
          <div style={styles.statusBox}>
            <div style={styles.statusIcon}>🔄</div>
            <div>
              <div style={styles.statusText}>Finding nearest available hospital...</div>
              {statusData.severity && (
                <div style={styles.statusDetail}>
                  Severity: <span style={{color: '#ff4444'}}>{statusData.severity}</span>
                </div>
              )}
              {statusData.status && (
                <div style={styles.statusDetail}>
                  Status: {statusData.status}
                </div>
              )}
            </div>
          </div>
        )}


        {/* Error Display */}
        {submitError && (
          <div style={styles.error}>
            ❌ Error: {submitError.message}
          </div>
        )}


        {pollingError && (
          <div style={{...styles.error, backgroundColor: '#ff9800'}}>
            ⚠️ Status Check Error: {pollingError.message}
          </div>
        )}


        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={isSubmitting || isPolling}
          style={{
            ...styles.submitButton,
            opacity: (isSubmitting || isPolling) ? 0.6 : 1,
            cursor: (isSubmitting || isPolling) ? 'not-allowed' : 'pointer'
          }}
        >
          {isSubmitting ? '⏳ Submitting...' : 
           isPolling ? '🔄 Processing...' : 
           '🚨 Submit Emergency'}
        </button>
      </form>
    </div>
  );
}


const styles = {
  container: {
    backgroundColor: '#1a1a1a',
    padding: '20px',
    borderRadius: '10px',
    maxWidth: '800px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  title: {
    color: '#ff4444',
    margin: 0,
    fontSize: '24px'
  },
  testButton: {
    backgroundColor: '#555',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  section: {
    backgroundColor: '#2a2a2a',
    padding: '20px',
    borderRadius: '8px'
  },
  sectionTitle: {
    color: '#4CAF50',
    marginTop: 0,
    marginBottom: '20px',
    fontSize: '18px',
    textAlign: 'center'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1,
    marginBottom: '15px'
  },
  row: {
    display: 'flex',
    gap: '15px',
    marginBottom: '15px'
  },
  label: {
    color: '#ccc',
    fontSize: '14px',
    fontWeight: 'bold',
    textAlign: 'left',
    marginBottom: '5px'
  },
  required: {
    color: '#ff4444',
    marginLeft: '3px'
  },
  input: {
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #444',
    backgroundColor: '#333',
    color: 'white',
    fontSize: '14px'
  },
  select: {
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #444',
    backgroundColor: '#333',
    color: 'white',
    fontSize: '14px',
    cursor: 'pointer'
  },
  textarea: {
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #444',
    backgroundColor: '#333',
    color: 'white',
    fontSize: '14px',
    resize: 'vertical',
    fontFamily: 'Arial'
  },
  
  // IMPROVED SYMPTOM AUTOCOMPLETE STYLES
  symptomHelpBox: {
    backgroundColor: '#1e3a1e',
    color: '#81C784',
    padding: '12px 15px',
    borderRadius: '8px',
    fontSize: '13px',
    marginBottom: '12px',
    border: '2px solid #4CAF50',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    boxShadow: '0 2px 4px rgba(76, 175, 80, 0.2)'
  },
  helpIcon: {
    fontSize: '18px'
  },
  symptomInputContainer: {
    position: 'relative',
    width: '100%'
  },
  symptomInput: {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '8px',
    border: '2px solid #4CAF50',
    backgroundColor: '#333',
    color: 'white',
    fontSize: '15px',
    transition: 'all 0.3s',
    outline: 'none',
    boxSizing: 'border-box'
  },
  suggestionsDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#2a2a2a',
    border: '2px solid #4CAF50',
    borderRadius: '8px',
    marginTop: '8px',
    maxHeight: '300px',
    overflowY: 'auto',
    zIndex: 1000,
    boxShadow: '0 6px 12px rgba(0,0,0,0.4)'
  },
  suggestionsHeader: {
    padding: '12px 16px',
    backgroundColor: '#1e3a1e',
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: '14px',
    borderBottom: '2px solid #4CAF50',
    position: 'sticky',
    top: 0,
    zIndex: 1
  },
  suggestionItem: {
    padding: '14px 16px',
    cursor: 'pointer',
    color: 'white',
    borderBottom: '1px solid #3a3a3a',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px'
  },
  suggestionIcon: {
    color: '#4CAF50',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  othersOption: {
    backgroundColor: '#2a4a2a',
    color: '#81C784',
    fontWeight: 'bold',
    borderTop: '2px solid #4CAF50',
    padding: '14px 16px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    position: 'sticky',
    bottom: 0
  },
  othersIcon: {
    fontSize: '16px',
    fontWeight: 'bold'
  },
  selectedSymptomsContainer: {
    marginTop: '20px',
    backgroundColor: '#1a2a1a',
    padding: '15px',
    borderRadius: '8px',
    border: '2px solid #040f05ff'
  },
  selectedSymptomsHeader: {
    color: '#5b952eff',
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  selectedIcon: {
    fontSize: '16px'
  },
  symptomsTagsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px'
  },
  symptomTag: {
    backgroundColor: '#2a4a2a',
    color: '#fff',
    padding: '10px 16px',
    borderRadius: '25px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    border: '2px solid #4CAF50',
    fontSize: '14px',
    transition: 'all 0.2s',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
  },
  symptomTagText: {
    fontWeight: '500'
  },
  removeSymptomBtn: {
    background: 'none',
    border: 'none',
    color: '#ff4444',
    cursor: 'pointer',
    fontSize: '18px',
    padding: '0 4px',
    fontWeight: 'bold',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  validationHint: {
    marginTop: '10px',
    padding: '10px 12px',
    backgroundColor: '#3a2a1a',
    color: '#FFA726',
    borderRadius: '6px',
    fontSize: '13px',
    border: '1px solid #FF9800',
    textAlign: 'center'
  },

  locationButtons: {
    display: 'flex',
    gap: '10px',
    marginBottom: '15px'
  },
  locationButton: {
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    padding: '10px 15px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    flex: 1,
    fontWeight: 'bold',
    transition: 'all 0.3s'
  },
  searchHelp: {
    backgroundColor: '#1a2a3a',
    color: '#64B5F6',
    padding: '8px',
    borderRadius: '5px',
    fontSize: '12px',
    marginBottom: '8px',
    border: '1px solid #2196F3'
  },
  searchContainer: {
    display: 'flex',
    gap: '10px'
  },
  searchInput: {
    flex: 1,
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #444',
    backgroundColor: '#333',
    color: 'white',
    fontSize: '14px'
  },
  searchButton: {
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  searchResults: {
    backgroundColor: '#333',
    border: '1px solid #444',
    borderRadius: '5px',
    marginTop: '5px',
    maxHeight: '300px',
    overflowY: 'auto'
  },
  searchResultItem: {
    padding: '12px',
    cursor: 'pointer',
    color: 'white',
    borderBottom: '1px solid #444',
    transition: 'background-color 0.2s'
  },
  resultTitle: {
    fontWeight: 'bold',
    marginBottom: '4px',
    color: '#4CAF50'
  },
  resultSubtitle: {
    fontSize: '12px',
    color: '#aaa'
  },
  locationDisplay: {
    backgroundColor: '#1e3a1e',
    padding: '12px',
    borderRadius: '8px',
    marginTop: '15px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    border: '2px solid #4CAF50'
  },
  locationIcon: {
    fontSize: '24px'
  },
  locationLabel: {
    color: '#4CAF50',
    fontSize: '12px',
    fontWeight: 'bold',
    marginBottom: '3px'
  },
  locationText: {
    color: '#fff',
    fontSize: '14px'
  },
  mapContainer: {
    marginTop: '15px',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '2px solid #444'
  },
  mapInstructions: {
    backgroundColor: '#2196F3',
    color: 'white',
    padding: '8px',
    textAlign: 'center',
    fontSize: '13px',
    fontWeight: 'bold'
  },
  statusBox: {
    backgroundColor: '#1e3a5a',
    border: '2px solid #2196F3',
    borderRadius: '8px',
    padding: '15px',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    animation: 'pulse 2s infinite'
  },
  statusIcon: {
    fontSize: '24px'
  },
  statusText: {
    color: '#64B5F6',
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '5px'
  },
  statusDetail: {
    color: '#aaa',
    fontSize: '13px',
    marginTop: '3px'
  },
  error: {
    backgroundColor: '#ff4444',
    color: 'white',
    padding: '12px',
    borderRadius: '5px',
    textAlign: 'center',
    fontWeight: 'bold'
  },
  submitButton: {
    backgroundColor: '#ff4444',
    color: 'white',
    border: 'none',
    padding: '15px',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s'
  }
};
