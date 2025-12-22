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
    const errorMessage = `Missing required environment variables: ${missing.join(', ')}`;
    console.warn('⚠️ Environment validation warning:', errorMessage);

    // Em produção, não falhar o build, apenas registrar o aviso
    if (process.env.NODE_ENV === 'production') {
      console.warn('🚀 Build will continue, but authentication features may not work without proper environment variables');
      return;
    }

    // Em desenvolvimento, ainda falhar para alertar o desenvolvedor
    throw new Error(errorMessage);
  }

  // Validação adicional para URLs
  if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.startsWith('http')) {
    console.error('NEXTAUTH_URL must be a valid URL starting with http or https');
    throw new Error('NEXTAUTH_URL must be a valid URL');
  }

  console.log('✅ Environment variables validated successfully');
}

// Executa validação em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  try {
    validateEnvironment();
  } catch (error) {
    console.error('Environment validation failed:', error);
  }
}
