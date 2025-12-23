import { NextResponse } from 'next/server';
import { getSession, getAccessToken } from '@/lib/auth';
import { createDriveService } from '@/lib/drive';
import type { ApiResponse } from '@/types';

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic';

/**
 * GET /api/drive/verify
 * Verifica se arquivos de dados foram deletados externamente no Google Drive
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
    const verification = await driveService.verifyDataFiles();

    return NextResponse.json({
      success: true,
      data: {
        ...verification,
        message: verification.anyDeleted
          ? 'Alguns arquivos foram deletados do Google Drive'
          : 'Todos os arquivos estão intactos',
        verifiedAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error verifying Drive files:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DRIVE_ERROR',
          message: 'Erro ao verificar arquivos do Google Drive',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
