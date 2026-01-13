import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import SplashScreen from './components/SplashScreen';
import LandingPage from './pages/LandingPage';
import EmergencyForm from './components/EmergencyForm';
import AmbulanceSelector from './components/AmbulanceSelector';
import TriageResults from './components/TriageResults';
import AgentStatus from './components/AgentStatus';
import HospitalList from './components/HospitalList';
import AmbulanceMap from './components/AmbulanceMap';
import { useAmbulanceTracking, useSelectedHospital } from './hooks/useAmbulanceTracking.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      staleTime: 30000,
      retry: 2,
    },
  },
});

function Dashboard() {
  const [showSplash, setShowSplash] = useState(true);
  const [showLanding, setShowLanding] = useState(true);
  const [emergencyId, setEmergencyId] = useState(null);
  const [triageData, setTriageData] = useState(null);
  const [needsAmbulance, setNeedsAmbulance] = useState(null);
  const [selectedHospitalData, setSelectedHospitalData] = useState(null);

  // Fetch real-time data
  const { data: ambulanceData } = useAmbulanceTracking(emergencyId);
  const { data: hospitalData } = useSelectedHospital(emergencyId);

  // DEBUG: Log all states
  useEffect(() => {
    console.log('=== STATE DEBUG ===');
    console.log('emergencyId:', emergencyId);
    console.log('triageData:', triageData);
    console.log('needsAmbulance:', needsAmbulance);
    console.log('selectedHospitalData:', selectedHospitalData);
    console.log('ambulanceData:', ambulanceData);
    console.log('hospitalData:', hospitalData);
    console.log('==================');
  }, [emergencyId, triageData, needsAmbulance, selectedHospitalData, ambulanceData, hospitalData]);

  useEffect(() => {
    document.body.style.backgroundColor = '#0f0f0f';
    document.body.style.margin = '0';
    document.body.style.padding = '0';

    return () => {
      document.body.style.backgroundColor = '';
      document.body.style.margin = '';
      document.body.style.padding = '';
    };
  }, []);

  // Normalize and store triage data from EmergencyForm
  const handleEmergencyCreated = (id, data) => {
    const emergencyLocation = {
      lat:
        (data.location && data.location.lat) ??
        data.latitude ??
        data.lat ??
        0,
      lng:
        (data.location && data.location.lng) ??
        data.longitude ??
        data.lng ??
        0,
    };

    const normalizedTriageData = {
      ...data,
      location: emergencyLocation,
    };

    setEmergencyId(id);
    setTriageData(normalizedTriageData);

    console.log('✅ Emergency created (normalized):', id, normalizedTriageData);
  };

  const handleAmbulanceSelection = (needs) => {
    setNeedsAmbulance(needs);
    console.log('✅ Ambulance selection:', needs);
  };

  const handleHospitalSelection = (hospital) => {
    setSelectedHospitalData(hospital);
    console.log('✅ Hospital selected:', hospital);
  };

  const handleAmbulanceArrival = () => {
    console.log('🚑 Ambulance has arrived at emergency location!');
    alert('🚑 Ambulance has arrived at the emergency location!');
  };

  const handleEmergencyClick = () => {
    setShowLanding(false);
  };

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (showLanding) {
    return <LandingPage onEmergency={handleEmergencyClick} />;
  }

  // Check if map should show
  const shouldShowMap =
    emergencyId &&
    triageData &&
    triageData.location &&
    typeof triageData.location.lat === 'number' &&
    typeof triageData.location.lng === 'number' &&
    needsAmbulance !== null &&
    selectedHospitalData &&
    ambulanceData;

  console.log('Should show map?', shouldShowMap);

  return (
    <div style={styles.dashboard}>
      <button
        onClick={() => {
          setShowLanding(true);
          setEmergencyId(null);
          setTriageData(null);
          setNeedsAmbulance(null);
          setSelectedHospitalData(null);
        }}
        style={styles.backButton}
      >
        ← Back to Home
      </button>

      <header style={styles.header}>
        <h1 style={styles.mainTitle}>⚡ Golden Hour Response Dashboard</h1>
        <p style={styles.subtitle}>AI-Powered Emergency Healthcare System</p>
      </header>

      {/* Step 1: Emergency Form */}
      <EmergencyForm onEmergencyCreated={handleEmergencyCreated} />

      {/* Step 2: Ambulance Selector */}
      {emergencyId && triageData && needsAmbulance === null && (
        <div>
          <p style={{ color: 'yellow', textAlign: 'center' }}>🟡 Step 2: Choose ambulance</p>
          <AmbulanceSelector onSelect={handleAmbulanceSelection} />
        </div>
      )}

      {/* Step 3: Hospital List */}
      {emergencyId && needsAmbulance !== null && !selectedHospitalData && (
        <div>
          <p style={{ color: 'yellow', textAlign: 'center' }}>🟡 Step 3: Select hospital</p>
          <HospitalList
            emergencyId={emergencyId}
            onHospitalSelect={handleHospitalSelection}
          />
        </div>
      )}

      {/* Step 4: Loading message while waiting for ambulance data */}
      {emergencyId &&
        needsAmbulance !== null &&
        selectedHospitalData &&
        !ambulanceData && (
          <div
            style={{
              color: 'yellow',
              textAlign: 'center',
              padding: '20px',
              backgroundColor: '#333',
              borderRadius: '10px',
              margin: '20px 0',
            }}
          >
            ⏳ Loading ambulance data...
          </div>
        )}

      {/* Step 5: Map */}
      {shouldShowMap ? (
        <div>
          <p style={{ color: 'lime', textAlign: 'center' }}>✅ Step 4: Map is showing!</p>
          <AmbulanceMap
            emergencyLocation={{
              lat: triageData.location.lat,
              lng: triageData.location.lng,
            }}
            hospitalLocation={{
              lat: selectedHospitalData.latitude,
              lng: selectedHospitalData.longitude,
              name: selectedHospitalData.name,
            }}
            ambulanceStartLocation={{
              lat: ambulanceData.currentLat,
              lng: ambulanceData.currentLng,
            }}
            needsAmbulance={needsAmbulance}
            onAmbulanceArrival={handleAmbulanceArrival}
          />
        </div>
      ) : (
        selectedHospitalData && (
          <div
            style={{
              color: 'red',
              textAlign: 'center',
              padding: '20px',
              backgroundColor: '#331111',
              borderRadius: '10px',
              margin: '20px 0',
            }}
          >
            ❌ Map not showing. Missing data:
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li>{emergencyId ? '✅' : '❌'} Emergency ID</li>
              <li>{triageData ? '✅' : '❌'} Triage Data</li>
              <li>{needsAmbulance !== null ? '✅' : '❌'} Ambulance Selection</li>
              <li>{selectedHospitalData ? '✅' : '❌'} Hospital Selected</li>
              <li>{ambulanceData ? '✅' : '❌'} Ambulance Data</li>
              <li>
                {triageData && triageData.location ? '✅' : '❌'} Emergency Location
              </li>
            </ul>
          </div>
        )
      )}

      <TriageResults triageData={triageData} />

      <AgentStatus emergencyId={emergencyId} />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Dashboard />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

const styles = {
  dashboard: {
    minHeight: '100vh',
    backgroundColor: '#0f0f0f',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    position: 'relative',
    margin: '0',
    width: '100%',
    boxSizing: 'border-box',
  },
  backButton: {
    position: 'fixed',
    top: '20px',
    left: '20px',
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    color: '#667eea',
    border: '1px solid #667eea',
    padding: '10px 20px',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '14px',
    zIndex: 1001,
    transition: 'all 0.3s ease',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
    marginTop: '50px',
    padding: '20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '15px',
  },
  mainTitle: {
    margin: 0,
    color: 'white',
    fontSize: '36px',
    textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
  },
  subtitle: {
    margin: '10px 0 0 0',
    color: '#ddd',
    fontSize: '18px',
  },
};

export default App;
