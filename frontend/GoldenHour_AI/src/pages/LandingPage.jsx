import Logo from '../components/Logo';
import { useMediaQuery } from '../hooks/useMediaQuery';

export default function LandingPage({ onEmergency }) {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  // Dynamic width and padding
  const getContentWidth = () => {
    if (isMobile) return '100%';
    if (isTablet) return '600px';
    if (isDesktop) return '700px';
    return '100%';
  };

  const getContentPadding = () => {
    if (isMobile) return '0';  // NO padding on mobile
    return '0 40px';  // Padding on larger screens
  };

  const getContainerPadding = () => {
    if (isMobile) return '20px 0';  // Only top/bottom padding on mobile
    return '20px';
  };

  return (
    <div style={{
      ...styles.container,
      padding: getContainerPadding()
    }}>
      <div style={{
        ...styles.content,
        width: '100%',
        maxWidth: getContentWidth(),
        padding: getContentPadding()
      }}>
        {/* Logo */}
        <div style={styles.logoSection}>
          <Logo size={isMobile ? 'medium' : 'large'} />
        </div>

        {/* Emergency Button */}
        <button 
          style={{
            ...styles.emergencyButton,
            width: '100%',
            fontSize: isMobile ? '24px' : '28px',
            padding: isMobile ? '18px 40px' : '20px 60px',
            borderRadius: isMobile ? '0' : '50px'  // Sharp corners on mobile
          }}
          onClick={onEmergency}
          onMouseEnter={(e) => !isMobile && (e.target.style.transform = 'scale(1.05)')}
          onMouseLeave={(e) => !isMobile && (e.target.style.transform = 'scale(1)')}
        >
          🚨 EMERGENCY
        </button>

        {/* User Auth Buttons */}
        <div style={{
          ...styles.authSection,
          padding: isMobile ? '0 20px' : '0'
        }}>
          <h3 style={styles.authTitle}>For Patients & Users</h3>
          <div style={{
            ...styles.authButtons,
            flexDirection: isMobile ? 'column' : 'row',
            width: '100%'
          }}>
            <button style={{
              ...styles.signInButton,
              width: '100%',
              minWidth: isMobile ? '100%' : '180px'
            }}>
              Sign In
            </button>
            <button style={{
              ...styles.signUpButton,
              width: '100%',
              minWidth: isMobile ? '100%' : '180px'
            }}>
              Sign Up
            </button>
          </div>
        </div>

        {/* Hospital Registration Link */}
        <div style={{
          ...styles.hospitalSection,
          margin: isMobile ? '30px 20px 0 20px' : '30px 0 0 0'
        }}>
          <a href="/hospital-register" style={styles.hospitalLink}>
            🏥 Hospital Registration
          </a>
          <p style={styles.hospitalSubtext}>
            Register your hospital to join our network
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer style={styles.footer}>
        <p style={styles.footerText}>
          Powered by Zynd Multi-Agent Protocol
        </p>
      </footer>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0a0a0a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden'
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '40px'
  },
  logoSection: {
    marginBottom: '20px',
    padding: '0 20px'
  },
  emergencyButton: {
    backgroundColor: '#ff0000',
    color: '#fff',
    fontWeight: 'bold',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 10px 40px rgba(255, 0, 0, 0.5)',
    transition: 'all 0.3s ease',
    textTransform: 'uppercase',
    letterSpacing: '2px'
  },
  authSection: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    marginTop: '30px'
  },
  authTitle: {
    color: '#fff',
    margin: 0,
    fontSize: '18px',
    fontWeight: '500'
  },
  authButtons: {
    display: 'flex',
    gap: '20px',
    alignItems: 'stretch'
  },
  signInButton: {
    backgroundColor: 'transparent',
    color: '#667eea',
    fontSize: '16px',
    fontWeight: 'bold',
    padding: '14px 40px',
    border: '2px solid #667eea',
    borderRadius: '25px',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  signUpButton: {
    backgroundColor: '#667eea',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 'bold',
    padding: '14px 40px',
    border: '2px solid #667eea',
    borderRadius: '25px',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  hospitalSection: {
    width: '100%',
    textAlign: 'center',
    padding: '30px 20px',
    backgroundColor: 'rgba(118, 75, 162, 0.1)',
    borderRadius: '15px',
    border: '1px solid rgba(118, 75, 162, 0.3)'
  },
  hospitalLink: {
    color: '#764ba2',
    fontSize: '18px',
    fontWeight: 'bold',
    textDecoration: 'none',
    display: 'block',
    marginBottom: '10px',
    transition: 'all 0.3s ease'
  },
  hospitalSubtext: {
    color: '#888',
    fontSize: '14px',
    margin: 0
  },
  footer: {
    position: 'absolute',
    bottom: '20px',
    textAlign: 'center'
  },
  footerText: {
    color: '#666',
    fontSize: '12px',
    margin: 0
  }
};
