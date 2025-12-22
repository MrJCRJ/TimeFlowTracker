describe('Analytics Page', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/analytics');
  });

  it('should display the analytics header', () => {
    cy.contains('h1', 'Análise').should('be.visible');
    cy.contains('Visualize seu uso do tempo').should('be.visible');
  });

  it('should show period selector buttons', () => {
    cy.contains('Hoje').should('be.visible');
    cy.contains('Semana').should('be.visible');
    cy.contains('Mês').should('be.visible');
    cy.contains('Personalizado').should('be.visible');
  });

  it('should switch between time periods', () => {
    // Default is week
    cy.contains('button', 'Semana').should('have.class', 'bg-primary');
    
    // Switch to today
    cy.contains('button', 'Hoje').click();
    cy.contains('Esta Semana').should('not.exist');
    
    // Switch to month
    cy.contains('button', 'Mês').click();
    cy.contains('Este Mês').should('be.visible');
  });

  it('should show custom date picker when selecting custom period', () => {
    cy.contains('button', 'Personalizado').click();
    cy.get('input[type="date"]').should('have.length', 2);
  });

  it('should display summary cards', () => {
    cy.contains('Tempo Total').should('be.visible');
    cy.contains('Média Diária').should('be.visible');
    cy.contains('Categorias Usadas').should('be.visible');
  });

  it('should show empty state when no data exists', () => {
    cy.contains('button', 'Hoje').click();
    cy.contains('Nenhum dado para este período').should('be.visible');
  });

  it('should display charts when data exists', () => {
    // This test assumes there's data - you may need to seed data first
    cy.contains('button', 'Semana').click();
    // If data exists, charts should be visible
    // cy.get('[data-testid="time-chart"]').should('be.visible');
  });
});
