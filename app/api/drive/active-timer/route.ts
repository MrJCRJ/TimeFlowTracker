import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createDriveService } from '@/lib/drive';
import type { ApiResponse, ActiveTimerRecord, TimeEntry, DeviceInfo } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/drive/active-timer
 * Lista todos os timers ativos ou obtém timer de uma categoria específica
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<ActiveTimerRecord | ActiveTimerRecord[]>>> {
  try {
    const session = await getSession();

    if (!session?.user || !session.accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Não autenticado' },
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    const driveService = createDriveService(session.accessToken);
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    if (categoryId) {
      // Buscar timer específico de uma categoria
      const timer = await driveService.getActiveTimer(categoryId);

      if (!timer) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'NOT_FOUND', message: 'Nenhum timer ativo para esta categoria' },
            timestamp: new Date().toISOString(),
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: timer,
        timestamp: new Date().toISOString(),
      });
    }

    // Listar todos os timers ativos
    const timers = await driveService.listActiveTimers();

    return NextResponse.json({
      success: true,
      data: timers,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting active timers:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Erro ao obter timers ativos' },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/drive/active-timer
 * Inicia ou para um timer ativo no Drive
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<ActiveTimerRecord | TimeEntry>>> {
  try {
    const session = await getSession();

    if (!session?.user || !session.accessToken) {
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
    const { action, categoryId, deviceInfo, notes } = body as {
      action: 'start' | 'stop' | 'cancel';
      categoryId: string;
      deviceInfo: DeviceInfo;
      notes?: string;
    };

    if (!action || !categoryId || !deviceInfo) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Campos obrigatórios: action, categoryId, deviceInfo',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const driveService = createDriveService(session.accessToken);

    if (action === 'start') {
      try {
        const timer = await driveService.startActiveTimer(
          categoryId,
          session.user.id,
          deviceInfo,
          notes
        );

        return NextResponse.json({
          success: true,
          data: timer,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro ao iniciar timer';
        return NextResponse.json(
          {
            success: false,
            error: { code: 'CONFLICT', message: errorMessage },
            timestamp: new Date().toISOString(),
          },
          { status: 409 }
        );
      }
    }

    if (action === 'stop') {
      const timeEntry = await driveService.stopActiveTimer(categoryId, deviceInfo, notes);

      if (!timeEntry) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'NOT_FOUND', message: 'Nenhum timer ativo para esta categoria' },
            timestamp: new Date().toISOString(),
          },
          { status: 404 }
        );
      }

      // Salva o timeEntry no arquivo de timeEntries do Drive
      const existingEntries = await driveService.readTimeEntries();
      await driveService.writeTimeEntries([...existingEntries, timeEntry]);

      return NextResponse.json({
        success: true,
        data: timeEntry,
        timestamp: new Date().toISOString(),
      });
    }

    if (action === 'cancel') {
      const cancelled = await driveService.cancelActiveTimer(categoryId);

      if (!cancelled) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'NOT_FOUND', message: 'Nenhum timer ativo para cancelar' },
            timestamp: new Date().toISOString(),
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: { cancelled: true } as unknown as TimeEntry,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Ação inválida. Use "start", "stop" ou "cancel".',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing active timer:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Erro ao processar timer ativo' },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/drive/active-timer
 * Limpa todos os timers ativos
 */
export async function DELETE(): Promise<NextResponse<ApiResponse<{ deletedCount: number }>>> {
  try {
    const session = await getSession();

    if (!session?.user || !session.accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Não autenticado' },
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    const driveService = createDriveService(session.accessToken);
    const deletedCount = await driveService.clearAllActiveTimers();

    return NextResponse.json({
      success: true,
      data: { deletedCount },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error clearing active timers:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Erro ao limpar timers ativos' },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
