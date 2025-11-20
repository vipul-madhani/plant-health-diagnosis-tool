// API Service Module for Plant Health Diagnosis Tool

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/**
 * Handle API errors with consistent error messages
 */
const handleError = (error) => {
  if (error.response) {
    // Server responded with error status
    throw new Error(error.response.data?.message || `Error: ${error.response.status}`);
  } else if (error.request) {
    // Request made but no response
    throw new Error('No response from server. Please check your connection.');
  } else {
    throw new Error(error.message || 'An unknown error occurred');
  }
};

/**
 * Diagnose plant from image
 * @param {File} file - Image file (File object from input)
 * @returns {Promise<Object>} - Diagnosis results
 */
export const diagnosePlant = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: 'POST',
    body: formData,  // pass raw FormData
  });

  if (!response.ok) {
    let msg = `HTTP error! status: ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) msg = JSON.stringify(errJson.detail);
    } catch {}
    throw new Error(msg);
  }

  return await response.json();
};



/**
 * Get plant species information
 * @param {string} speciesName - Plant species name
 * @returns {Promise<Object>} - Species information
 */
export const getSpeciesInfo = async (speciesName) => {
  try {
    const response = await fetch(`${API_BASE_URL}/species/${encodeURIComponent(speciesName)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Species info API error:', error);
    throw error;
  }
};

/**
 * Get disease treatments
 * @param {string} diseaseName - Disease name
 * @param {string} plantSpecies - Plant species
 * @returns {Promise<Object>} - Treatment information
 */
export const getTreatments = async (diseaseName, plantSpecies) => {
  try {
    const params = new URLSearchParams({
      disease: diseaseName,
      species: plantSpecies,
    });

    const response = await fetch(`${API_BASE_URL}/treatments?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Treatments API error:', error);
    throw error;
  }
};

/**
 * Get geo-aware solutions
 * @param {number} latitude - User latitude
 * @param {number} longitude - User longitude
 * @param {string} diseaseName - Disease name
 * @returns {Promise<Object>} - Geo-aware solutions
 */
export const getGeoAwareSolutions = async (latitude, longitude, diseaseName) => {
  try {
    const params = new URLSearchParams({
      lat: latitude,
      lon: longitude,
      disease: diseaseName,
    });

    const response = await fetch(`${API_BASE_URL}/solutions?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Geo-aware solutions API error:', error);
    throw error;
  }
};

/**
 * Validate image before upload
 * @param {File} file - Image file
 * @returns {Object} - Validation result
 */
export const validateImageFile = (file) => {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Please upload JPEG, PNG, or WebP.' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 10MB limit' };
  }

  return { valid: true };
};

/**
 * Get user's geolocation
 * @returns {Promise<Object>} - User location coordinates
 */
export const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported by browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(new Error(`Geolocation error: ${error.message}`));
      }
    );
  });
};
export function loginUser() { return Promise.resolve({}); }
export function registerUser() { return Promise.resolve({}); }
export function logoutUser() { return Promise.resolve({}); }
export function refreshAccessToken() { return Promise.resolve({}); }

export default {
  diagnosePlant,
  getSpeciesInfo,
  getTreatments,
  getGeoAwareSolutions,
  validateImageFile,
  getUserLocation,
};
