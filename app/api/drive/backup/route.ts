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
    const { categories, timeEntries, preferences } = body;

    if (!categories || !timeEntries || !preferences) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Dados incompletos para backup',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const driveService = createDriveService(accessToken);
    const result = await driveService.syncAll(categories, timeEntries, preferences);

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
