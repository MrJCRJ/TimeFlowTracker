const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Caminho para o app Next.js para carregar next.config.js e .env files
  dir: './',
});

/** @type {import('jest').Config} */
const customJestConfig = {
  // Setup files para executar após o ambiente Jest ser instalado
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Ambiente de teste
  testEnvironment: 'jsdom',

  // Mapeamento de módulos (corresponde aos paths do tsconfig)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@/stores/(.*)$': '<rootDir>/stores/$1',
    '^@/types/(.*)$': '<rootDir>/types/$1',
    '^@/__tests__/(.*)$': '<rootDir>/__tests__/$1',
  },

  // Padrões de arquivos de teste
  testMatch: [
    '**/__tests__/**/*.(test|spec).[jt]s?(x)',
    '**/?(*.)+(test|spec).[jt]s?(x)',
  ],

  // Arquivos a ignorar
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/cypress/',
  ],

  // Cobertura de código
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    'stores/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
  ],

  // Diretório de cobertura
  coverageDirectory: '<rootDir>/coverage',

  // Reporters de cobertura
  coverageReporters: ['text', 'lcov', 'html'],

  // Limites de cobertura
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // Transformações
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },

  // Extensões de módulo
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Verbose output
  verbose: true,

  // Limite de workers
  maxWorkers: '50%',

  // Timeout para testes
  testTimeout: 10000,

  // Reset mocks entre testes
  resetMocks: true,

  // Limpar mocks automaticamente
  clearMocks: true,

  // Restaurar mocks após cada teste
  restoreMocks: true,
};

module.exports = createJestConfig(customJestConfig);
