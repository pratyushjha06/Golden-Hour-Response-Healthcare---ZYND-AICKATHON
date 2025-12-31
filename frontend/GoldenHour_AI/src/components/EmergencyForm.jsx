import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useTriageEmergency } from '../hooks';

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

  const { mutate: submitEmergency, isPending, error } = useTriageEmergency();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Get current location using browser geolocation
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          setFormData({
            ...formData,
            latitude: lat.toString(),
            longitude: lng.toString(),
            address: 'Current Location'
          });
          
          setMapCenter([lat, lng]);
          setMarkerPosition({ lat, lng });
          setShowMap(true);
          
          alert(`✅ Location detected!`);
        },
        (error) => {
          alert('❌ Unable to get your location. Please enable location services in your browser.');
          console.error('Geolocation error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      alert('❌ Geolocation is not supported by your browser.');
    }
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
      // Use Nominatim API with corrected URL format and better parameters
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

    submitEmergency(emergencyData, {
      onSuccess: (data) => {
        alert(`✅ Emergency registered! ID: ${data.emergencyId}`);
        onEmergencyCreated(data.emergencyId, data);
        // Reset form
        setFormData({
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
        setShowMap(false);
        setMarkerPosition(null);
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
      symptoms: 'Severe chest pain, shortness of breath, sweating',
      latitude: testLat.toString(),
      longitude: testLng.toString(),
      address: 'New Delhi, India'
    });
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

        {/* Symptoms */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Symptoms</h3>
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Describe Symptoms <span style={styles.required}>*</span>
            </label>
            <textarea
              name="symptoms"
              value={formData.symptoms}
              onChange={handleChange}
              required
              style={styles.textarea}
              placeholder="Describe all symptoms in detail..."
              rows="4"
            />
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
              style={styles.locationButton}
            >
              📍 Use Current Location
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
              </MapContainer>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div style={styles.error}>
            ❌ Error: {error.message}
          </div>
        )}

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={isPending}
          style={{
            ...styles.submitButton,
            opacity: isPending ? 0.6 : 1,
            cursor: isPending ? 'not-allowed' : 'pointer'
          }}
        >
          {isPending ? '⏳ Submitting...' : '🚨 Submit Emergency'}
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
    padding: '15px',
    borderRadius: '8px'
  },
  sectionTitle: {
    color: '#4CAF50',
    marginTop: 0,
    marginBottom: '15px',
    fontSize: '18px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    flex: 1
  },
  row: {
    display: 'flex',
    gap: '15px'
  },
  label: {
    color: '#ccc',
    fontSize: '14px',
    fontWeight: 'bold'
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
  error: {
    backgroundColor: '#ff4444',
    color: 'white',
    padding: '10px',
    borderRadius: '5px',
    textAlign: 'center'
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
