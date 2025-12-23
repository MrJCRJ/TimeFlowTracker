import { NextResponse } from 'next/server';
import { getSession, getAccessToken } from '@/lib/auth';
import { createDriveService } from '@/lib/drive';
import { google } from 'googleapis';
import { DRIVE_FOLDER_NAME, DRIVE_FILES } from '@/lib/constants';
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

    // Buscar timestamp do arquivo sync-metadata.json diretamente
    let syncTimestamp = null;
    try {
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });
      const drive = google.drive({ version: 'v3', auth });

      // Buscar pasta do TimeFlow
      const folderResponse = await drive.files.list({
        q: `name='${DRIVE_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id)',
        spaces: 'drive',
      });

      const folders = folderResponse.data.files;
      if (folders && folders.length > 0) {
        const folderId = folders[0].id;

        // Buscar arquivo sync-metadata.json
        const fileResponse = await drive.files.list({
          q: `name='${DRIVE_FILES.SYNC_METADATA}' and '${folderId}' in parents and trashed=false`,
          fields: 'files(id)',
          spaces: 'drive',
        });

        const files = fileResponse.data.files;
        if (files && files.length > 0) {
          // Ler conteúdo do arquivo
          const fileId = files[0].id;
          const contentResponse = await drive.files.get({
            fileId: fileId!,
            alt: 'media',
          });

          const metadata = contentResponse.data as { updatedAt?: string };
          syncTimestamp = metadata.updatedAt || null;
        }
      }
    } catch (error) {
      console.warn('Erro ao buscar metadata de sync:', error);
    }

    return NextResponse.json({
      success: true,
      data: {
        categories: categories || [],
        timeEntries: timeEntries || [],
        updatedAt: syncTimestamp || preferences?.updatedAt || new Date().toISOString(),
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
