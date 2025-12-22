import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { GoogleDriveService } from '@/lib/drive';
import type { drive_v3 } from 'googleapis';

type DriveFile = drive_v3.Schema$File;

// Forçar renderização dinâmica
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json({
        connected: false,
        error: 'Usuário não autenticado',
      });
    }

    const driveService = new GoogleDriveService(session.accessToken as string);

    // Verificar se conseguimos acessar o Drive
    const isConnected = await driveService.testConnection();

    if (!isConnected) {
      return NextResponse.json({
        connected: false,
        error: 'Não foi possível conectar ao Google Drive',
      });
    }

    // Tentar obter informações do último backup
    let lastBackup = null;
    try {
      const files = await driveService.listFiles();
      const backupFile = files.find(
        (file: DriveFile) =>
          file.name?.startsWith('timeflow-backup-') && file.name?.endsWith('.json')
      );

      if (backupFile?.modifiedTime) {
        lastBackup = backupFile.modifiedTime;
      }
    } catch (error) {
      // Se não conseguir listar arquivos, ainda consideramos conectado
      console.warn('Não foi possível verificar arquivos de backup:', error);
    }

    return NextResponse.json({
      connected: true,
      lastBackup,
    });
  } catch (error) {
    console.error('Erro ao verificar status do Drive:', error);
    return NextResponse.json(
      {
        connected: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
