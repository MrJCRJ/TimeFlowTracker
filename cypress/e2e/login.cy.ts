describe('Login Page', () => {
  it('should display the login page correctly', () => {
    cy.visit('/login');
    
    // Check header
    cy.contains('TimeFlow Tracker').should('be.visible');
    
    // Check main content
    cy.contains('Gerencie seu tempo com').should('be.visible');
    cy.contains('eficiência').should('be.visible');
    
    // Check features
    cy.contains('Rastreamento de Tempo').should('be.visible');
    cy.contains('Dashboard Analítico').should('be.visible');
    cy.contains('Sincronização na Nuvem').should('be.visible');
    cy.contains('Privacidade').should('be.visible');
    
    // Check login card
    cy.contains('Bem-vindo').should('be.visible');
    cy.contains('Entre com sua conta Google para começar').should('be.visible');
    cy.contains('Entrar com Google').should('be.visible');
  });

  it('should have the Google sign in button', () => {
    cy.visit('/login');
    cy.contains('button', 'Entrar com Google').should('be.visible');
  });

  it('should display terms links', () => {
    cy.visit('/login');
    cy.contains('Termos de Uso').should('be.visible');
    cy.contains('Política de Privacidade').should('be.visible');
  });

  it('should display footer with copyright', () => {
    cy.visit('/login');
    cy.contains('TimeFlow Tracker. Todos os direitos reservados').should('be.visible');
  });

  it('should redirect to dashboard when already authenticated', () => {
    cy.login();
    cy.visit('/login');
    cy.url().should('eq', Cypress.config().baseUrl + '/');
  });
});
