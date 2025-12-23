/**
 * Constantes da aplicação
 */

// App
export const APP_NAME = 'TimeFlow Tracker';
export const APP_DESCRIPTION = 'Gerenciador de tempo inteligente';
export const APP_VERSION = '1.0.0';

// Storage Keys
export const STORAGE_KEYS = {
  TIMER_STATE: 'timeflow_timer_state',
  CATEGORIES: 'timeflow_categories',
  TIME_ENTRIES: 'timeflow_time_entries',
  PREFERENCES: 'timeflow_preferences',
  SYNC_METADATA: 'timeflow_sync_metadata',
  THEME: 'timeflow_theme',
} as const;

// Google Drive
export const DRIVE_FOLDER_NAME = 'TimeFlowTracker';
export const DRIVE_FILES = {
  CATEGORIES: 'categories.json',
  TIME_ENTRIES: 'time_entries.json',
  PREFERENCES: 'preferences.json',
  SYNC_METADATA: 'sync-metadata.json',
} as const;

// API Routes
export const API_ROUTES = {
  AUTH: '/api/auth',
  DRIVE_SYNC: '/api/drive/sync',
  DRIVE_BACKUP: '/api/drive/backup',
  DRIVE_ACTIVE_TIMER: '/api/drive/active-timer',
  TIMER_ACTIVE: '/api/timer/active',
  TIMER_START: '/api/timer/start',
  TIMER_STOP: '/api/timer/stop',
} as const;

// App Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/',
  CATEGORIES: '/categories',
  ANALYTICS: '/analytics',
  SETTINGS: '/settings',
} as const;

// Timer
export const TIMER_UPDATE_INTERVAL = 1000; // 1 segundo
export const TIMER_SYNC_INTERVAL = 60000; // 1 minuto
export const AUTO_SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutos

// UI
export const TOAST_DURATION = 5000; // 5 segundos
export const DEBOUNCE_DELAY = 300; // 300ms
export const ANIMATION_DURATION = 200; // 200ms

// Limits
export const MAX_CATEGORY_NAME_LENGTH = 50;
export const MAX_NOTE_LENGTH = 500;
export const MAX_CATEGORIES_PER_USER = 50;
export const MAX_ENTRIES_PER_PAGE = 50;

// Colors predefinidas para categorias
export const CATEGORY_COLORS = [
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Violeta', value: '#8b5cf6' },
  { name: 'Verde', value: '#22c55e' },
  { name: 'Âmbar', value: '#f59e0b' },
  { name: 'Índigo', value: '#6366f1' },
  { name: 'Rosa', value: '#ec4899' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Cinza', value: '#6b7280' },
  { name: 'Vermelho', value: '#ef4444' },
  { name: 'Laranja', value: '#f97316' },
  { name: 'Lima', value: '#84cc16' },
  { name: 'Ciano', value: '#06b6d4' },
] as const;

// Ícones disponíveis para categorias
export const CATEGORY_ICONS = [
  { name: 'Trabalho', value: 'briefcase' },
  { name: 'Estudo', value: 'book' },
  { name: 'Exercício', value: 'dumbbell' },
  { name: 'Lazer', value: 'gamepad-2' },
  { name: 'Sono', value: 'moon' },
  { name: 'Alimentação', value: 'utensils' },
  { name: 'Transporte', value: 'car' },
  { name: 'Outros', value: 'folder' },
  { name: 'Código', value: 'code' },
  { name: 'Música', value: 'music' },
  { name: 'Vídeo', value: 'video' },
  { name: 'Chat', value: 'message-circle' },
  { name: 'Email', value: 'mail' },
  { name: 'Reunião', value: 'users' },
  { name: 'Saúde', value: 'heart' },
  { name: 'Compras', value: 'shopping-cart' },
] as const;

// Erros
export const ERROR_MESSAGES = {
  GENERIC: 'Ocorreu um erro. Tente novamente.',
  NETWORK: 'Erro de conexão. Verifique sua internet.',
  UNAUTHORIZED: 'Você precisa estar logado para acessar este recurso.',
  FORBIDDEN: 'Você não tem permissão para acessar este recurso.',
  NOT_FOUND: 'Recurso não encontrado.',
  VALIDATION: 'Por favor, verifique os dados informados.',
  SYNC_FAILED: 'Falha na sincronização. Tentando novamente...',
  TIMER_ERROR: 'Erro ao processar o timer.',
  CATEGORY_LIMIT: `Limite de ${MAX_CATEGORIES_PER_USER} categorias atingido.`,
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  CATEGORY_CREATED: 'Categoria criada com sucesso!',
  CATEGORY_UPDATED: 'Categoria atualizada com sucesso!',
  CATEGORY_DELETED: 'Categoria excluída com sucesso!',
  TIMER_STARTED: 'Timer iniciado!',
  TIMER_STOPPED: 'Timer parado!',
  SYNC_COMPLETE: 'Sincronização concluída!',
  SETTINGS_SAVED: 'Configurações salvas!',
} as const;
