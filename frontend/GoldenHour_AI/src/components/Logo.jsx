export default function Logo({ size = 'large' }) {
  const sizes = {
    small: { container: 60, text: '24px', icon: '30px' },
    medium: { container: 100, text: '32px', icon: '50px' },
    large: { container: 150, text: '48px', icon: '80px' }
  };

  const currentSize = sizes[size];

  return (
    <div style={styles.logoContainer}>
      <div style={{
        ...styles.iconCircle,
        width: currentSize.container,
        height: currentSize.container
      }}>
        <span style={{ fontSize: currentSize.icon }}>⚡</span>
      </div>
      <h1 style={{ ...styles.brandName, fontSize: currentSize.text }}>
        Golden Hour
      </h1>
      <p style={styles.tagline}>Emergency Response System</p>
    </div>
  );
}

const styles = {
  logoContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '15px'
  },
  iconCircle: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 10px 40px rgba(102, 126, 234, 0.4)',
    animation: 'pulse 2s infinite'
  },
  brandName: {
    margin: 0,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    textShadow: '2px 2px 8px rgba(0,0,0,0.3)'
  },
  tagline: {
    margin: 0,
    color: '#999',
    fontSize: '14px',
    textAlign: 'center'
  }
};
