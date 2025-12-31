import { useEffect, useState } from 'react';
import Logo from './Logo';

export default function SplashScreen({ onComplete }) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade out after 1.5 seconds
    const timer1 = setTimeout(() => {
      setFadeOut(true);
    }, 1500);

    // Call onComplete after 2 seconds
    const timer2 = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onComplete]);

  return (
    <div style={{
      ...styles.container,
      opacity: fadeOut ? 0 : 1,
      transition: 'opacity 0.5s ease'
    }}>
      <Logo size="large" />
      <div style={styles.loader}>
        <div style={styles.dot}></div>
        <div style={styles.dot}></div>
        <div style={styles.dot}></div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0a0a0a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '40px',
    zIndex: 9999
  },
  loader: {
    display: 'flex',
    gap: '10px'
  },
  dot: {
    width: '12px',
    height: '12px',
    backgroundColor: '#667eea',
    borderRadius: '50%',
    animation: 'bounce 1.4s infinite ease-in-out both'
  }
};
