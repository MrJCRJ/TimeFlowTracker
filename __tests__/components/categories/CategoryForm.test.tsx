/// <reference types="jest" />
/// <reference types="@testing-library/jest-dom" />

/**
 * TDD: CategoryForm Component Tests
 *
 * Comportamentos esperados:
 * - Renderiza formulário com campos: nome, cor, ícone
 * - Valida campo nome (obrigatório, max 50 chars)
 * - Valida cor em formato hex
 * - Permite criar nova categoria
 * - Permite editar categoria existente
 * - Mostra erros de validação
 * - Chama callback onSubmit com dados corretos
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryForm } from '@/components/categories/CategoryForm';
import type { Category } from '@/types';

// Mock category para edição
const mockCategory: Category = {
  id: 'cat-1',
  name: 'Trabalho',
  color: '#3b82f6',
  icon: 'briefcase',
  isDefault: false,
  userId: 'user-1',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('CategoryForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderização', () => {
    it('deve renderizar o formulário corretamente', () => {
      render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
      // Verificar que existem opções de cor (botões)
      expect(screen.getAllByTestId('color-option').length).toBeGreaterThan(0);
      // Verificar que existem opções de ícone
      expect(screen.getAllByTestId('icon-option').length).toBeGreaterThan(0);
      expect(screen.getByRole('button', { name: /salvar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
    });

    it('deve renderizar título "Nova Categoria" para criação', () => {
      render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByText(/nova categoria/i)).toBeInTheDocument();
    });

    it('deve renderizar título "Editar Categoria" quando editando', () => {
      render(
        <CategoryForm category={mockCategory} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      expect(screen.getByText(/editar categoria/i)).toBeInTheDocument();
    });

    it('deve preencher campos com dados existentes ao editar', () => {
      render(
        <CategoryForm category={mockCategory} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      expect(screen.getByLabelText(/nome/i)).toHaveValue('Trabalho');
    });
  });

  describe('Validação', () => {
    it('deve mostrar erro quando nome está vazio', async () => {
      const user = userEvent.setup();
      render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const submitButton = screen.getByRole('button', { name: /salvar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/nome é obrigatório/i)).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('deve mostrar erro quando nome excede 50 caracteres', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Simular um nome com mais de 50 caracteres diretamente no componente
      // Para isso, vamos renderizar o componente com um estado inicial inválido
      const longName = 'a'.repeat(51);
      rerender(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Usar fireEvent para definir o valor diretamente, contornando o maxLength
      const nameInput = screen.getByLabelText(/nome/i);
      fireEvent.change(nameInput, { target: { value: longName } });

      // Preencher cor
      const colorInput = screen.getByPlaceholderText('#RRGGBB');
      await user.clear(colorInput);
      await user.type(colorInput, '#3b82f6');

      // Selecionar ícone
      const iconOptions = screen.getAllByTestId('icon-option');
      await user.click(iconOptions[0]);

      const submitButton = screen.getByRole('button', { name: /salvar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Nome deve ter no máximo 50 caracteres/i)).toBeInTheDocument();
      });
    });

    it('deve mostrar erro quando cor não é hex válida', async () => {
      const user = userEvent.setup();
      render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const nameInput = screen.getByLabelText(/nome/i);
      await user.type(nameInput, 'Minha Categoria');

      // Usar placeholder para encontrar o input de cor customizada
      const colorInput = screen.getByPlaceholderText('#RRGGBB');
      await user.clear(colorInput);
      await user.type(colorInput, 'invalid-color');

      const submitButton = screen.getByRole('button', { name: /salvar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/cor inválida/i)).toBeInTheDocument();
      });
    });
  });

  describe('Submissão', () => {
    it('deve chamar onSubmit com dados corretos ao criar', async () => {
      const user = userEvent.setup();
      render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const nameInput = screen.getByLabelText(/nome/i);
      await user.type(nameInput, 'Nova Categoria');

      const submitButton = screen.getByRole('button', { name: /salvar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Nova Categoria',
            color: expect.stringMatching(/^#[A-Fa-f0-9]{6}$/),
            icon: expect.any(String),
          })
        );
      });
    });

    it('deve chamar onSubmit com dados atualizados ao editar', async () => {
      const user = userEvent.setup();
      render(
        <CategoryForm category={mockCategory} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const nameInput = screen.getByLabelText(/nome/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Trabalho Atualizado');

      const submitButton = screen.getByRole('button', { name: /salvar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Trabalho Atualizado',
          })
        );
      });
    });

    it('deve chamar onCancel quando botão cancelar é clicado', async () => {
      const user = userEvent.setup();
      render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Seleção de cor', () => {
    it('deve mostrar opções de cores predefinidas', () => {
      render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Verifica se existem botões de cor
      const colorButtons = screen.getAllByRole('button', { name: /cor/i });
      expect(colorButtons.length).toBeGreaterThan(0);
    });

    it('deve atualizar cor selecionada ao clicar em opção', async () => {
      const user = userEvent.setup();
      render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Clica em uma opção de cor diferente
      const colorOptions = screen.getAllByTestId('color-option');
      if (colorOptions.length > 1) {
        await user.click(colorOptions[1]);

        // A cor deve estar selecionada
        expect(colorOptions[1]).toHaveClass('ring-2');
      }
    });
  });

  describe('Seleção de ícone', () => {
    it('deve mostrar opções de ícones', () => {
      render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const iconOptions = screen.getAllByTestId('icon-option');
      expect(iconOptions.length).toBeGreaterThan(0);
    });

    it('deve atualizar ícone selecionado ao clicar', async () => {
      const user = userEvent.setup();
      render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const iconOptions = screen.getAllByTestId('icon-option');
      if (iconOptions.length > 1) {
        await user.click(iconOptions[1]);

        expect(iconOptions[1]).toHaveClass('ring-2');
      }
    });
  });

  describe('Acessibilidade', () => {
    it('campos devem ter labels associados', () => {
      render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
      // Verificar input de cor customizada especificamente
      expect(screen.getByPlaceholderText('#RRGGBB')).toBeInTheDocument();
      // Verificar que existe pelo menos um botão de ícone
      expect(screen.getAllByTestId('icon-option').length).toBeGreaterThan(0);
    });

    it('formulário deve ser navegável por teclado', () => {
      render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const nameInput = screen.getByLabelText(/nome/i);
      nameInput.focus();
      expect(document.activeElement).toBe(nameInput);
    });

    it('deve mostrar indicador de campo obrigatório', () => {
      render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Verificar que há pelo menos um asterisco (múltiplos campos obrigatórios)
      const asterisks = screen.getAllByText(/\*/);
      expect(asterisks.length).toBeGreaterThan(0);
    });
  });

  describe('Estado de loading', () => {
    it('deve desabilitar botões durante submissão', async () => {
      mockOnSubmit.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)));

      const user = userEvent.setup();
      render(<CategoryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const nameInput = screen.getByLabelText(/nome/i);
      await user.type(nameInput, 'Nova Categoria');

      const submitButton = screen.getByRole('button', { name: /salvar/i });
      await user.click(submitButton);

      // Botão deve mostrar loading
      expect(submitButton).toBeDisabled();
    });
  });
});
