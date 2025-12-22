# TimeFlow Tracker - Guia de Deploy no Vercel

## 🚀 Deploy Bem-Sucedido

Este projeto está configurado para deploy no Vercel. Siga os passos abaixo para configurar corretamente.

## 📋 Pré-requisitos

### 1. Conta Google Cloud Console
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a Google Drive API
4. Configure as credenciais OAuth 2.0:
   - Tipo: Web application
   - URIs de redirecionamento autorizados: `https://your-domain.vercel.app/api/auth/callback/google`
   - Escopos: `openid`, `email`, `profile`, `https://www.googleapis.com/auth/drive.file`

### 2. Variáveis de Ambiente no Vercel

No painel do Vercel, vá para **Settings > Environment Variables** e adicione:

```bash
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
NEXTAUTH_SECRET=your_random_secret_here_generate_with_openssl
NEXTAUTH_URL=https://your-domain.vercel.app
```

#### Como gerar o NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

## 🔧 Configuração do Build

O projeto já está configurado com:
- ✅ Next.js 14.2.21
- ✅ TypeScript
- ✅ Tailwind CSS
- ✅ NextAuth.js
- ✅ PWA (Service Worker)
- ✅ Middleware de autenticação

## 📱 Funcionalidades

- ✅ **Timer de produtividade** com notificações
- ✅ **Categorização de tarefas**
- ✅ **Análises e relatórios**
- ✅ **Sincronização com Google Drive**
- ✅ **Tema escuro/claro/sistema**
- ✅ **Notificações push** (quando suportado)
- ✅ **PWA** (instalável)

## 🚨 Solução de Problemas

### Erro: "Missing required environment variables"
- ✅ Verifique se todas as variáveis foram adicionadas no Vercel
- ✅ Certifique-se de que não há espaços extras
- ✅ Re-deploy após adicionar as variáveis

### Erro: "Build failed"
- ✅ Execute `npm run build` localmente primeiro
- ✅ Verifique se todas as dependências estão instaladas
- ✅ Certifique-se de que o Node.js version no Vercel é 18+

### Autenticação não funciona
- ✅ Verifique se o `NEXTAUTH_URL` está correto
- ✅ Certifique-se de que as credenciais Google estão válidas
- ✅ Verifique os logs do Vercel para erros específicos

## 📊 Monitoramento

Após o deploy, monitore:
- **Runtime Logs**: Para erros em produção
- **Analytics**: Para uso da aplicação
- **Performance**: Para otimização

## 🎯 Próximos Passos

1. Configure um domínio customizado
2. Configure analytics (Vercel Analytics)
3. Configure monitoring (Vercel Observability)
4. Teste todas as funcionalidades em produção

---

**Status**: ✅ Pronto para produção
**Última atualização**: Dezembro 2025