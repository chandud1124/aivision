import axios from 'axios';
import logger from '../config/logger.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const AI_SERVICE_API_KEY = process.env.AI_SERVICE_API_KEY;

// Create axios instance with default config
const aiClient = axios.create({
  baseURL: AI_SERVICE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': AI_SERVICE_API_KEY
  }
});

// Request interceptor
aiClient.interceptors.request.use(
  (config) => {
    logger.debug(`AI Service Request: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    logger.error('AI Service Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
aiClient.interceptors.response.use(
  (response) => {
    logger.debug(`AI Service Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    logger.error('AI Service Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

/**
 * Call AI service endpoint
 * @param {string} endpoint - API endpoint path
 * @param {object} data - Request data
 * @returns {Promise<object>} Response data
 */
export const callAIService = async (endpoint, data) => {
  try {
    const response = await aiClient.post(endpoint, data);
    return response.data;
  } catch (error) {
    logger.error(`AI Service call failed for ${endpoint}:`, error);
    
    // Return error response in expected format
    return {
      success: false,
      match: false,
      spoofDetected: false,
      confidence: 0,
      error: error.response?.data?.message || error.message
    };
  }
};

/**
 * Detect faces in an image
 * @param {string} imageBase64 - Base64 encoded image
 * @returns {Promise<object>} Detection result
 */
export const detectFaces = async (imageBase64) => {
  return await callAIService('/api/ai/detect-face', { imageBase64 });
};

/**
 * Verify face against stored embedding
 * @param {string} imageBase64 - Base64 encoded image
 * @param {string} studentId - Student ID
 * @param {Array} embedding - Stored face embedding
 * @returns {Promise<object>} Verification result
 */
export const verifyFace = async (imageBase64, studentId, embedding) => {
  return await callAIService('/api/ai/verify-face', {
    imageBase64,
    studentId,
    embedding
  });
};

/**
 * Enroll a new face
 * @param {string} studentId - Student ID
 * @param {Array<string>} images - Array of base64 images
 * @returns {Promise<object>} Enrollment result
 */
export const enrollFace = async (studentId, images) => {
  return await callAIService('/api/ai/enroll-face', {
    studentId,
    images
  });
};

/**
 * Check for anti-spoofing
 * @param {string} imageBase64 - Base64 encoded image
 * @returns {Promise<object>} Anti-spoof result
 */
export const checkAntiSpoof = async (imageBase64) => {
  return await callAIService('/api/ai/anti-spoof', { imageBase64 });
};

/**
 * Get AI model status
 * @returns {Promise<object>} Model status
 */
export const getModelStatus = async () => {
  try {
    const response = await aiClient.get('/api/ai/model-status');
    return response.data;
  } catch (error) {
    logger.error('Failed to get AI model status:', error);
    return {
      success: false,
      status: 'unavailable'
    };
  }
};

export default {
  callAIService,
  detectFaces,
  verifyFace,
  enrollFace,
  checkAntiSpoof,
  getModelStatus
};
