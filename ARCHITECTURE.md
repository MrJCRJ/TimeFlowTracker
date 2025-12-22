# 🏗️ Arquitetura TimeFlow Tracker

## 📋 Visão Geral

**TimeFlow Tracker** é uma aplicação PWA (Progressive Web App) para gerenciamento de tempo, construída com foco em:
- **Produtividade**: Timer ativo para tracking de atividades
- **Análise**: Dashboard com gráficos e estatísticas
- **Sincronização**: Backup automático via Google Drive
- **Offline-first**: Funciona sem conexão com internet

---

## 🛠️ Stack Tecnológico

### Core
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| Next.js | 14.x | Framework React com App Router |
| TypeScript | 5.x | Type safety e DX |
| Tailwind CSS | 3.x | Estilização utility-first |
| shadcn/ui | latest | Componentes acessíveis |

### Autenticação & Storage
| Tecnologia | Propósito |
|------------|-----------|
| NextAuth.js | Autenticação OAuth |
| Google OAuth 2.0 | Login único |
| Google Drive API | Armazenamento de dados |

### Estado & Dados
| Tecnologia | Propósito |
|------------|-----------|
| Zustand | Gerenciamento de estado global |
| localStorage | Cache offline |
| IndexedDB | Persistência offline robusta |

### Testes
| Tecnologia | Propósito |
|------------|-----------|
| Jest | Unit tests |
| React Testing Library | Component tests |
| Cypress | E2E tests |
| MSW | Mock Service Worker |

### PWA
| Tecnologia | Propósito |
|------------|-----------|
| next-pwa | Service Worker & caching |
| Workbox | Estratégias de cache |

---

## 📁 Estrutura de Pastas

```
timeflow-tracker/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Grupo de rotas de autenticação
│   │   ├── login/
│   │   │   └── page.tsx          # Página de login
│   │   └── callback/
│   │       └── page.tsx          # Callback OAuth
│   │
│   ├── (dashboard)/              # Grupo de rotas autenticadas
│   │   ├── layout.tsx            # Layout com sidebar e timer
│   │   ├── page.tsx              # Dashboard principal
│   │   ├── categories/
│   │   │   ├── page.tsx          # Lista de categorias
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Edição de categoria
│   │   └── analytics/
│   │       └── page.tsx          # Análises detalhadas
│   │
│   ├── api/                      # API Routes
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts      # NextAuth handler
│   │   ├── drive/
│   │   │   ├── sync/
│   │   │   │   └── route.ts      # Sincronização Drive
│   │   │   └── backup/
│   │   │       └── route.ts      # Backup manual
│   │   └── timer/
│   │       └── route.ts          # API do timer
│   │
│   ├── globals.css               # Estilos globais
│   ├── layout.tsx                # Root layout
│   └── not-found.tsx             # Página 404
│
├── components/                   # Componentes React
│   ├── ui/                       # Componentes base (shadcn)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── skeleton.tsx
│   │   └── toast.tsx
│   │
│   ├── timer/                    # Componentes do Timer
│   │   ├── TimerBar.tsx          # Barra fixa inferior
│   │   ├── TimerDisplay.tsx      # Display do tempo
│   │   └── CategorySelector.tsx  # Seletor de categoria
│   │
│   ├── categories/               # Componentes de Categorias
│   │   ├── CategoryForm.tsx      # Form criar/editar
│   │   ├── CategoryCard.tsx      # Card de categoria
│   │   └── CategoryList.tsx      # Lista de categorias
│   │
│   ├── analytics/                # Componentes de Analytics
│   │   ├── TimeChart.tsx         # Gráfico principal
│   │   ├── StatCard.tsx          # Card de estatística
│   │   ├── TrendChart.tsx        # Gráfico de tendência
│   │   └── DateFilter.tsx        # Filtro de datas
│   │
│   ├── layout/                   # Componentes de Layout
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Footer.tsx
│   │   └── Navigation.tsx
│   │
│   └── shared/                   # Componentes compartilhados
│       ├── ErrorBoundary.tsx
│       ├── LoadingSpinner.tsx
│       ├── EmptyState.tsx
│       └── ConfirmDialog.tsx
│
├── lib/                          # Bibliotecas e utilitários
│   ├── auth.ts                   # Helpers de autenticação
│   ├── drive.ts                  # Google Drive service
│   ├── utils.ts                  # Funções utilitárias
│   ├── constants.ts              # Constantes da aplicação
│   └── validations.ts            # Schemas de validação
│
├── hooks/                        # Custom React Hooks
│   ├── useTimer.ts               # Hook do timer
│   ├── useCategories.ts          # Hook de categorias
│   ├── useTimeEntries.ts         # Hook de entradas
│   ├── useSync.ts                # Hook de sincronização
│   └── useOffline.ts             # Hook para modo offline
│
├── stores/                       # Zustand stores
│   ├── timerStore.ts             # Estado do timer
│   ├── categoryStore.ts          # Estado de categorias
│   └── userStore.ts              # Estado do usuário
│
├── types/                        # TypeScript types
│   ├── index.ts                  # Export central
│   ├── category.ts               # Tipos de categoria
│   ├── timer.ts                  # Tipos do timer
│   ├── user.ts                   # Tipos de usuário
│   └── api.ts                    # Tipos de API
│
├── __tests__/                    # Testes
│   ├── unit/                     # Testes unitários
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── stores/
│   │
│   ├── components/               # Testes de componentes
│   │   ├── timer/
│   │   ├── categories/
│   │   └── analytics/
│   │
│   ├── integration/              # Testes de integração
│   │   └── api/
│   │
│   └── mocks/                    # Mocks para testes
│       ├── handlers.ts           # MSW handlers
│       ├── data.ts               # Dados mockados
│       └── server.ts             # MSW server setup
│
├── cypress/                      # Testes E2E
│   ├── e2e/
│   │   ├── auth.cy.ts
│   │   ├── timer.cy.ts
│   │   └── categories.cy.ts
│   ├── fixtures/
│   └── support/
│
├── public/                       # Assets estáticos
│   ├── icons/                    # Ícones PWA
│   │   ├── icon-72x72.png
│   │   ├── icon-96x96.png
│   │   ├── icon-128x128.png
│   │   ├── icon-144x144.png
│   │   ├── icon-152x152.png
│   │   ├── icon-192x192.png
│   │   ├── icon-384x384.png
│   │   └── icon-512x512.png
│   ├── manifest.json             # PWA manifest
│   └── favicon.ico
│
├── .env.local                    # Variáveis de ambiente (local)
├── .env.example                  # Exemplo de variáveis
├── .eslintrc.json                # Configuração ESLint
├── .prettierrc                   # Configuração Prettier
├── jest.config.js                # Configuração Jest
├── jest.setup.js                 # Setup Jest
├── cypress.config.ts             # Configuração Cypress
├── next.config.js                # Configuração Next.js
├── tailwind.config.js            # Configuração Tailwind
├── tsconfig.json                 # Configuração TypeScript
├── package.json                  # Dependências
└── README.md                     # Documentação
```

---

## 🔄 Fluxo de Dados

### Arquitetura de Estado

```
┌─────────────────────────────────────────────────────────────────┐
│                        COMPONENTES UI                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  TimerBar   │  │ CategoryList│  │  TimeChart  │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
└─────────┼────────────────┼────────────────┼─────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CUSTOM HOOKS                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  useTimer   │  │useCategories│  │useTimeEntries│             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
└─────────┼────────────────┼────────────────┼─────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ZUSTAND STORES                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ timerStore  │  │categoryStore│  │  userStore  │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
└─────────┼────────────────┼────────────────┼─────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PERSISTÊNCIA                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ localStorage│  │  IndexedDB  │  │ Google Drive│              │
│  │   (cache)   │  │  (offline)  │  │   (cloud)   │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

### Fluxo de Sincronização

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    LOCAL     │────▶│   SYNC       │────▶│ GOOGLE DRIVE │
│   STORAGE    │◀────│   MANAGER    │◀────│     API      │
└──────────────┘     └──────────────┘     └──────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │   CONFLICT   │
                    │  RESOLUTION  │
                    │(last-write)  │
                    └──────────────┘
```

---

## 📊 Modelos de Dados

### Category
```typescript
interface Category {
  id: string;              // UUID v4
  name: string;            // Max 50 chars
  color: string;           // Hex color (#RRGGBB)
  icon: string;            // Lucide icon name
  isDefault: boolean;      // Categoria padrão do sistema
  userId: string;          // ID do usuário owner
  createdAt: string;       // ISO 8601 timestamp
  updatedAt: string;       // ISO 8601 timestamp
}
```

### TimeEntry
```typescript
interface TimeEntry {
  id: string;              // UUID v4
  categoryId: string;      // FK para Category
  startTime: string;       // ISO 8601 timestamp
  endTime: string | null;  // null se timer ativo
  duration: number | null; // Duração em segundos
  userId: string;          // ID do usuário
  notes: string | null;    // Notas opcionais
  createdAt: string;       // ISO 8601 timestamp
  updatedAt: string;       // ISO 8601 timestamp
}
```

### UserPreferences
```typescript
interface UserPreferences {
  userId: string;
  workHours: {
    start: string;         // HH:mm format
    end: string;           // HH:mm format
  };
  dailyGoals: Record<string, number>;  // categoryId -> minutos
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  autoSync: boolean;
  syncInterval: number;    // minutos
}
```

### SyncMetadata
```typescript
interface SyncMetadata {
  lastSyncAt: string;      // ISO 8601 timestamp
  driveFileIds: {
    categories: string;    // ID arquivo no Drive
    timeEntries: string;   // ID arquivo no Drive
    preferences: string;   // ID arquivo no Drive
  };
  pendingChanges: number;
  conflictCount: number;
}
```

---

## 🔐 Autenticação

### Fluxo OAuth 2.0

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  USUÁRIO │────▶│  LOGIN   │────▶│  GOOGLE  │────▶│ CALLBACK │
│          │     │  PAGE    │     │  OAUTH   │     │  HANDLER │
└──────────┘     └──────────┘     └──────────┘     └────┬─────┘
                                                        │
     ┌──────────────────────────────────────────────────┘
     ▼
┌──────────┐     ┌──────────┐     ┌──────────┐
│ NEXTAUTH │────▶│  SESSION │────▶│DASHBOARD │
│  JWT     │     │  CREATED │     │  ACCESS  │
└──────────┘     └──────────┘     └──────────┘
```

### Scopes Necessários
```typescript
const GOOGLE_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/drive.file',  // Arquivos criados pelo app
];
```

---

## 🌐 API Routes

### Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/auth/[...nextauth]` | NextAuth handlers |
| GET | `/api/drive/sync` | Buscar dados do Drive |
| POST | `/api/drive/sync` | Enviar dados para Drive |
| POST | `/api/drive/backup` | Backup manual completo |
| GET | `/api/timer/active` | Timer ativo atual |
| POST | `/api/timer/start` | Iniciar timer |
| POST | `/api/timer/stop` | Parar timer |

### Response Format
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  timestamp: string;
}
```

---

## 🧪 Estratégia de Testes (TDD)

### Pirâmide de Testes

```
           ┌───────────┐
           │   E2E     │  10%
           │  Cypress  │
           ├───────────┤
           │Integration│  20%
           │   Tests   │
           ├───────────┤
           │   Unit    │  70%
           │   Tests   │
           └───────────┘
```

### Ciclo TDD

```
┌─────────────────────────────────────────────────────────┐
│                    CICLO TDD                            │
│                                                         │
│   ┌─────────┐     ┌─────────┐     ┌─────────┐          │
│   │  RED    │────▶│  GREEN  │────▶│ REFACTOR│          │
│   │ (teste  │     │ (código │     │ (melhora│          │
│   │  falha) │     │  passa) │     │  código)│          │
│   └────┬────┘     └─────────┘     └────┬────┘          │
│        │                               │               │
│        └───────────────────────────────┘               │
│                    REPEAT                              │
└─────────────────────────────────────────────────────────┘
```

### Convenções de Teste

```typescript
// Nomenclatura: [Unidade].[método/ação].[cenário]
describe('TimerBar', () => {
  describe('quando usuário clica em categoria', () => {
    it('deve iniciar o timer', () => { });
    it('deve mostrar tempo decorrido', () => { });
  });
  
  describe('quando timer está ativo', () => {
    it('deve permitir parar', () => { });
    it('deve persistir no refresh', () => { });
  });
});
```

---

## 📱 PWA Configuration

### Manifest
```json
{
  "name": "TimeFlow Tracker",
  "short_name": "TimeFlow",
  "description": "Gerenciador de tempo inteligente",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#3b82f6",
  "icons": [...]
}
```

### Estratégias de Cache
| Recurso | Estratégia |
|---------|------------|
| Páginas HTML | Network First |
| Assets estáticos | Cache First |
| API calls | Stale While Revalidate |
| Imagens | Cache First |

### Offline Support
```typescript
// Service Worker estratégia
const offlineStrategy = {
  // Dados críticos cacheados
  critical: ['categories', 'activeTimer', 'preferences'],
  
  // Queue de sincronização offline
  syncQueue: 'timeflow-sync-queue',
  
  // Fallback pages
  fallback: '/offline.html'
};
```

---

## 🔒 Segurança

### Checklist
- [x] Variáveis sensíveis em `.env`
- [x] CSRF protection (NextAuth built-in)
- [x] Validação de inputs (Zod schemas)
- [x] Sanitização de outputs
- [x] Rate limiting em API routes
- [x] Content Security Policy
- [x] HTTPS obrigatório em produção

### Environment Variables
```env
# .env.local
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
```

---

## 🚀 Performance

### Métricas Alvo (Core Web Vitals)
| Métrica | Alvo |
|---------|------|
| LCP | < 2.5s |
| FID | < 100ms |
| CLS | < 0.1 |

### Otimizações
- **Code Splitting**: Lazy load de componentes pesados
- **Image Optimization**: next/image com WebP
- **Font Optimization**: next/font com subset
- **Memoization**: useMemo/useCallback estratégico
- **Virtual Lists**: Para listas longas de time entries

---

## 🎨 Design System

### Cores
```css
:root {
  --primary: #3b82f6;     /* Blue 500 */
  --secondary: #8b5cf6;   /* Violet 500 */
  --success: #22c55e;     /* Green 500 */
  --warning: #f59e0b;     /* Amber 500 */
  --danger: #ef4444;      /* Red 500 */
  --background: #0f172a;  /* Slate 900 */
  --foreground: #f8fafc;  /* Slate 50 */
}
```

### Componentes Base (shadcn/ui)
- Button (variants: default, outline, ghost, destructive)
- Card (variants: default, elevated)
- Input (variants: default, error)
- Dialog (modal)
- Toast (notifications)
- Select (dropdown)
- Skeleton (loading)

---

## 📈 Roadmap

### MVP (v1.0)
- [x] Autenticação Google
- [x] CRUD Categorias
- [x] Timer básico
- [x] Dashboard simples
- [x] Sync Google Drive

### v1.1
- [ ] Modo offline robusto
- [ ] Push notifications
- [ ] Export relatórios (PDF)

### v2.0
- [ ] Pomodoro timer
- [ ] Integrações (Slack, Calendar)
- [ ] Multi-workspace
- [ ] Colaboração em equipe

---

## 📝 Convenções de Código

### Commits (Conventional Commits)
```
feat: adiciona timer persistente
fix: corrige cálculo de duração
test: adiciona testes do TimerBar
refactor: extrai hook useTimer
docs: atualiza README
```

### Branches
```
main           # Produção
develop        # Desenvolvimento
feature/*      # Novas features
bugfix/*       # Correções
hotfix/*       # Correções urgentes
```

---

*Documento gerado em: 22 de dezembro de 2024*
*Versão: 1.0.0*
