# TimeFlow Tracker - AI Coding Guidelines

## 🏗️ Architecture Overview

**TimeFlow Tracker** is a PWA time-tracking app built with Next.js 14 App Router, featuring Google Drive sync and offline-first design.

### Core Architecture Patterns

**Data Flow**: `Components → Custom Hooks → Zustand Stores → Persistence`

- Components use custom hooks (never directly access stores)
- Hooks encapsulate business logic and state management
- Stores handle data persistence and cross-component state
- Three-tier persistence: localStorage (cache) → IndexedDB (offline) → Google Drive (cloud)

**State Management**:

```typescript
// Stores use Zustand with persistence middleware
interface TimerStore extends TimerStoreState, TimerStoreActions {}
const useTimerStore = create<TimerStore>()(
  persist(storeLogic, {
    name: 'timeflow_timer_state',
    storage: createJSONStorage(() => localStorage),
  })
);
```

**Sync Strategy**:

- **Debounce**: Groups changes before syncing (prevents excessive API calls)
- **Throttle**: Limits sync frequency (avoids rate limiting)
- **Hash-based**: Only syncs when data actually changed
- **Queue**: Prevents concurrent sync operations
- **Retry**: Automatic retry on failures with exponential backoff
- **Conflict Resolution**: Last-write-wins strategy

## 🔧 Development Workflows

### Essential Commands

```bash
npm run dev              # Start dev server with hot reload
npm run build           # Production build
npm run type-check      # TypeScript type checking only
npm run lint:fix        # Auto-fix ESLint issues
npm run format          # Prettier formatting
npm run test:ci         # Jest tests for CI (no watch)
npm run e2e             # Full E2E test suite with dev server
```

### Testing Strategy

- **Unit Tests**: Jest + React Testing Library (70% of tests)
- **Integration**: API route testing with MSW mocking
- **E2E**: Cypress for critical user journeys
- **Mock Setup**: MSW for API mocking, custom mocks for external services

### File Organization Conventions

```
app/                    # Next.js App Router pages
components/             # React components (grouped by feature)
  ui/                   # Reusable shadcn/ui components
  timer/                # Timer-specific components
  categories/           # Category management components
lib/                    # Business logic and utilities
  drive/                # Google Drive integration
  sync/                 # Synchronization logic
stores/                 # Zustand state stores
hooks/                  # Custom React hooks
types/                  # TypeScript type definitions
```

## 📝 Code Patterns & Conventions

### Component Patterns

```tsx
'use client';

import { useCustomHook } from '@/hooks/useCustomHook';

export function ComponentName({ prop }: ComponentProps) {
  const { data, actions } = useCustomHook();

  return <div className={cn('base-classes', className)}>{/* Component JSX */}</div>;
}
```

### Hook Patterns

```typescript
export function useCustomHook() {
  const storeData = useStore((state) => state.data);
  const storeActions = useStore((state) => state.actions);

  const customLogic = useCallback(() => {
    // Business logic here
  }, [dependencies]);

  return {
    data: storeData,
    actions: { customLogic, ...storeActions },
  };
}
```

### Store Patterns

```typescript
interface StoreState {
  data: DataType[];
  loading: boolean;
  error: string | null;
}

interface StoreActions {
  setData: (data: DataType[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

type Store = StoreState & StoreActions;

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      // Initial state
      data: [],
      loading: false,
      error: null,

      // Actions
      setData: (data) => set({ data }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'storage_key',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

### Error Handling

```typescript
// In async operations
try {
  const result = await operation();
  setData(result);
} catch (error) {
  console.error('Operation failed:', error);
  setError(error instanceof Error ? error.message : 'Unknown error');
} finally {
  setLoading(false);
}
```

### Type Definitions

```typescript
// types/feature.ts
export interface Feature {
  id: string; // UUID v4
  name: string;
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
}

// types/api.ts
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
  timestamp: string;
}
```

## 🔄 Sync & Data Management

### Sync Triggers

- **Manual**: User-initiated sync button
- **Automatic**: Every 5 minutes when app is active
- **Navigation**: When entering dashboard
- **State Change**: After timer start/stop/category changes

### Data Persistence Layers

1. **localStorage**: Fast cache for current session
2. **IndexedDB**: Offline storage via idb-keyval
3. **Google Drive**: Cloud backup with file-based storage

### Conflict Resolution

- **Strategy**: Last-write-wins based on `updatedAt` timestamp
- **Scope**: Per data type (categories, time entries, preferences)
- **Notification**: User alerted of conflicts but auto-resolved

## 🧪 Testing Patterns

### Unit Test Structure

```typescript
describe('ComponentName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('behavior', () => {
    it('should do something', () => {
      render(<Component />);
      // Test logic
    });
  });
});
```

### Mock Setup

```typescript
// jest.setup.js
import '@testing-library/jest-dom';

// MSW setup for API mocking
// Custom mocks for external services
```

### Store Testing

```typescript
describe('Store', () => {
  beforeEach(() => {
    useStore.setState(initialState);
  });

  it('should handle action', () => {
    const { action } = useStore.getState();
    action(payload);
    const state = useStore.getState();
    expect(state).toMatchObject(expectedState);
  });
});
```

## 🚀 Deployment & Environment

### Environment Variables

```env
NEXTAUTH_URL=https://domain.com
NEXTAUTH_SECRET=generated-secret
GOOGLE_CLIENT_ID=oauth-client-id
GOOGLE_CLIENT_SECRET=oauth-client-secret
```

### Build Configuration

- **Framework**: Next.js 14 with App Router
- **PWA**: next-pwa for service worker and caching
- **Styling**: Tailwind CSS with custom design system
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier with Tailwind plugin

## 🔍 Key Files to Reference

**Architecture Understanding**:

- `ARCHITECTURE.md` - Complete system overview
- `lib/sync/sync-manager.ts` - Sync implementation details
- `stores/timerStore.ts` - State management patterns

**Implementation Examples**:

- `components/timer/TimerBar.tsx` - Complex component with hooks
- `hooks/useAutoSync.ts` - Custom hook patterns
- `lib/drive/index.ts` - External service integration

**Testing Examples**:

- `__tests__/stores/timerStore.test.ts` - Store testing patterns
- `cypress/e2e/` - E2E test structure

**Configuration**:

- `package.json` - Available scripts and dependencies
- `jest.config.js` - Testing configuration
- `tailwind.config.js` - Styling system setup
