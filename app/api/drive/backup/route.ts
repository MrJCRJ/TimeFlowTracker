import { NextRequest, NextResponse } from 'next/server';
import { getSession, getAccessToken } from '@/lib/auth';
import { createDriveService } from '@/lib/drive';
import type { ApiResponse } from '@/types';

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic';

/**
 * POST /api/drive/backup
 * Faz backup completo dos dados para o Google Drive
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
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

    const accessToken = await getAccessToken();
    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Token de acesso não disponível' },
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { categories, timeEntries, preferences, activeTimer, syncedAt } = body;

    // Permitir backup parcial (para sendBeacon)
    if (!categories && !timeEntries) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Nenhum dado para backup',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const driveService = createDriveService(accessToken);

    // Criar objeto de preferências padrão se não fornecido
    const userPreferences = preferences || {
      userId: session.user.id,
      workHours: { start: '09:00', end: '18:00' },
      dailyGoals: {},
      theme: 'system',
      notifications: true,
      autoSync: true,
      syncInterval: 5,
      updatedAt: syncedAt || new Date().toISOString(),
    };

    // Incluir timer ativo nas preferências APENAS se existir e não for null
    if (activeTimer && activeTimer !== null) {
      userPreferences.activeTimer = activeTimer;
    } else {
      // Remover activeTimer das preferências se não existir
      delete userPreferences.activeTimer;
    }

    const result = await driveService.syncAll(categories || [], timeEntries || [], userPreferences);

    return NextResponse.json({
      success: true,
      data: {
        backupAt: new Date().toISOString(),
        files: result,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DRIVE_ERROR',
          message: 'Erro ao criar backup no Google Drive',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
