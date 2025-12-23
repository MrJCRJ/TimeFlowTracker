import { NextResponse } from 'next/server';
import { getSession, getAccessToken } from '@/lib/auth';
import { createDriveService } from '@/lib/drive';
import type { ApiResponse } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/drive/sync/download
 * Baixa todos os dados do Drive (sobrescreve locais)
 */
export async function GET(): Promise<NextResponse<ApiResponse>> {
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

    const driveService = createDriveService(accessToken);

    // Carregar todos os dados do Drive
    const [categories, timeEntries, preferences] = await Promise.all([
      driveService.readCategories(),
      driveService.readTimeEntries(),
      driveService.readPreferences(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        categories: categories || [],
        timeEntries: timeEntries || [],
        updatedAt: preferences?.updatedAt || new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error downloading from Drive:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DRIVE_ERROR',
          message: 'Erro ao baixar dados do Google Drive',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
