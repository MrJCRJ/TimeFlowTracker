# 🔄 Guia de Reutilização Inteligente de Tarefas

Este documento explica estratégias para evitar repetição de tarefas e armazená-las de forma inteligente.

---

## 📋 Conceito: Tarefas vs Templates

### Problema Atual

Quando um usuário cria tarefas manualmente, ele pode criar tarefas repetidas:

- "Revisar emails" (criada toda segunda)
- "Revisar e-mails" (variação com hífen)
- "Responder emails" (relacionada)

### Solução: Sistema de Templates

```
┌─────────────────────────────────────────┐
│         Templates (Globais)             │
│  - Criados uma vez                      │
│  - Reutilizáveis entre categorias       │
│  - Podem ter variações                  │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│      Instâncias de Tarefas              │
│  - Criadas a partir de templates        │
│  - Associadas a uma sessão de timer     │
│  - Podem ser completadas/não completadas│
└─────────────────────────────────────────┘
```

---

## 🏗️ Arquitetura Proposta

### 1. Novo Tipo: TaskTemplate

```typescript
// types/task.ts - Adicionar

export interface TaskTemplate {
  id: string;
  name: string;
  normalizedName: string; // Para busca (lowercase, sem acentos)
  description?: string;
  categoryId?: string; // Opcional - pode ser global
  tags?: string[];
  usageCount: number; // Quantas vezes foi usado
  lastUsedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskInstance {
  id: string;
  templateId: string;
  categoryId: string;
  timerSessionId?: string; // Associar à sessão do timer
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
}
```

### 2. Normalização de Texto

```typescript
// lib/utils/text-normalize.ts

/**
 * Normaliza texto para comparação
 * - Remove acentos
 * - Converte para lowercase
 * - Remove espaços extras
 */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' '); // Normaliza espaços
}

/**
 * Calcula similaridade entre duas strings (0-1)
 * Útil para sugestões "você quis dizer..."
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeText(str1);
  const s2 = normalizeText(str2);

  if (s1 === s2) return 1;

  // Algoritmo de Levenshtein simplificado
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(s1: string, s2: string): number {
  const costs: number[] = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}
```

### 3. Store de Templates

```typescript
// stores/taskTemplateStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { generateId, now } from '@/lib/utils';
import { normalizeText, calculateSimilarity } from '@/lib/utils/text-normalize';
import type { TaskTemplate } from '@/types/task';

interface TaskTemplateStoreState {
  templates: TaskTemplate[];
  isLoading: boolean;
}

interface TaskTemplateStoreActions {
  // CRUD
  addTemplate: (name: string, categoryId?: string, description?: string) => TaskTemplate;
  updateTemplate: (id: string, updates: Partial<TaskTemplate>) => void;
  deleteTemplate: (id: string) => void;

  // Busca inteligente
  findSimilarTemplates: (name: string, threshold?: number) => TaskTemplate[];
  searchTemplates: (query: string, categoryId?: string) => TaskTemplate[];

  // Uso
  incrementUsage: (id: string) => void;
  getMostUsedTemplates: (categoryId?: string, limit?: number) => TaskTemplate[];
  getRecentTemplates: (categoryId?: string, limit?: number) => TaskTemplate[];

  // Sugestões
  getSuggestedTemplates: (categoryId: string) => TaskTemplate[];
}

type TaskTemplateStore = TaskTemplateStoreState & TaskTemplateStoreActions;

export const useTaskTemplateStore = create<TaskTemplateStore>()(
  persist(
    (set, get) => ({
      templates: [],
      isLoading: false,

      addTemplate: (name, categoryId, description) => {
        const normalizedName = normalizeText(name);

        // Verificar duplicata exata
        const existing = get().templates.find(
          (t) => t.normalizedName === normalizedName && t.categoryId === categoryId
        );

        if (existing) {
          // Retornar existente e incrementar uso
          get().incrementUsage(existing.id);
          return existing;
        }

        const template: TaskTemplate = {
          id: generateId(),
          name: name.trim(),
          normalizedName,
          description,
          categoryId,
          tags: [],
          usageCount: 1,
          lastUsedAt: now(),
          createdAt: now(),
          updatedAt: now(),
        };

        set((state) => ({
          templates: [...state.templates, template],
        }));

        return template;
      },

      findSimilarTemplates: (name, threshold = 0.7) => {
        const normalizedInput = normalizeText(name);

        return get()
          .templates.map((template) => ({
            template,
            similarity: calculateSimilarity(normalizedInput, template.normalizedName),
          }))
          .filter(({ similarity }) => similarity >= threshold)
          .sort((a, b) => b.similarity - a.similarity)
          .map(({ template }) => template);
      },

      searchTemplates: (query, categoryId) => {
        const normalizedQuery = normalizeText(query);

        return get().templates.filter((template) => {
          // Filtrar por categoria se especificada
          if (categoryId && template.categoryId !== categoryId) {
            // Incluir templates globais (sem categoria)
            if (template.categoryId) return false;
          }

          // Buscar no nome normalizado
          return template.normalizedName.includes(normalizedQuery);
        });
      },

      incrementUsage: (id) => {
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id ? { ...t, usageCount: t.usageCount + 1, lastUsedAt: now() } : t
          ),
        }));
      },

      getMostUsedTemplates: (categoryId, limit = 5) => {
        return get()
          .templates.filter((t) => !categoryId || t.categoryId === categoryId || !t.categoryId)
          .sort((a, b) => b.usageCount - a.usageCount)
          .slice(0, limit);
      },

      getRecentTemplates: (categoryId, limit = 5) => {
        return get()
          .templates.filter((t) => !categoryId || t.categoryId === categoryId || !t.categoryId)
          .sort((a, b) => new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime())
          .slice(0, limit);
      },

      getSuggestedTemplates: (categoryId) => {
        const templates = get().templates;

        // Combinar mais usados + recentes da categoria
        const categoryTemplates = templates.filter(
          (t) => t.categoryId === categoryId || !t.categoryId
        );

        // Ordenar por score: (usageCount * 2) + recência
        const now = Date.now();
        return categoryTemplates
          .map((t) => ({
            template: t,
            score:
              t.usageCount * 2 +
              (1 - (now - new Date(t.lastUsedAt).getTime()) / (7 * 24 * 60 * 60 * 1000)),
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 10)
          .map(({ template }) => template);
      },

      updateTemplate: (id, updates) => {
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: now() } : t
          ),
        }));
      },

      deleteTemplate: (id) => {
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
        }));
      },
    }),
    {
      name: 'timeflow_task_templates',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

---

## 🎯 Fluxo de Uso Inteligente

### 1. Criação de Tarefa com Autocomplete

```typescript
// components/timer/TaskInput.tsx

function TaskInput({ categoryId, onTaskSelected }) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const {
    searchTemplates,
    findSimilarTemplates,
    getSuggestedTemplates,
    addTemplate
  } = useTaskTemplateStore();

  // Mostrar sugestões iniciais
  useEffect(() => {
    if (!input) {
      setSuggestions(getSuggestedTemplates(categoryId));
    }
  }, [categoryId, input]);

  // Buscar enquanto digita
  useEffect(() => {
    if (input.length >= 2) {
      const exact = searchTemplates(input, categoryId);
      const similar = findSimilarTemplates(input, 0.6);

      // Mesclar resultados únicos
      const results = [...new Map(
        [...exact, ...similar].map(t => [t.id, t])
      ).values()];

      setSuggestions(results.slice(0, 8));
    }
  }, [input, categoryId]);

  const handleSelect = (template) => {
    onTaskSelected(template);
    setInput('');
  };

  const handleCreate = () => {
    const template = addTemplate(input, categoryId);
    onTaskSelected(template);
    setInput('');
  };

  return (
    <div className="relative">
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Adicionar tarefa..."
      />

      {suggestions.length > 0 && (
        <ul className="absolute top-full left-0 right-0 bg-white shadow-lg">
          {suggestions.map(template => (
            <li key={template.id} onClick={() => handleSelect(template)}>
              {template.name}
              <span className="text-xs text-gray-400">
                Usado {template.usageCount}x
              </span>
            </li>
          ))}

          {input && !suggestions.find(s =>
            normalizeText(s.name) === normalizeText(input)
          ) && (
            <li onClick={handleCreate} className="text-blue-600">
              + Criar "{input}"
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
```

### 2. Detecção de Duplicatas

```typescript
// hooks/useTaskDeduplication.ts

export function useTaskDeduplication() {
  const { findSimilarTemplates } = useTaskTemplateStore();

  const checkForDuplicates = useCallback(
    (name: string) => {
      const similar = findSimilarTemplates(name, 0.85);

      if (similar.length > 0) {
        return {
          hasDuplicates: true,
          suggestions: similar,
          message: `Tarefas similares encontradas: ${similar.map((s) => s.name).join(', ')}`,
        };
      }

      return { hasDuplicates: false };
    },
    [findSimilarTemplates]
  );

  return { checkForDuplicates };
}
```

### 3. Sugestões Contextuais

```typescript
// hooks/useContextualSuggestions.ts

export function useContextualSuggestions(categoryId: string) {
  const { templates } = useTaskTemplateStore();

  const getSuggestions = useCallback(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const hour = now.getHours();

    // Filtrar por categoria
    const categoryTemplates = templates.filter((t) => t.categoryId === categoryId || !t.categoryId);

    // Adicionar peso baseado em padrões temporais
    return categoryTemplates
      .map((template) => {
        let score = template.usageCount;

        // Boost para tarefas usadas no mesmo dia da semana
        // (requer histórico mais detalhado)

        // Boost para tarefas recentes
        const daysSinceUse = Math.floor(
          (now.getTime() - new Date(template.lastUsedAt).getTime()) / (24 * 60 * 60 * 1000)
        );

        if (daysSinceUse < 7) score *= 1.5;
        if (daysSinceUse < 1) score *= 2;

        return { template, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(({ template }) => template);
  }, [categoryId, templates]);

  return { getSuggestions };
}
```

---

## 💾 Estratégias de Armazenamento

### Opção 1: Tudo Local (Atual)

```
Prós:
✅ Simples
✅ Funciona offline
✅ Sem custos

Contras:
❌ Não sincroniza entre dispositivos
❌ Perde dados se limpar cache
```

### Opção 2: Local + Backup no Drive

```typescript
// Estrutura no Google Drive
TimeFlowTracker/
├── data.json          # Categorias + TimeEntries
├── templates.json     # TaskTemplates (NOVO)
└── preferences.json   # Preferências do usuário
```

### Opção 3: Híbrido Inteligente

```typescript
// lib/sync/template-sync.ts

/**
 * Sincroniza templates apenas quando necessário
 * - Upload: Quando novos templates são criados
 * - Download: Quando entra em novo dispositivo
 */
export async function syncTemplates() {
  const localTemplates = useTaskTemplateStore.getState().templates;

  // Buscar do Drive
  const driveData = await fetchFromDrive('templates.json');

  if (!driveData) {
    // Primeiro uso - fazer upload
    await uploadToDrive('templates.json', { templates: localTemplates });
    return;
  }

  // Merge inteligente: manter templates de ambos
  const merged = mergeTemplates(localTemplates, driveData.templates);

  // Atualizar local e remoto
  useTaskTemplateStore.setState({ templates: merged });
  await uploadToDrive('templates.json', { templates: merged });
}

function mergeTemplates(local: TaskTemplate[], remote: TaskTemplate[]): TaskTemplate[] {
  const map = new Map<string, TaskTemplate>();

  // Adicionar todos os remotos
  remote.forEach((t) => map.set(t.normalizedName, t));

  // Merge com locais (local tem prioridade para usageCount)
  local.forEach((t) => {
    const existing = map.get(t.normalizedName);
    if (existing) {
      map.set(t.normalizedName, {
        ...existing,
        usageCount: Math.max(existing.usageCount, t.usageCount),
        lastUsedAt: existing.lastUsedAt > t.lastUsedAt ? existing.lastUsedAt : t.lastUsedAt,
      });
    } else {
      map.set(t.normalizedName, t);
    }
  });

  return Array.from(map.values());
}
```

---

## 🔮 Funcionalidades Avançadas (Futuro)

### 1. Tags para Templates

```typescript
// Permite agrupar templates
interface TaskTemplate {
  // ...
  tags: string[]; // ['urgente', 'reunião', 'cliente']
}

// Filtrar por tags
const meetingTasks = templates.filter((t) => t.tags.includes('reunião'));
```

### 2. Templates com Subtarefas

```typescript
interface TaskTemplate {
  // ...
  subtasks?: string[]; // Lista de subtarefas comuns
}

// Exemplo: "Reunião de sprint" -> ["Preparar pauta", "Enviar convite", "Tomar notas"]
```

### 3. Templates Recorrentes

```typescript
interface TaskTemplate {
  // ...
  recurrence?: {
    type: 'daily' | 'weekly' | 'monthly';
    daysOfWeek?: number[]; // [1, 3, 5] = Segunda, Quarta, Sexta
  };
}
```

### 4. Analytics de Tarefas

```typescript
// Rastrear tempo médio por tipo de tarefa
interface TaskAnalytics {
  templateId: string;
  averageDuration: number;
  completionRate: number;
  totalTimeSpent: number;
}
```

---

## 📝 Implementação Recomendada

### Fase 1: Base (1-2 dias)

- [ ] Criar tipo `TaskTemplate`
- [ ] Criar `taskTemplateStore`
- [ ] Criar função de normalização de texto
- [ ] Migrar tarefas existentes para templates

### Fase 2: Autocomplete (1 dia)

- [ ] Criar componente `TaskInput` com autocomplete
- [ ] Integrar com `TimerBar`
- [ ] Adicionar "Criar novo" quando não encontrar

### Fase 3: Inteligência (1-2 dias)

- [ ] Implementar busca por similaridade
- [ ] Criar sugestões contextuais
- [ ] Adicionar detecção de duplicatas

### Fase 4: Sync (Opcional)

- [ ] Incluir templates no backup do Drive
- [ ] Implementar merge de templates

---

## 💡 Dicas de UX

1. **Mostrar sugestões antes de digitar**: Quando o input está vazio, mostrar as 5 tarefas mais usadas na categoria

2. **Feedback visual de match**: Destacar parte do texto que corresponde à busca

3. **Confirmar antes de criar duplicata**: "Você já tem 'Revisar emails'. Deseja criar 'Revisar e-mails' mesmo assim?"

4. **Atalhos de teclado**:
   - Enter: Selecionar primeira sugestão
   - Tab: Autocompletar com primeira sugestão
   - Escape: Limpar input

5. **Histórico recente**: Mostrar as últimas 3 tarefas usadas no topo das sugestões
