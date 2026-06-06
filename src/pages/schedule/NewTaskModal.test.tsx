/* ================================================
   FILE: src/pages/schedule/NewTaskModal.test.tsx
   ================================================ */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NewTaskModal } from './NewTaskModal';

vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useFormStatus: () => ({ pending: false }),
  };
});

describe('NewTaskModal', () => {
  const mockOnClose = vi.fn();
  const mockOnTaskCreated = vi.fn();

  const defaultProps = {
    isOpen: true,
    defaultDate: '',
    onClose: mockOnClose,
    onTaskCreated: mockOnTaskCreated,
  };

  it('should not render when isOpen is false', () => {
    render(<NewTaskModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Schedule Event')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(<NewTaskModal {...defaultProps} />);
    expect(screen.getByText('Schedule Event')).toBeInTheDocument();
  });

  it('should render all form fields', () => {
    render(<NewTaskModal {...defaultProps} />);
    expect(screen.getByRole('textbox', { name: '' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '', hidden: true })).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should render Cancel and Schedule Task buttons', () => {
    render(<NewTaskModal {...defaultProps} />);
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Schedule Task')).toBeInTheDocument();
  });

  it('should call onClose when Cancel button is clicked', () => {
    render(<NewTaskModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when ESC button is clicked', () => {
    render(<NewTaskModal {...defaultProps} />);
    const escButton = screen.getByText('[ESC]');
    fireEvent.click(escButton);
    expect(mockOnClose).toHaveBeenCalled();
  });
});
