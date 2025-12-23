import { NextRequest, NextResponse } from 'next/server';
import { getSession, getAccessToken } from '@/lib/auth';
import { google } from 'googleapis';
import type { ApiResponse } from '@/types';
import { DRIVE_FOLDER_NAME, DRIVE_FILES } from '@/lib/constants';

export const dynamic = 'force-dynamic';

interface SyncMetadata {
  updatedAt: string;
  lastSyncDevice?: string;
  version: number;
}

/**
 * GET /api/drive/sync/metadata
 * Busca o timestamp de última sincronização do arquivo sync-metadata.json no Drive
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

    // Configurar Google Drive API
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
    if (!folders || folders.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          updatedAt: null,
          exists: false,
        },
        timestamp: new Date().toISOString(),
      });
    }

    const folderId = folders[0].id;

    // Buscar arquivo sync-metadata.json
    const fileResponse = await drive.files.list({
      q: `name='${DRIVE_FILES.SYNC_METADATA}' and '${folderId}' in parents and trashed=false`,
      fields: 'files(id)',
      spaces: 'drive',
    });

    const files = fileResponse.data.files;
    if (!files || files.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          updatedAt: null,
          exists: false,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Ler conteúdo do arquivo
    const fileId = files[0].id;
    const contentResponse = await drive.files.get({
      fileId: fileId!,
      alt: 'media',
    });

    const metadata = contentResponse.data as unknown as SyncMetadata;

    return NextResponse.json({
      success: true,
      data: {
        updatedAt: metadata.updatedAt || null,
        lastSyncDevice: metadata.lastSyncDevice || null,
        version: metadata.version || 1,
        exists: true,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error getting sync metadata:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DRIVE_ERROR',
          message: 'Erro ao buscar metadados de sincronização',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/drive/sync/metadata
 * Atualiza o timestamp de sincronização no arquivo sync-metadata.json no Drive
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
    const { updatedAt, deviceName } = body;

    if (!updatedAt) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'updatedAt é obrigatório' },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Configurar Google Drive API
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    const drive = google.drive({ version: 'v3', auth });

    // Buscar ou criar pasta do TimeFlow
    let folderId: string;

    const folderResponse = await drive.files.list({
      q: `name='${DRIVE_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id)',
      spaces: 'drive',
    });

    const folders = folderResponse.data.files;
    if (folders && folders.length > 0 && folders[0].id) {
      folderId = folders[0].id;
    } else {
      const createFolderResponse = await drive.files.create({
        requestBody: {
          name: DRIVE_FOLDER_NAME,
          mimeType: 'application/vnd.google-apps.folder',
        },
        fields: 'id',
      });
      folderId = createFolderResponse.data.id!;
    }

    // Buscar arquivo existente
    const fileResponse = await drive.files.list({
      q: `name='${DRIVE_FILES.SYNC_METADATA}' and '${folderId}' in parents and trashed=false`,
      fields: 'files(id)',
      spaces: 'drive',
    });

    const metadata: SyncMetadata = {
      updatedAt,
      lastSyncDevice: deviceName || 'Unknown Device',
      version: 1,
    };

    const content = JSON.stringify(metadata, null, 2);

    const files = fileResponse.data.files;
    if (files && files.length > 0 && files[0].id) {
      await drive.files.update({
        fileId: files[0].id,
        media: {
          mimeType: 'application/json',
          body: content,
        },
      });
    } else {
      await drive.files.create({
        requestBody: {
          name: DRIVE_FILES.SYNC_METADATA,
          parents: [folderId],
          mimeType: 'application/json',
        },
        media: {
          mimeType: 'application/json',
          body: content,
        },
        fields: 'id',
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        updatedAt,
        message: 'Metadata de sincronização atualizado',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating sync metadata:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DRIVE_ERROR',
          message: 'Erro ao atualizar metadados de sincronização',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
