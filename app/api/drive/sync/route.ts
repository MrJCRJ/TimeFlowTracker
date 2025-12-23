import { NextRequest, NextResponse } from 'next/server';
import { getSession, getAccessToken } from '@/lib/auth';
import { createDriveService } from '@/lib/drive';
import type { ApiResponse, SyncResult } from '@/types';

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic';

/**
 * GET /api/drive/sync
 * Carrega todos os dados do Google Drive com verificação de exclusão
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
    const data = await driveService.loadAllWithVerification();

    // Se algum arquivo foi deletado externamente, notificar o cliente
    if (data.deletedFiles.anyDeleted) {
      return NextResponse.json({
        success: true,
        data: {
          categories: data.categories,
          timeEntries: data.timeEntries,
          preferences: data.preferences,
          dataDeleted: true,
          deletedFiles: data.deletedFiles,
          message: 'Alguns dados foram deletados do Google Drive',
        },
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        categories: data.categories,
        timeEntries: data.timeEntries,
        preferences: data.preferences,
        dataDeleted: false,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error loading from Drive:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DRIVE_ERROR',
          message: 'Erro ao carregar dados do Google Drive',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/drive/sync
 * Sincroniza dados com o Google Drive
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<SyncResult>>> {
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

    const driveService = createDriveService(accessToken);
    await driveService.syncAll(categories, timeEntries, preferences);

    const result: SyncResult = {
      success: true,
      syncedAt: new Date().toISOString(),
      categoriesSynced: categories?.length ?? 0,
      entriesSynced: timeEntries?.length ?? 0,
      conflicts: [],
    };

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error syncing to Drive:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SYNC_ERROR',
          message: 'Erro ao sincronizar com Google Drive',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
