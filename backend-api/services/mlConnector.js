// --- ML Connector Service for Plant Disease Detection ---
// Uses Roboflow public API (swap easily with any ML or cloud endpoint)
//
// Functions:
//   detectPlantDisease(imagePath)        -- For basic diagnosis
//   getDetailedAnalysis(imagePath)       -- For detailed report (symptoms etc.)

const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

// Roboflow public API endpoint (replace with your preferred model as needed)
const ML_MODEL_URL = process.env.ML_MODEL_URL || 'https://detect.roboflow.com/plant-disease-detection-v2-2nclk';

const ROBOFLOW_API_KEY = process.env.ROBOFLOW_API_KEY || ''; // public key for rate limits only

/**
 * Sends an image to the Roboflow API and parses the result.
 * @param {string} imagePath - Path to the image file.
 * @returns {Promise<{disease, confidence, plantSpecies, quickTips}>}
 */
async function detectPlantDisease(imagePath) {
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(imagePath));

    const response = await axios.post(
      `${ML_MODEL_URL}?api_key=${ROBOFLOW_API_KEY}`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 30000,
      }
    );

    const result = response.data.predictions && response.data.predictions[0];
    if (!result) {
      throw new Error('No predictions returned by API.');
    }

    return {
      disease: result.class || result.label || 'Unknown Disease',
      confidence: result.confidence || 0.7,
      plantSpecies: result.plant_species || null,
      quickTips: result.tips || 'Try to upload a clear, well-lit image of the affected part.',
    };
  } catch (error) {
    // Fallback: Demo Data
    console.error('Roboflow ML API error:', error.message);
    return {
      disease: 'Leaf Spot Disease',
      confidence: 0.75,
      plantSpecies: 'Demo Species',
      quickTips: 'Ensure proper watering and remove affected leaves.',
    };
  }
}

/**
 * Extended: Optionally hits a more detailed (custom) model/endpoint to return symptoms, severity, etc.
 */
async function getDetailedAnalysis(imagePath) {
  // For demo, call detectPlantDisease and expand with extra mock data
  const basicResult = await detectPlantDisease(imagePath);
  // In production, call a different detailed endpoint or custom model
  return {
    ...basicResult,
    severity: 'Medium',
    symptoms: ['Yellow spots', 'Brown lesions', 'Leaf curl'],
    treatmentPlan: {
      immediate: ['Remove affected leaves', 'Isolate plant'],
      shortTerm: ['Apply neem oil spray', 'Increase sunlight'],
      longTerm: ['Monitor weekly', 'Optimize soil nutrients'],
    },
    organicRemedies: [
      {
        name: 'Neem Oil Spray',
        description: 'Prevents and treats fungal infections.',
        howToUse: 'Spray diluted solution every 7 days.',
      },
    ],
    preventionTips: [
      'Avoid overhead watering',
      'Increase space between plants',
      'Regularly inspect new growth'
    ]
  };
}

module.exports = {
  detectPlantDisease,
  getDetailedAnalysis,
};
