describe('Dashboard Page', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/');
  });

  it('should display the dashboard header', () => {
    cy.contains('h1', 'Dashboard').should('be.visible');
    cy.contains('Acompanhe seu tempo e produtividade').should('be.visible');
  });

  it('should show stats cards', () => {
    cy.contains('Hoje').should('be.visible');
    cy.contains('Esta Semana').should('be.visible');
    cy.contains('Categoria Top').should('be.visible');
    cy.contains('Meta Diária').should('be.visible');
  });

  it('should navigate to categories page', () => {
    cy.contains('Categorias').click();
    cy.url().should('include', '/categories');
    cy.contains('h1', 'Categorias').should('be.visible');
  });

  it('should navigate to analytics page', () => {
    cy.contains('Análise').click();
    cy.url().should('include', '/analytics');
    cy.contains('h1', 'Análise').should('be.visible');
  });

  it('should display empty state when no entries exist', () => {
    cy.contains('Nenhum registro ainda').should('be.visible');
  });
});
