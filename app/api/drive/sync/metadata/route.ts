import { NextResponse } from 'next/server';
import { getSession, getAccessToken } from '@/lib/auth';
import { createDriveService } from '@/lib/drive';
import type { ApiResponse } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/drive/sync/metadata
 * Retorna apenas o timestamp de última atualização do Drive
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

    // Buscar preferências que contém o updatedAt
    const preferences = await driveService.readPreferences();

    // Se não existe, retorna null
    if (!preferences) {
      return NextResponse.json({
        success: true,
        data: {
          updatedAt: null,
          exists: false,
        },
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        updatedAt: preferences.updatedAt || null,
        exists: true,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting Drive metadata:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DRIVE_ERROR',
          message: 'Erro ao buscar metadados do Google Drive',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
