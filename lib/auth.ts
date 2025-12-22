import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * Obtém a sessão do usuário no servidor
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * Obtém o usuário autenticado ou redireciona para login
 */
export async function getAuthenticatedUser() {
  const session = await getSession();

  if (!session?.user) {
    redirect('/login');
  }

  return session.user;
}

/**
 * Verifica se o usuário está autenticado
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session?.user;
}

/**
 * Obtém o access token do Google
 */
export async function getAccessToken(): Promise<string | null> {
  const session = await getSession();
  return session?.accessToken ?? null;
}

/**
 * Tipo para informações do usuário
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  image: string;
}
