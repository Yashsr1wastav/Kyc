// Environment variables validation and configuration
export const env = {
  // IBM Watson Discovery
  IBM_DISCOVERY_APIKEY: process.env.IBM_DISCOVERY_APIKEY || '',
  IBM_DISCOVERY_URL: process.env.IBM_DISCOVERY_URL || '',
  IBM_DISCOVERY_PROJECT_ID: process.env.IBM_DISCOVERY_PROJECT_ID || '',
  IBM_DISCOVERY_COLLECTION_ID: process.env.IBM_DISCOVERY_COLLECTION_ID || '',

  // Watsonx.ai
  WATSONX_APIKEY: process.env.WATSONX_APIKEY || '',
  WATSONX_URL: process.env.WATSONX_URL || '',

  // AWS
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  AWS_BEDROCK_TITAN_MODEL_ID: process.env.AWS_BEDROCK_TITAN_MODEL_ID || 'amazon.titan-text-premier-v1',

  // NextAuth
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || '',

  // App
  ADMIN_USERNAME: process.env.ADMIN_USERNAME || 'admin',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || '',
};

// Validate required environment variables
export function validateEnv() {
  const required = [
    'IBM_DISCOVERY_APIKEY',
    'IBM_DISCOVERY_URL',
    'IBM_DISCOVERY_PROJECT_ID',
    'IBM_DISCOVERY_COLLECTION_ID',
    'WATSONX_APIKEY',
    'WATSONX_URL',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'NEXTAUTH_SECRET',
    'ADMIN_PASSWORD'
  ];

  const missing = required.filter(key => !env[key as keyof typeof env]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
