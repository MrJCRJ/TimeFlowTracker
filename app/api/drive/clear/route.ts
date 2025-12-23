import { NextResponse } from 'next/server';
import { getSession, getAccessToken } from '@/lib/auth';
import { createDriveService } from '@/lib/drive';
import type { ApiResponse } from '@/types';

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic';

/**
 * DELETE /api/drive/clear
 * Limpa todos os dados do Google Drive
 */
export async function DELETE(): Promise<NextResponse<ApiResponse>> {
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
    await driveService.clearAll();

    return NextResponse.json({
      success: true,
      data: {
        message: 'Dados do Drive limpos com sucesso',
        clearedAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error clearing Drive data:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DRIVE_ERROR',
          message: 'Erro ao limpar dados do Google Drive',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
