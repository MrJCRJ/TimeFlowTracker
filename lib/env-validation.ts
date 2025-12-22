// Validação das variáveis de ambiente necessárias
const requiredEnvVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
];

export function validateEnvironment() {
  const missing = requiredEnvVars.filter((envVar) => !process.env[envVar]);

  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validação adicional para URLs
  if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.startsWith('http')) {
    console.error('NEXTAUTH_URL must be a valid URL starting with http or https');
    throw new Error('NEXTAUTH_URL must be a valid URL');
  }

  console.log('Environment variables validated successfully');
}

// Executa validação em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  try {
    validateEnvironment();
  } catch (error) {
    console.error('Environment validation failed:', error);
  }
}
