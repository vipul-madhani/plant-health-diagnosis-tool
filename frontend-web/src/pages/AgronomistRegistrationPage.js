import React, { useState } from 'react';
import '../styles/AgronomistRegistration.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AgronomistRegistrationPage = () => {
  const [registrationType, setRegistrationType] = useState(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    locationLat: '',
    locationLong: '',
    bio: '',
    specializations: [],
    qualification: '',
    certificationFile: null,
    yearsExperience: '',
    experienceDescription: '',
    identityProofFile: null,
    photoFile: null,
  });
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState('pending');
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

  const handleTypeSelection = (type) => {
    setRegistrationType(type);
    setStep(2);
  };

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

  const handleFileUpload = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      setFormData((prev) => ({ ...prev, [name]: file }));
      setUploadProgress(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
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

      if (formData.identityProofFile) formDataToSend.append('identityProofFile', formData.identityProofFile);
      if (formData.photoFile) formDataToSend.append('photoFile', formData.photoFile);

      const response = await fetch(`${API_URL}/api/agronomist/register`, {
        method: 'POST',
        body: formDataToSend,
      });
      if (response.ok) {
        setVerificationStatus('verifying');
        setStep(4);
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
      {/* Registration Steps -- same as before, omitted for brevity */}
    </div>
  );
};

export default AgronomistRegistrationPage;
