import React, { useState } from 'react';
import '../styles/AgronomistRegistration.css';
import { API_BASE_URL } from '../services/apiService';

const AgronomistRegistrationPage = () => {
  const [registrationType, setRegistrationType] = useState(null); // 'certified' or 'experience'
  const [step, setStep] = useState(1); // 1: Type selection, 2: Form, 3: Document upload, 4: Verification
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    locationLat: '',
    locationLong: '',
    bio: '',
    specializations: [],
    // Certified path
    qualification: '',
    certificationFile: null,
    // Experience path
    yearsExperience: '',
    experienceDescription: '',
    // Both
    identityProofFile: null,
    photoFile: null,
  });
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('pending'); // pending, verifying, verified, rejected
  const [uploadProgress, setUploadProgress] = useState(0);

  const SPECIALIZATIONS = [
    'Vegetables',
    'Fruits',
    'Cereals',
    'Pulses',
    'Spices',
    'Organic Farming',
    'Pest Management',
    'Soil Health',
  ];

  // Step 1: Select registration type
  const handleTypeSelection = (type) => {
    setRegistrationType(type);
    setStep(2);
  };

  // Step 2: Fill form data
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        specializations: checked
          ? [...prev.specializations, value]
          : prev.specializations.filter((spec) => spec !== value),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Step 3: Handle file uploads
  const handleFileUpload = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      setFormData((prev) => ({ ...prev, [name]: file }));
      setUploadProgress(0);
    }
  };

  // Step 4: Submit registration
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare FormData for file uploads
      const formDataToSend = new FormData();
      formDataToSend.append('fullName', formData.fullName);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('locationLat', formData.locationLat);
      formDataToSend.append('locationLong', formData.locationLong);
      formDataToSend.append('bio', formData.bio);
      formDataToSend.append('specializations', JSON.stringify(formData.specializations));
      formDataToSend.append('registrationType', registrationType);

      if (registrationType === 'certified') {
        formDataToSend.append('qualification', formData.qualification);
        if (formData.certificationFile) {
          formDataToSend.append('certificationFile', formData.certificationFile);
        }
      } else {
        formDataToSend.append('yearsExperience', formData.yearsExperience);
        formDataToSend.append('experienceDescription', formData.experienceDescription);
      }

      if (formData.identityProofFile) {
        formDataToSend.append('identityProofFile', formData.identityProofFile);
      }
      if (formData.photoFile) {
        formDataToSend.append('photoFile', formData.photoFile);
      }

      // Submit to backend
      const response = await fetch(`${API_BASE_URL}/agronomists/register`, {
        method: 'POST',
        body: formDataToSend,
      });

      if (response.ok) {
        setVerificationStatus('verifying');
        setStep(4);
        // Trigger email notification
        // Send verification initiation email
      } else {
        alert('Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="agronomist-registration">
      {step === 1 && (
        <div className="step-container">
          <h2>Register as an Agricultural Expert</h2>
          <p>Choose your registration path:</p>
          <div className="type-selector">
            <div
              className="type-card certified"
              onClick={() => handleTypeSelection('certified')}
            >
              <h3>Certified Agronomist</h3>
              <p>I have an agricultural degree or professional certification</p>
              <ul>
                <li>Higher priority in matching</li>
                <li>OfficeEducation-based verification</li>
              </ul>
            </div>
            <div
              className="type-card experience"
              onClick={() => handleTypeSelection('experience')}
            >
              <h3>Industry Expert</h3>
              <p>I have hands-on agricultural industry experience</p>
              <ul>
                <li>Fair platform for experienced practitioners</li>
                <li>Experience-based verification</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <form className="registration-form" onSubmit={(e) => { e.preventDefault(); setStep(3); }}>
          <h2>{registrationType === 'certified' ? 'Certified Agronomist' : 'Industry Expert'} Registration</h2>

          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleFormChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleFormChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Phone *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleFormChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Location Latitude *</label>
              <input
                type="number"
                name="locationLat"
                value={formData.locationLat}
                onChange={handleFormChange}
                step="0.0001"
                required
              />
            </div>
            <div className="form-group">
              <label>Location Longitude *</label>
              <input
                type="number"
                name="locationLong"
                value={formData.locationLong}
                onChange={handleFormChange}
                step="0.0001"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleFormChange}
              placeholder="Tell about yourself, your experience, and expertise"
              rows="4"
            />
          </div>

          <div className="form-group">
            <label>Specializations *</label>
            <div className="checkbox-group">
              {SPECIALIZATIONS.map((spec) => (
                <label key={spec}>
                  <input
                    type="checkbox"
                    value={spec}
                    checked={formData.specializations.includes(spec)}
                    onChange={handleFormChange}
                  />
                  {spec}
                </label>
              ))}
            </div>
          </div>

          {registrationType === 'certified' && (
            <div className="form-group">
              <label>Qualification/Degree *</label>
              <input
                type="text"
                name="qualification"
                value={formData.qualification}
                onChange={handleFormChange}
                placeholder="e.g., B.Sc. Agriculture, M.Tech Horticulture"
                required
              />
            </div>
          )}

          {registrationType === 'experience' && (
            <>
              <div className="form-group">
                <label>Years of Experience *</label>
                <input
                  type="number"
                  name="yearsExperience"
                  value={formData.yearsExperience}
                  onChange={handleFormChange}
                  min="1"
                  required
                />
              </div>
              <div className="form-group">
                <label>Experience Description *</label>
                <textarea
                  name="experienceDescription"
                  value={formData.experienceDescription}
                  onChange={handleFormChange}
                  placeholder="Describe your agricultural industry experience"
                  rows="4"
                  required
                />
              </div>
            </>
          )}

          <button type="button" onClick={() => setStep(1)} className="btn-secondary">
            Back
          </button>
          <button type="submit" className="btn-primary">
            Continue to Document Upload
          </button>
        </form>
      )}

      {step === 3 && (
        <div className="document-upload">
          <h2>Upload Documents for Verification</h2>
          <p>Upload clear, legible documents for AI-based verification (auto-verified within 24 hours)</p>

          <div className="upload-group">
            <h3>Identity Proof *</h3>
            <p className="help-text">Aadhaar, Passport, or Driver's License (Clearly visible name and photo)</p>
            <input
              type="file"
              name="identityProofFile"
              onChange={handleFileUpload}
              accept="image/*,.pdf"
              required
            />
            {formData.identityProofFile && (
              <p className="file-name">✓ {formData.identityProofFile.name}</p>
            )}
          </div>

          {registrationType === 'certified' && (
            <div className="upload-group">
              <h3>Certification Document *</h3>
              <p className="help-text">Agricultural degree certificate, diploma, or professional certification</p>
              <input
                type="file"
                name="certificationFile"
                onChange={handleFileUpload}
                accept="image/*,.pdf"
                required
              />
              {formData.certificationFile && (
                <p className="file-name">✓ {formData.certificationFile.name}</p>
              )}
            </div>
          )}

          <div className="upload-group">
            <h3>Profile Photo</h3>
            <p className="help-text">Clear photograph of yourself (for profile)</p>
            <input
              type="file"
              name="photoFile"
              onChange={handleFileUpload}
              accept="image/*"
            />
            {formData.photoFile && (
              <p className="file-name">✓ {formData.photoFile.name}</p>
            )}
          </div>

          <div className="verification-note">
            <h4>AI Verification Process</h4>
            <ul>
              <li>Your documents will be scanned using AI technology</li>
              <li>Compared against certified agronomy certificate templates from recognized institutions</li>
              <li>Auto-verified within 24 hours</li>
              <li>Random documents will be rejected automatically</li>
              <li>You'll receive email notification of verification status</li>
            </ul>
          </div>

          <button type="button" onClick={() => setStep(2)} className="btn-secondary">
            Back
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Submitting...' : 'Submit for Verification'}
          </button>
        </div>
      )}

      {step === 4 && (
        <div className="verification-pending">
          <h2>Registration Submitted</h2>
          <div className="status-box">
            <p className="status-verifying">✓ Documents received</p>
            <p>Verification in progress...</p>
            <p className="timeline">Expected completion: Within 24 hours</p>
          </div>
          <div className="email-notification">
            <p>An email has been sent to <strong>{formData.email}</strong></p>
            <p>You'll receive updates on your verification status</p>
            <p className="next-steps">Once verified, you can start accepting consultation requests from users</p>
          </div>
          <button onClick={() => window.location.href = '/'} className="btn-primary">
            Go to Dashboard
          </button>
        </div>
      )}
    </div>
  );
};

export default AgronomistRegistrationPage;
