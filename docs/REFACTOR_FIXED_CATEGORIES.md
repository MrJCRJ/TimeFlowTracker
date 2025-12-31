# 🔄 Refatoração: Categorias Fixas Especializadas

Este documento descreve a migração do sistema de categorias dinâmicas (CRUD) para categorias fixas com tipos especializados.

---

## 📋 Resumo da Mudança

**Antes**: Usuários podiam criar, editar e deletar categorias customizadas.

**Depois**: 9 categorias fixas, cada uma com seu próprio tipo de registro especializado.

---

## 🗑️ O Que Será Removido

### Arquivos a Deletar

```
components/categories/CategoryForm.tsx    # Formulário de criar/editar categorias
```

### Código a Remover

#### `types/category.ts`

- `CreateCategoryInput` interface
- `UpdateCategoryInput` interface

#### `stores/categoryStore.ts`

- `addCategory()` action
- `updateCategory()` action
- `deleteCategory()` action
- `initializeDefaults()` action (categorias serão constantes)

#### `app/(dashboard)/categories/page.tsx`

- Botão "Nova Categoria"
- Botões de "Editar" e "Excluir" em cada card
- Estado `isFormOpen`, `editingCategory`, `deletingId`
- Handlers: `handleCreateCategory`, `handleUpdateCategory`, `handleDeleteCategory`, `handleEditClick`
- Modal de confirmação de exclusão
- Importação e uso do `CategoryForm`

#### Testes Relacionados

- `__tests__/stores/categoryStore.test.ts` - testes de CRUD
- `__tests__/components/categories/` - testes do CategoryForm

---

## 🏗️ Nova Estrutura de Categorias

### Categorias Fixas (10 total)

| #   | Categoria    | Ícone        | Cor              | Tipo       |
| --- | ------------ | ------------ | ---------------- | ---------- |
| 1   | Sono         | 🌙 moon      | #6366f1 (indigo) | Simples    |
| 2   | Lazer        | 🎮 gamepad-2 | #f59e0b (amber)  | Simples    |
| 3   | Treino       | 💪 dumbbell  | #22c55e (green)  | Treino     |
| 4   | Trabalho     | 💼 briefcase | #3b82f6 (blue)   | Financeiro |
| 5   | Estudo       | 📚 book      | #8b5cf6 (violet) | Tarefas    |
| 6   | Alimentação  | 🍽️ utensils  | #ec4899 (pink)   | Receitas   |
| 7   | Casa         | 🏠 home      | #14b8a6 (teal)   | Simples    |
| 8   | Higiene      | ✨ sparkles  | #06b6d4 (cyan)   | Simples    |
| 9   | Compromissos | 📅 calendar  | #f43f5e (rose)   | Datado     |
| 10  | Outros       | 📁 folder    | #6b7280 (gray)   | Tarefas    |

### ❌ Categoria Removida

- **Transporte** - Removida por falta de uso/necessidade

---

## 📦 Tipos de Entrada por Categoria

### 1. Tipo: Simples (Sono, Lazer, Casa)

Timer básico com checklist opcional para anotar atividades.

```typescript
interface SimpleEntry {
  id: string;
  categoryId: string;
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  duration: number; // em segundos
  checklist?: {
    id: string;
    text: string;
    completed: boolean;
  }[];
  notes?: string;
}
```

**UI sugerida:**

- Timer principal
- Campo opcional para adicionar itens ao checklist
- Exemplo Sono: "Tomei chá", "Li antes de dormir"
- Exemplo Lazer: "Joguei X", "Assisti Y"
- Exemplo Casa: "Limpei cozinha", "Lavei roupa", "Organizei quarto"

---

### 2. Tipo: Treino (Treino)

Registro de exercícios com séries, repetições e peso.

```typescript
interface WorkoutEntry {
  id: string;
  categoryId: string;
  startTime: string;
  endTime: string;
  duration: number;
  exercises: WorkoutExercise[];
  notes?: string;
}

interface WorkoutExercise {
  id: string;
  name: string; // "Supino Reto", "Agachamento"
  muscleGroup: MuscleGroup;
  sets: WorkoutSet[];
}

interface WorkoutSet {
  id: string;
  reps: number; // repetições
  weight?: number; // kg (opcional para exercícios sem peso)
  completed: boolean;
}

type MuscleGroup =
  | 'chest' // Peito
  | 'back' // Costas
  | 'shoulders' // Ombros
  | 'biceps' // Bíceps
  | 'triceps' // Tríceps
  | 'legs' // Pernas
  | 'glutes' // Glúteos
  | 'abs' // Abdômen
  | 'cardio' // Cardio
  | 'full-body'; // Corpo todo
```

**UI sugerida:**

- Lista de exercícios adicionados
- Para cada exercício: nome, grupo muscular, séries
- Cada série tem reps e peso opcional
- Checkbox para marcar série concluída
- Histórico para sugerir exercícios anteriores

---

### 3. Tipo: Financeiro (Trabalho)

Registro de horas trabalhadas com suporte a múltiplos trabalhos/projetos.

```typescript
interface WorkEntry {
  id: string;
  categoryId: string;
  startTime: string;
  endTime: string;
  duration: number;
  jobId: string; // Referência ao trabalho
  tasks?: {
    id: string;
    text: string;
    completed: boolean;
  }[];
  earnings?: {
    amount: number; // Valor ganho
    description?: string; // Descrição opcional
  };
  notes?: string;
}

// Configuração de trabalhos (armazenado separadamente)
interface Job {
  id: string;
  name: string; // "Freelance", "Empresa X", "Projeto Y"
  hourlyRate?: number; // Valor por hora (opcional)
  color: string; // Cor para diferenciar nos gráficos
  isActive: boolean; // Se ainda está ativo
  createdAt: string;
  updatedAt: string;
}
```

**UI sugerida:**

- Seletor de trabalho antes de iniciar timer
- Gerenciamento de trabalhos na própria página da categoria Trabalho
- Dashboard mostra:
  - Horas por trabalho
  - Ganhos por trabalho (se houver hourlyRate)
  - Total ganho no período
- Checklist de tarefas realizadas durante o período

**Analytics calculados:**

- Total de horas por trabalho
- Valor/hora médio
- Comparativo entre trabalhos
- Ganhos por período (dia/semana/mês)

---

### 4. Tipo: Tarefas (Estudo, Outros)

Registro de tempo com lista de tarefas/atividades realizadas.

```typescript
interface TaskEntry {
  id: string;
  categoryId: string;
  startTime: string;
  endTime: string;
  duration: number;
  tasks: {
    id: string;
    text: string;
    completed: boolean;
  }[];
  notes?: string;
}
```

**UI sugerida:**

- Timer principal
- Lista de tarefas com checkbox
- Possibilidade de reutilizar tarefas anteriores (já implementado)

---

### 5. Tipo: Receitas (Alimentação)

Registro de refeições com informações nutricionais para meal prep.

**Fluxo Principal:**

1. Usuário abre categoria Alimentação
2. App mostra lista de receitas já cadastradas
3. Usuário seleciona uma receita
4. App pergunta: **"Vai fazer ou comer?"**
   - **FAZER** → Inicia timer de preparo
   - **COMER** → Registra consumo (quantas porções comeu)

```typescript
// Receita cadastrada pelo usuário
interface Recipe {
  id: string;
  name: string; // "Frango com batata doce"
  description: string; // Ingredientes, modo de preparo, etc.
  totalCalories: number; // Calorias totais da receita completa
  portions: number; // Quantas porções rende
  caloriesPerPortion: number; // Calculado: totalCalories / portions
  timesCooked: number; // Quantas vezes preparou
  timesEaten: number; // Quantas vezes comeu
  createdAt: string;
  updatedAt: string;
}

// Entrada quando PREPARA a refeição
interface CookingEntry {
  id: string;
  categoryId: string;
  recipeId: string;
  type: 'cooking'; // Preparando
  startTime: string;
  endTime: string;
  duration: number; // Tempo de preparo
  portionsMade: number; // Quantas porções fez (pode ser diferente da receita)
  notes?: string;
}

// Entrada quando COME a refeição
interface EatingEntry {
  id: string;
  categoryId: string;
  recipeId: string;
  type: 'eating'; // Comendo
  timestamp: string; // Quando comeu
  portionsEaten: number; // Quantas porções comeu
  caloriesConsumed: number; // Calculado: portionsEaten * caloriesPerPortion
  notes?: string;
}

type MealEntry = CookingEntry | EatingEntry;
```

**UI - Tela Principal da Categoria:**

```
┌─────────────────────────────────────┐
│  🍽️ Alimentação                     │
├─────────────────────────────────────┤
│  [+ Nova Receita]                   │
│                                     │
│  📋 Suas Receitas:                  │
│  ┌─────────────────────────────────┐│
│  │ 🍗 Frango com batata doce      ││
│  │    450 kcal/porção · 4 porções ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │ 🥗 Salada de atum              ││
│  │    280 kcal/porção · 2 porções ││
│  └─────────────────────────────────┘│
│  ...                                │
└─────────────────────────────────────┘
```

**UI - Ao selecionar receita:**

```
┌─────────────────────────────────────┐
│  🍗 Frango com batata doce          │
│  450 kcal/porção · Rende 4 porções  │
├─────────────────────────────────────┤
│                                     │
│  O que você vai fazer?              │
│                                     │
│  ┌───────────┐    ┌───────────┐     │
│  │  👨‍🍳       │    │  🍴       │     │
│  │  FAZER    │    │  COMER    │     │
│  │  (timer)  │    │  (rápido) │     │
│  └───────────┘    └───────────┘     │
│                                     │
└─────────────────────────────────────┘
```

**UI - FAZER (com timer):**

- Inicia timer de preparo
- Ao finalizar, pergunta quantas porções fez
- Registra entrada tipo `cooking`

**UI - COMER (sem timer):**

- Pergunta quantas porções vai comer
- Mostra calorias que vai consumir
- Registra entrada tipo `eating`

**Cadastro de Nova Receita:**

- Campo: Nome da refeição
- Campo: Descrição (ingredientes, modo de preparo - textarea)
- Campo: Calorias totais da receita
- Campo: Número de porções que rende
- Display: **X calorias por porção** (calculado automaticamente)

**Gerenciamento de Receitas:** Tudo fica dentro da própria categoria Alimentação, sem página separada.

**Analytics:**

- Calorias consumidas por dia/semana
- Receitas mais preparadas
- Receitas mais consumidas
- Tempo médio de preparo
- Média de porções por refeição

---

### 6. Tipo: Datado (Compromissos)

Tarefas e compromissos com data, suporte a subtarefas e recorrência.

**Integração com Timer:** Esta categoria aparece junto no timer, permitindo trackear tempo gasto em compromissos.

```typescript
interface ScheduledEntry {
  id: string;
  categoryId: string;
  type: ScheduledType;
  title: string; // "Pagar conta de luz", "Aniversário do João"
  description?: string;
  dueDate: string; // Data do compromisso
  dueTime?: string; // Horário (opcional)
  completed: boolean;
  completedAt?: string;
  subtasks?: Subtask[];
  recurrence?: Recurrence;
  reminder?: boolean; // Lembrete ativado
  priority: Priority;
  createdAt: string;
  updatedAt: string;
}

interface Subtask {
  id: string;
  text: string;
  completed: boolean;
  completedAt?: string;
}

type ScheduledType =
  | 'bill' // Contas a pagar
  | 'financial' // Depositar, transferir
  | 'shopping' // Compras
  | 'birthday' // Aniversários
  | 'event' // Eventos
  | 'appointment' // Compromissos
  | 'task'; // Tarefa geral

type Priority = 'low' | 'medium' | 'high';

interface Recurrence {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // A cada X dias/semanas/meses
  endDate?: string; // Data fim (opcional)
}
```

**UI sugerida:**

- Visualização em calendário e lista
- Filtros por tipo (contas, eventos, etc.)
- Indicador visual de prioridade
- Subtarefas expansíveis
- Badge de "vencido" para itens atrasados
- Notificações/lembretes

**Funcionalidades:**

- Criar compromisso com data
- Adicionar subtarefas dentro do compromisso
- Marcar como concluído (compromisso e/ou subtarefas)
- Recorrência para contas mensais, aniversários anuais, etc.
- Vista de "próximos 7 dias" e "atrasados"

---

## 🗂️ Nova Estrutura de Arquivos

```
types/
  category.ts          # Categorias fixas (constantes)
  entries/
    index.ts           # Re-exports
    simple.ts          # SimpleEntry
    workout.ts         # WorkoutEntry, WorkoutExercise, etc.
    work.ts            # WorkEntry, Job
    task.ts            # TaskEntry
    meal.ts            # MealEntry, Recipe
    scheduled.ts       # ScheduledEntry, Subtask, etc.

stores/
  categoryStore.ts     # Simplificado (apenas leitura)
  timerStore.ts        # Existente
  jobStore.ts          # NOVO - Gerencia trabalhos
  recipeStore.ts       # NOVO - Gerencia receitas salvas
  commitmentStore.ts   # NOVO - Gerencia compromissos

components/
  categories/
    index.ts
    TaskList.tsx       # Existente
    CategoryCard.tsx   # Card de visualização (sem edit/delete)

  entries/             # NOVO - Componentes por tipo de entrada
    SimpleEntryForm.tsx
    WorkoutEntryForm.tsx
    WorkEntryForm.tsx
    TaskEntryForm.tsx
    MealEntryForm.tsx
    ScheduledEntryForm.tsx

  commitments/         # NOVO - Componentes de Compromissos
    CommitmentCalendar.tsx
    CommitmentList.tsx
    CommitmentCard.tsx
    SubtaskList.tsx

app/(dashboard)/
  categories/
    page.tsx           # Simplificado
    trabalho/          # Gerenciamento de trabalhos
      page.tsx
```

---

## 🔄 Migração de Dados

### Para usuários existentes:

1. **Categorias customizadas** → Mapeadas para "Outros" ou categoria mais próxima
2. **Entradas existentes** → Convertidas para novo formato (campos extras ficam vazios)
3. **Transporte** → Entradas migradas para "Outros"

### Script de migração:

```typescript
function migrateCategories(oldCategories: OldCategory[]): void {
  // Mapear categorias antigas para as novas fixas
  const mapping = {
    trabalho: 'work',
    estudo: 'study',
    exercício: 'workout',
    lazer: 'leisure',
    sono: 'sleep',
    alimentação: 'food',
    transporte: 'other', // Migra para Outros
    outros: 'other',
    // Categorias customizadas → 'other'
  };
}
```

---

## ✅ Decisões Finalizadas

| Questão                     | Decisão                                               |
| --------------------------- | ----------------------------------------------------- |
| Nome da categoria datada    | **Compromissos**                                      |
| UI de gerenciar trabalhos   | **Na própria página da categoria Trabalho**           |
| Gerenciamento de receitas   | **Tudo inline na categoria Alimentação**              |
| Nome da categoria doméstica | **Casa**                                              |
| Compromissos no timer       | **Sim, aparece junto no timer** (pode trackear tempo) |

---

## 📅 Ordem de Implementação Sugerida

### Fase 1: Fundação ✅

1. [x] Remover CRUD de categorias
2. [x] Criar categorias fixas como constantes
3. [x] Simplificar categoryStore
4. [x] Atualizar página de categorias

### Fase 2: Tipos Simples ✅

5. [x] Implementar tipo Simples (Sono, Lazer, Casa, Higiene)
6. [x] Adaptar UI do timer para mostrar checklist opcional

### Fase 3: Tipos Complexos ✅

7. [x] Implementar tipo Tarefas (Estudo, Outros)
8. [x] Implementar tipo Treino
9. [x] Implementar tipo Financeiro + jobStore
10. [x] Implementar tipo Receitas + recipeStore

### Fase 4: Compromissos ✅

11. [x] Criar commitmentStore
12. [x] Implementar tipo Datado
13. [x] Integrar Compromissos no timer
14. [x] Implementar subtarefas
15. [x] Implementar recorrência

### Fase 5: Polish ✅

16. [x] Migração de dados existentes (reset via Settings)
17. [x] Testes de integração (118 testes passando)
    - Store tests: jobStore, recipeStore, commitmentStore
    - EntryPanel tests: todos os painéis especializados
18. [x] Analytics por tipo
    - WorkAnalytics: ganhos por job, tempo trabalhado
    - MealAnalytics: calorias consumidas, receitas
    - WorkoutAnalytics: exercícios, séries, tempo de treino
    - CommitmentAnalytics: compromissos por tipo, taxa de conclusão

---

## ✅ Refatoração Concluída!

## 📝 Notas Adicionais

- Manter compatibilidade com sync do Google Drive
- Cada tipo de entrada terá seu próprio schema de validação
- Analytics serão adaptados para mostrar dados relevantes por categoria
- PWA notifications para lembretes de Compromissos
