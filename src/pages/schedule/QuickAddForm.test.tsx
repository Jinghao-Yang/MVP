/* ================================================
   FILE: src/pages/schedule/QuickAddForm.test.tsx
   ================================================ */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuickAddForm } from './QuickAddForm';

describe('QuickAddForm', () => {
  const mockOnTextChange = vi.fn();
  const mockOnSubmit = vi.fn();

  it('should render input field', () => {
    render(
      <QuickAddForm quickAddText="" onTextChange={mockOnTextChange} onSubmit={mockOnSubmit} />
    );
    expect(screen.getByPlaceholderText(/Proof Heine-Borel theorem/)).toBeInTheDocument();
  });

  it('should render Add Task Event button', () => {
    render(
      <QuickAddForm quickAddText="" onTextChange={mockOnTextChange} onSubmit={mockOnSubmit} />
    );
    expect(screen.getByText('Add Task Event')).toBeInTheDocument();
  });

  it('should call onTextChange when input value changes', () => {
    render(
      <QuickAddForm quickAddText="" onTextChange={mockOnTextChange} onSubmit={mockOnSubmit} />
    );

    const input = screen.getByPlaceholderText(/Proof Heine-Borel theorem/);
    fireEvent.change(input, { target: { value: 'Test task' } });

    expect(mockOnTextChange).toHaveBeenCalledWith('Test task');
  });

  it('should call onSubmit when form is submitted', () => {
    render(
      <QuickAddForm
        quickAddText="Test task"
        onTextChange={mockOnTextChange}
        onSubmit={mockOnSubmit}
      />
    );

    const button = screen.getByText('Add Task Event');
    fireEvent.click(button);

    expect(mockOnSubmit).toHaveBeenCalled();
  });

  it('should display syntax help text', () => {
    render(
      <QuickAddForm quickAddText="" onTextChange={mockOnTextChange} onSubmit={mockOnSubmit} />
    );
    expect(screen.getByText(/@YYYY-MM-DD/)).toBeInTheDocument();
    expect(screen.getByText(/!High\/!Low/)).toBeInTheDocument();
  });
});
