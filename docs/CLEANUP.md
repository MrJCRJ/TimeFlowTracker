# 🧹 Guia de Limpeza e Refatoração do TimeFlow Tracker

Este documento lista código não utilizado, oportunidades de refatoração, modularização e organização.

---

## 📦 1. Código Não Utilizado (Para Remoção)

### 🔴 Arquivos Inteiros que Podem ser Removidos

| Arquivo | Motivo |
|---------|--------|
| `components/timer/CloudTimerBar.tsx` | Componente de timer cloud não usado (substituído por `TimerBar.tsx` local) |
| `hooks/useActiveTimerDrive.ts` | Hook para timer cloud não usado (app agora é local-first) |
| `hooks/timer/useActiveTimerOperations.ts` | Usado apenas por `useActiveTimerDrive` |
| `hooks/timer/useActiveTimerState.ts` | Usado apenas por `useActiveTimerDrive` |
| `hooks/timer/usePollingWithBackoff.ts` | Usado apenas por `useActiveTimerDrive` |
| `hooks/useDriveSync.ts` | Hook de sync cloud não usado (substituído por `useManualSync`) |
| `hooks/useTimer.ts` | Hook genérico não usado em nenhum lugar |
| `hooks/useLocalStorage.ts` | Hook não usado (stores usam Zustand persist) |
| `lib/sync/sync-manager.ts` | Sistema de sync automático não usado |
| `lib/sync/sync-manager.ts.backup` | Arquivo de backup desnecessário |
| `lib/sync/strategies/debounce-strategy.ts` | Usado apenas pelo SyncManager |
| `lib/sync/strategies/throttle-strategy.ts` | Usado apenas pelo SyncManager |
| `lib/sync/strategies/retry-strategy.ts` | Usado apenas pelo SyncManager |
| `lib/sync/config/sync-config.ts` | Usado apenas pelo SyncManager |
| `lib/sync/types/sync-types.ts` | Usado apenas pelo SyncManager |
| `lib/sync/utils/hash-utils.ts` | Usado apenas pelo SyncManager |
| `lib/sync/merge-utils.ts` | Utilities de merge não usados |
| `lib/utils/backoff-manager.ts` | Usado apenas pelos hooks timer cloud |
| `lib/services/active-timer-api.ts` | API para timer cloud não usado |
| `lib/drive/active-timer-manager.ts` | Manager para timer cloud não usado |
| `SYNC_FIX_README.md` | Documentação obsoleta sobre sync automático |
| `app/(dashboard)/settings/page.tsx.backup` | Arquivo backup desnecessário |

### 🟡 Testes Relacionados a Código Removido

| Arquivo | Motivo |
|---------|--------|
| `__tests__/hooks/useActiveTimerDrive.test.ts` | Testa hook não usado |
| `__tests__/lib/sync/sync-manager.test.ts` | Testa código não usado |
| `__tests__/lib/drive/active-timer-manager.test.ts` | Testa código não usado |

### 🟢 Exports Não Utilizados

| Arquivo | Export Não Usado |
|---------|------------------|
| `hooks/index.ts` | `useLocalStorage`, `useDriveSync`, `useTimer` - nenhum é importado |
| `components/timer/index.ts` | `CloudTimerBar` - não é importado em lugar nenhum |
| `lib/sync/index.ts` | `SyncManager`, `syncManager` - exports não utilizados |

---

## 🔧 2. Oportunidades de Refatoração

### Alta Prioridade

#### 1. Consolidar Sistema de Sync
```
Atual:
- lib/sync/simple-sync.ts (usado pelo useSync no Header)
- hooks/useManualSync.ts (usado pelas Settings)
- components/layout/header/useSync.ts (sync do Header)

Proposta:
- Unificar em um único hook: hooks/useSync.ts
- Remover duplicação de lógica
```

#### 2. TimerBar.tsx está muito grande (~430 linhas)
```
Atual: Um arquivo com toda a lógica do timer

Proposta - Dividir em:
- components/timer/TimerBar/index.tsx (componente principal)
- components/timer/TimerBar/CategoryPicker.tsx
- components/timer/TimerBar/TaskPanel.tsx  
- components/timer/TimerBar/TimerDisplay.tsx
- components/timer/TimerBar/hooks/useTimerLogic.ts
```

#### 3. Header.tsx com menu mobile
```
Atual: ~230 linhas com lógica de menu inline

Proposta:
- Extrair componente MobileMenu.tsx
- Manter Header enxuto
```

### Média Prioridade

#### 4. Stores com padrões inconsistentes
```
Atual:
- categoryStore.ts: 150 linhas
- timerStore.ts: 180 linhas  
- taskStore.ts: 120 linhas

Proposta:
- Criar factory para stores (createPersistentStore)
- Padronizar estrutura: state → actions → selectors
```

#### 5. Types espalhados
```
Atual:
- types/timer.ts
- types/category.ts
- types/task.ts
- types/active-timer.ts
- types/api.ts
- types/user.ts

Proposta:
- Consolidar tipos relacionados
- Remover types/active-timer.ts (não usado após remoção cloud)
```

### Baixa Prioridade

#### 6. Utilitários em lib/utils.ts
```
Atual: 294 linhas de funções mistas

Proposta:
- lib/utils/date.ts (formatTime, formatDuration, isToday, etc)
- lib/utils/cn.ts (className utility)
- lib/utils/id.ts (generateId)
```

---

## 📁 3. Oportunidades de Modularização

### Módulo: Timer
```
components/timer/
├── index.ts                 # exports públicos
├── TimerBar/
│   ├── index.tsx           # componente principal
│   ├── CategoryPicker.tsx  # seletor de categorias
│   ├── TaskPanel.tsx       # painel de tarefas
│   ├── TimerDisplay.tsx    # display do tempo
│   └── hooks/
│       └── useTimerLogic.ts
└── types.ts                 # tipos específicos do timer
```

### Módulo: Categories  
```
components/categories/
├── index.ts
├── CategoryCard.tsx        # extrair de categories/page.tsx
├── CategoryForm.tsx        # já existe
├── TaskList.tsx           # já existe
└── hooks/
    └── useCategoryStats.ts # extrair lógica de stats
```

### Módulo: Sync
```
lib/sync/
├── index.ts
├── simple-sync.ts          # manter (único sync necessário)
├── debug-utils.ts          # manter para debug
└── types.ts                # tipos de sync
```

### Módulo: Analytics
```
components/analytics/
├── index.ts
├── AnalyticsSummaryCards.tsx
├── CategoryBreakdownList.tsx
├── PeriodSelector.tsx
├── TimeChart.tsx
└── hooks/
    └── useAnalyticsData.ts  # extrair lógica de analytics/page.tsx
```

---

## 🗂️ 4. Reorganização da Estrutura

### Estrutura Atual (Problemática)
```
lib/
├── auth-config.ts
├── auth.ts
├── constants.ts
├── device.ts
├── drive.ts              # duplicado com lib/drive/
├── env-validation.ts
├── utils.ts              # muito grande
├── validations.ts
├── drive/                # pasta de drive
├── services/            # só tem 1 arquivo
├── sync/                # muitos arquivos não usados
└── utils/               # só tem 1 arquivo
```

### Estrutura Proposta
```
lib/
├── core/
│   ├── auth-config.ts
│   ├── auth.ts
│   └── constants.ts
├── utils/
│   ├── cn.ts
│   ├── date.ts
│   ├── id.ts
│   └── validations.ts
├── drive/
│   ├── index.ts
│   ├── file-manager.ts
│   └── folder-manager.ts
└── sync/
    ├── index.ts
    └── simple-sync.ts
```

### Hooks Reorganizados
```
hooks/
├── index.ts
├── useManualSync.ts       # hook único de sync
├── useTimerNotifications.ts
├── usePushNotifications.ts
└── timer/                  # (remover após cleanup)
```

### Componentes por Feature
```
components/
├── common/                 # renomear ui/ para common/
│   ├── Button.tsx
│   ├── Card.tsx
│   └── ...
├── layout/
│   ├── Header/
│   │   ├── index.tsx
│   │   ├── MobileMenu.tsx
│   │   ├── NotificationsPanel.tsx
│   │   └── UserAvatar.tsx
│   └── Sidebar.tsx
├── timer/
│   └── TimerBar/          # modularizado
├── categories/
├── analytics/
├── settings/
└── notifications/
```

---

## ✅ Checklist de Execução

### Fase 1: Remoção de Código Morto
- [ ] Remover `CloudTimerBar.tsx`
- [ ] Remover hooks cloud (`useActiveTimerDrive`, `useDriveSync`, `useTimer`, `useLocalStorage`)
- [ ] Remover pasta `hooks/timer/`
- [ ] Remover `lib/sync/sync-manager.ts` e relacionados
- [ ] Remover `lib/utils/backoff-manager.ts`
- [ ] Remover `lib/services/active-timer-api.ts`
- [ ] Remover `lib/drive/active-timer-manager.ts`
- [ ] Remover testes relacionados
- [ ] Atualizar `hooks/index.ts`
- [ ] Atualizar `components/timer/index.ts`
- [ ] Atualizar `lib/sync/index.ts`
- [ ] Remover arquivos `.backup`
- [ ] Remover `SYNC_FIX_README.md`
- [ ] Remover `types/active-timer.ts`

### Fase 2: Refatoração
- [ ] Dividir `TimerBar.tsx` em componentes menores
- [ ] Extrair `MobileMenu` do `Header.tsx`
- [ ] Consolidar hooks de sync

### Fase 3: Reorganização
- [ ] Criar estrutura de pastas proposta
- [ ] Mover arquivos para locais apropriados
- [ ] Atualizar imports

### Fase 4: Verificação
- [ ] Executar `npm run build`
- [ ] Executar `npm run test:ci`
- [ ] Executar `npm run lint`
- [ ] Testar funcionalidades manualmente

---

## 📊 Estimativa de Redução

| Métrica | Antes | Depois (Estimado) |
|---------|-------|-------------------|
| Arquivos em /lib | 25+ | ~15 |
| Arquivos em /hooks | 12 | ~5 |
| Linhas de código | ~5000 | ~3500 |
| Bundle size | - | -10-15% |
| Tempo de build | - | Melhor |

---

## ⚠️ Notas Importantes

1. **Backup**: Faça commit antes de remover código
2. **Incremental**: Remova em pequenas partes e teste
3. **Testes**: Execute testes após cada mudança
4. **Imports**: Use busca global para verificar se algo é usado antes de remover
