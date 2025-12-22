describe('Timer Functionality', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/');
  });

  it('should show the timer bar when timer is active', () => {
    // Start a timer by selecting a category
    cy.visit('/categories');
    
    // Create a test category first
    cy.contains('Nova Categoria').click();
    cy.get('input[name="name"]').type('Timer Test');
    cy.contains('button', 'Salvar').click();
    
    // Go back to dashboard and verify timer bar presence
    cy.visit('/');
    cy.get('[data-testid="timer-bar"]').should('exist');
  });

  it('should display elapsed time correctly', () => {
    cy.get('[data-testid="timer-bar"]').within(() => {
      cy.contains(/\d{2}:\d{2}:\d{2}/).should('be.visible');
    });
  });

  it('should pause and resume timer', () => {
    cy.get('[data-testid="timer-bar"]').within(() => {
      // Pause
      cy.get('button').contains(/pausar|pause/i).click();
      cy.get('button').contains(/continuar|resume|iniciar/i).should('be.visible');
      
      // Resume
      cy.get('button').contains(/continuar|resume|iniciar/i).click();
      cy.get('button').contains(/pausar|pause/i).should('be.visible');
    });
  });

  it('should stop timer and save entry', () => {
    cy.get('[data-testid="timer-bar"]').within(() => {
      cy.stopTimer();
    });
    
    // Verify entry was saved
    cy.visit('/analytics');
    cy.contains('Timer Test').should('be.visible');
  });
});
