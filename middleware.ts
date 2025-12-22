import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware() {
    // Middleware executado apenas para rotas protegidas
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login).*)'],
};
