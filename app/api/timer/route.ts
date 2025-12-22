import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { validate, startTimerSchema, stopTimerSchema } from '@/lib/validations';
import { generateId, now, diffInSeconds } from '@/lib/utils';
import type { ApiResponse, TimeEntry, TimerState } from '@/types';

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic';

// Em produção, use Redis ou banco de dados
// Por simplicidade, usamos memória (não persiste entre restarts)
const activeTimers = new Map<string, TimeEntry>();

/**
 * GET /api/timer
 * Retorna o timer ativo do usuário
 */
export async function GET(): Promise<NextResponse<ApiResponse<TimerState>>> {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Não autenticado' },
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    const activeEntry = activeTimers.get(session.user.id) ?? null;
    const elapsedSeconds = activeEntry
      ? diffInSeconds(activeEntry.startTime, new Date().toISOString())
      : 0;

    const timerState: TimerState = {
      isRunning: !!activeEntry,
      activeEntry,
      elapsedSeconds,
    };

    return NextResponse.json({
      success: true,
      data: timerState,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting timer:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Erro ao obter timer' },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/timer
 * Inicia ou para o timer
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<TimeEntry>>> {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Não autenticado' },
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'start') {
      // Valida input
      const validation = validate(startTimerSchema, body);
      if (!validation.success) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: validation.errors.join(', '),
            },
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
      }

      // Verifica se já tem timer ativo
      if (activeTimers.has(session.user.id)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'CONFLICT',
              message: 'Já existe um timer ativo. Pare-o primeiro.',
            },
            timestamp: new Date().toISOString(),
          },
          { status: 409 }
        );
      }

      // Cria nova entrada
      const newEntry: TimeEntry = {
        id: generateId(),
        categoryId: validation.data.categoryId,
        startTime: now(),
        endTime: null,
        duration: null,
        userId: session.user.id,
        notes: validation.data.notes ?? null,
        createdAt: now(),
        updatedAt: now(),
      };

      activeTimers.set(session.user.id, newEntry);

      return NextResponse.json({
        success: true,
        data: newEntry,
        timestamp: new Date().toISOString(),
      });
    }

    if (action === 'stop') {
      // Valida input (opcional)
      const validation = validate(stopTimerSchema, body);
      if (!validation.success) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: validation.errors.join(', '),
            },
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
      }

      // Verifica se tem timer ativo
      const activeEntry = activeTimers.get(session.user.id);
      if (!activeEntry) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Nenhum timer ativo encontrado.',
            },
            timestamp: new Date().toISOString(),
          },
          { status: 404 }
        );
      }

      // Para o timer
      const endTime = now();
      const completedEntry: TimeEntry = {
        ...activeEntry,
        endTime,
        duration: diffInSeconds(activeEntry.startTime, endTime),
        notes: validation.data.notes ?? activeEntry.notes,
        updatedAt: endTime,
      };

      activeTimers.delete(session.user.id);

      return NextResponse.json({
        success: true,
        data: completedEntry,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Ação inválida. Use "start" ou "stop".',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing timer:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Erro ao processar timer' },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
