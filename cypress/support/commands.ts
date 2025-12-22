// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to mock authentication
       */
      login(): Chainable<void>;
      
      /**
       * Custom command to start a timer for a category
       */
      startTimer(categoryName: string): Chainable<void>;
      
      /**
       * Custom command to stop the active timer
       */
      stopTimer(): Chainable<void>;
      
      /**
       * Custom command to create a new category
       */
      createCategory(name: string, color?: string): Chainable<void>;
    }
  }
}

// Mock login command
Cypress.Commands.add('login', () => {
  // Mock the session for testing
  cy.window().then((win) => {
    win.localStorage.setItem('next-auth.session-token', 'mock-session-token');
  });
  
  // Intercept the session API
  cy.intercept('/api/auth/session', {
    statusCode: 200,
    body: {
      user: {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
        image: 'https://via.placeholder.com/150',
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
  });
});

// Start timer command
Cypress.Commands.add('startTimer', (categoryName: string) => {
  cy.contains('[data-testid="category-item"]', categoryName).click();
});

// Stop timer command
Cypress.Commands.add('stopTimer', () => {
  cy.get('[data-testid="timer-bar"]').within(() => {
    cy.get('button').contains(/parar|stop/i).click();
  });
});

// Create category command
Cypress.Commands.add('createCategory', (name: string, color?: string) => {
  cy.get('[data-testid="add-category-btn"]').click();
  cy.get('[data-testid="category-name-input"]').type(name);
  if (color) {
    cy.get(`[data-testid="color-${color}"]`).click();
  }
  cy.get('[data-testid="submit-category-btn"]').click();
});

export {};
