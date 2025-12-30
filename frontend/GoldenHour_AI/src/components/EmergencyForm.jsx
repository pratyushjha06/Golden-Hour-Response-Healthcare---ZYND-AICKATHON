import { useState } from 'react';
import { useTriageEmergency } from '../hooks';


export default function EmergencyForm({ onEmergencyCreated }) {
  const [formData, setFormData] = useState({
    patientName: '',
    age: '',
    gender: '',
    bloodPressure: '',
    heartRate: '',
    oxygenLevel: '',
    symptoms: '',
    latitude: '',
    longitude: ''
  });


  const { mutate: submitEmergency, isPending, error } = useTriageEmergency();


  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };


  const handleSubmit = (e) => {
    e.preventDefault();
    
    const emergencyData = {
      patientName: formData.patientName,
      age: formData.age,
      gender: formData.gender,
      vitals: {
        bloodPressure: formData.bloodPressure,
        heartRate: formData.heartRate ? parseInt(formData.heartRate) : null,
        oxygenLevel: formData.oxygenLevel ? parseInt(formData.oxygenLevel) : null
      },
      symptoms: formData.symptoms,
      location: {
        lat: formData.latitude ? parseFloat(formData.latitude) : null,
        lng: formData.longitude ? parseFloat(formData.longitude) : null
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
          bloodPressure: '',
          heartRate: '',
          oxygenLevel: '',
          symptoms: '',
          latitude: '',
          longitude: ''
        });
      }
    });
  };


  // Auto-fill with test data
  const fillTestData = () => {
    setFormData({
      patientName: 'Rajesh Kumar',
      age: '40-45',
      gender: 'Male',
      bloodPressure: '140/90',
      heartRate: '95',
      oxygenLevel: '92',
      symptoms: 'Severe chest pain, shortness of breath, sweating',
      latitude: '28.7041',
      longitude: '77.1025'
    });
  };


  // Age range options
  const ageRanges = [
    '0-5',
    '5-10',
    '10-15',
    '15-20',
    '20-25',
    '25-30',
    '30-35',
    '35-40',
    '40-45',
    '45-50',
    '50-55',
    '55-60',
    '60-65',
    '65-70',
    '70-75',
    '75-80',
    '80-85',
    '85-90',
    '90-95',
    '95-100',
    '100+'
  ];


  // Gender options
  const genderOptions = ['Male', 'Female', 'Others'];


  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>🚨 Emergency Intake Form</h2>
        <button onClick={fillTestData} style={styles.testButton}>
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
            <label style={styles.label}>Describe Symptoms</label>
            <textarea
              name="symptoms"
              value={formData.symptoms}
              onChange={handleChange}
              style={styles.textarea}
              placeholder="Describe all symptoms in detail..."
              rows="4"
            />
          </div>
        </div>


        {/* Location */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Location</h3>
          <div style={styles.row}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Latitude</label>
              <input
                type="number"
                step="any"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                style={styles.input}
                placeholder="28.7041"
              />
            </div>


            <div style={styles.formGroup}>
              <label style={styles.label}>Longitude</label>
              <input
                type="number"
                step="any"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                style={styles.input}
                placeholder="77.1025"
              />
            </div>
          </div>
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
