describe('Categories Page', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/categories');
  });

  it('should display the categories header', () => {
    cy.contains('h1', 'Categorias').should('be.visible');
    cy.contains('Gerencie suas categorias de tempo').should('be.visible');
  });

  it('should show the new category button', () => {
    cy.contains('Nova Categoria').should('be.visible');
  });

  it('should open the category form when clicking new category', () => {
    cy.contains('Nova Categoria').click();
    cy.contains('Nova Categoria').should('be.visible');
    cy.get('input[name="name"]').should('be.visible');
  });

  it('should validate required fields', () => {
    cy.contains('Nova Categoria').click();
    cy.contains('button', 'Salvar').click();
    cy.contains('Nome é obrigatório').should('be.visible');
  });

  it('should create a new category', () => {
    cy.contains('Nova Categoria').click();
    cy.get('input[name="name"]').type('Trabalho');
    cy.contains('button', 'Salvar').click();
    cy.contains('Trabalho').should('be.visible');
  });

  it('should edit a category', () => {
    // First create a category
    cy.contains('Nova Categoria').click();
    cy.get('input[name="name"]').type('Estudos');
    cy.contains('button', 'Salvar').click();

    // Then edit it
    cy.contains('Estudos').parent().parent().within(() => {
      cy.get('button').first().click(); // Edit button
    });
    
    cy.get('input[name="name"]').clear().type('Estudos Avançados');
    cy.contains('button', 'Salvar').click();
    cy.contains('Estudos Avançados').should('be.visible');
  });

  it('should delete a category', () => {
    // First create a category
    cy.contains('Nova Categoria').click();
    cy.get('input[name="name"]').type('Para Deletar');
    cy.contains('button', 'Salvar').click();

    // Then delete it
    cy.contains('Para Deletar').parent().parent().within(() => {
      cy.get('button').last().click(); // Delete button
    });
    
    cy.contains('Tem certeza').should('be.visible');
    cy.contains('button', 'Excluir').click();
    cy.contains('Para Deletar').should('not.exist');
  });

  it('should cancel category deletion', () => {
    // First create a category
    cy.contains('Nova Categoria').click();
    cy.get('input[name="name"]').type('Não Deletar');
    cy.contains('button', 'Salvar').click();

    // Try to delete but cancel
    cy.contains('Não Deletar').parent().parent().within(() => {
      cy.get('button').last().click(); // Delete button
    });
    
    cy.contains('button', 'Cancelar').click();
    cy.contains('Não Deletar').should('be.visible');
  });
});
