import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import SplashScreen from './components/SplashScreen';
import LandingPage from './pages/LandingPage';
import EmergencyForm from './components/EmergencyForm';
import TriageResults from './components/TriageResults';
import AgentStatus from './components/AgentStatus';
import HospitalList from './components/HospitalList';

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

  const handleEmergencyCreated = (id, data) => {
    setEmergencyId(id);
    setTriageData(data);
  };

  const handleEmergencyClick = () => {
    setShowLanding(false);
  };

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  // Show splash screen for 2 seconds on first load
  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  // Show landing page until user clicks emergency
  if (showLanding) {
    return <LandingPage onEmergency={handleEmergencyClick} />;
  }

  // Show main emergency dashboard
  return (
    <div style={styles.dashboard}>
      {/* Back to Home button */}
      <button 
        onClick={() => setShowLanding(true)}
        style={styles.backButton}
      >
        ← Back to Home
      </button>

      <header style={styles.header}>
        <h1 style={styles.mainTitle}>⚡ Golden Hour Response Dashboard</h1>
        <p style={styles.subtitle}>AI-Powered Emergency Healthcare System</p>
      </header>

      <EmergencyForm onEmergencyCreated={handleEmergencyCreated} />
      
      <TriageResults triageData={triageData} />
      
      <AgentStatus emergencyId={emergencyId} />
      
      <HospitalList emergencyId={emergencyId} />
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
    position: 'relative'
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
    zIndex: 100,
    transition: 'all 0.3s ease'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
    padding: '20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '15px'
  },
  mainTitle: {
    margin: 0,
    color: 'white',
    fontSize: '36px',
    textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
  },
  subtitle: {
    margin: '10px 0 0 0',
    color: '#ddd',
    fontSize: '18px'
  }
};

export default App;
