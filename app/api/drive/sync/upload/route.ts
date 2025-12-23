import { NextRequest, NextResponse } from 'next/server';
import { getSession, getAccessToken } from '@/lib/auth';
import { createDriveService } from '@/lib/drive';
import type { ApiResponse, UserPreferences } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/drive/sync/upload
 * Envia dados locais para o Drive (sobrescreve Drive)
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
    const { categories, timeEntries, updatedAt } = body;

    if (!Array.isArray(categories) || !Array.isArray(timeEntries)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Dados inválidos: categories e timeEntries devem ser arrays',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const driveService = createDriveService(accessToken);

    // Criar preferências com o timestamp de atualização
    const preferences: UserPreferences = {
      userId: session.user.id,
      workHours: { start: '09:00', end: '18:00' },
      dailyGoals: {},
      theme: 'system',
      notifications: true,
      autoSync: true,
      syncInterval: 5,
      updatedAt: updatedAt || new Date().toISOString(),
    };

    // Salvar todos os dados de uma vez
    const result = await driveService.syncAll(categories, timeEntries, preferences);

    return NextResponse.json({
      success: true,
      data: {
        message: 'Dados enviados para o Drive',
        files: result,
        updatedAt: preferences.updatedAt,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error uploading to Drive:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DRIVE_ERROR',
          message: 'Erro ao enviar dados para o Google Drive',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
