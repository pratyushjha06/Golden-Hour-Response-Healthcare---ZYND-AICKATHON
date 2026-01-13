import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const emergencyIcon = new L.Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const hospitalIcon = new L.Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const ambulanceIcon = new L.Icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function AmbulanceTracker({
  emergencyLocation,
  ambulanceStartLocation,
  needsAmbulance,
  onAmbulanceArrival,
}) {
  const map = useMap();
  const [currentPosition, setCurrentPosition] = useState(ambulanceStartLocation);
  const [arrived, setArrived] = useState(false);

  useEffect(() => {
    if (!needsAmbulance) return;
    if (!ambulanceStartLocation || !emergencyLocation) return;

    const startLat = ambulanceStartLocation.lat;
    const startLng = ambulanceStartLocation.lng;
    const endLat = emergencyLocation.lat;
    const endLng = emergencyLocation.lng;

    if (
      [startLat, startLng, endLat, endLng].some(
        (v) => typeof v !== 'number' || isNaN(v),
      )
    ) {
      return;
    }

    const steps = 100;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      const newLat = startLat + (endLat - startLat) * progress;
      const newLng = startLng + (endLng - startLng) * progress;

      setCurrentPosition({ lat: newLat, lng: newLng });
      map.setView([newLat, newLng], 13);

      if (currentStep >= steps) {
        clearInterval(interval);
        setArrived(true);
        if (onAmbulanceArrival) {
          onAmbulanceArrival();
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [ambulanceStartLocation, emergencyLocation, needsAmbulance, map, onAmbulanceArrival]);

  if (!needsAmbulance || !currentPosition) return null;

  return (
    <Marker position={[currentPosition.lat, currentPosition.lng]} icon={ambulanceIcon}>
      <Popup>🚑 Ambulance {arrived ? '(Arrived!)' : '(En Route)'}</Popup>
    </Marker>
  );
}

export default function AmbulanceMap({
  emergencyLocation,
  hospitalLocation,
  ambulanceStartLocation,
  needsAmbulance,
  onAmbulanceArrival,
}) {
  // Normalize coordinates (accept lat/lng or latitude/longitude, strings or numbers)
  const normalizeCoord = (coord) => {
    if (!coord) return null;
    const latRaw = coord.lat ?? coord.latitude;
    const lngRaw = coord.lng ?? coord.longitude;

    const lat = typeof latRaw === 'string' ? parseFloat(latRaw) : latRaw;
    const lng = typeof lngRaw === 'string' ? parseFloat(lngRaw) : lngRaw;

    if (typeof lat !== 'number' || typeof lng !== 'number') return null;
    if (isNaN(lat) || isNaN(lng)) return null;

    return { lat, lng, name: coord.name };
  };

  const normalizedEmergency = normalizeCoord(emergencyLocation);
  const normalizedHospital = normalizeCoord(hospitalLocation);
  const normalizedAmbulance = normalizeCoord(ambulanceStartLocation);

  const hasCoords = (coord) =>
    coord && typeof coord.lat === 'number' && typeof coord.lng === 'number';

  // Debug logs to see exactly what arrives
  console.log('=== AmbulanceMap Props ===');
  console.log('raw emergencyLocation:', emergencyLocation);
  console.log('raw hospitalLocation:', hospitalLocation);
  console.log('raw ambulanceStartLocation:', ambulanceStartLocation);
  console.log('normalizedEmergency:', normalizedEmergency);
  console.log('normalizedHospital:', normalizedHospital);
  console.log('normalizedAmbulance:', normalizedAmbulance);
  console.log('needsAmbulance:', needsAmbulance);

  // If emergency location is still not usable, just don't render the map (no red error)
  if (!hasCoords(normalizedEmergency)) {
    return null;
  }

  if (!hasCoords(normalizedHospital)) {
    return null;
  }

  const center = [normalizedEmergency.lat, normalizedEmergency.lng];

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🗺️ Live Route Tracking</h2>

      <div style={styles.mapWrapper}>
        <MapContainer center={center} zoom={13} style={styles.map} scrollWheelZoom={true}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Marker position={center} icon={emergencyIcon}>
            <Popup>
              🚨 Emergency Location
              <br />
              Patient location
            </Popup>
          </Marker>

          {hasCoords(normalizedHospital) && (
            <Marker
              position={[normalizedHospital.lat, normalizedHospital.lng]}
              icon={hospitalIcon}
            >
              <Popup>
                🏥 {normalizedHospital.name || hospitalLocation?.name || 'Selected Hospital'}
                <br />
                Destination
              </Popup>
            </Marker>
          )}

          {needsAmbulance && hasCoords(normalizedAmbulance) && (
            <AmbulanceTracker
              emergencyLocation={normalizedEmergency}
              ambulanceStartLocation={normalizedAmbulance}
              needsAmbulance={needsAmbulance}
              onAmbulanceArrival={onAmbulanceArrival}
            />
          )}
        </MapContainer>
      </div>

      <div style={styles.legend}>
        <div style={styles.legendItem}>
          <span style={{ ...styles.legendDot, backgroundColor: '#ff4444' }}>🔴</span>
          <span>Emergency Location</span>
        </div>
        <div style={styles.legendItem}>
          <span style={{ ...styles.legendDot, backgroundColor: '#4CAF50' }}>🟢</span>
          <span>Hospital</span>
        </div>
        {needsAmbulance && (
          <div style={styles.legendItem}>
            <span style={{ ...styles.legendDot, backgroundColor: '#2196F3' }}>🔵</span>
            <span>Ambulance (Moving)</span>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#1a1a1a',
    padding: '20px',
    borderRadius: '10px',
    marginTop: '20px',
  },
  title: {
    color: '#4CAF50',
    margin: '0 0 20px 0',
    textAlign: 'center',
  },
  mapWrapper: {
    borderRadius: '10px',
    overflow: 'hidden',
    border: '2px solid #333',
  },
  map: {
    height: '500px',
    width: '100%',
  },
  legend: {
    display: 'flex',
    justifyContent: 'center',
    gap: '30px',
    marginTop: '15px',
    padding: '15px',
    backgroundColor: '#2a2a2a',
    borderRadius: '8px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: 'white',
    fontSize: '14px',
  },
  legendDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    display: 'inline-block',
  },
  error: {
    backgroundColor: '#ff4444',
    color: 'white',
    padding: '20px',
    borderRadius: '10px',
    marginTop: '20px',
    fontFamily: 'monospace',
  },
};
