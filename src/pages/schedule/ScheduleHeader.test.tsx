/* ================================================
   FILE: src/pages/schedule/ScheduleHeader.test.tsx
   ================================================ */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScheduleHeader } from './ScheduleHeader';

describe('ScheduleHeader', () => {
  const mockOnViewModeChange = vi.fn();
  const mockOnGenerateJournal = vi.fn();

  it('should render Axiom Planner title', () => {
    render(
      <ScheduleHeader
        viewMode="calendar"
        onViewModeChange={mockOnViewModeChange}
        onGenerateJournal={mockOnGenerateJournal}
      />
    );
    expect(screen.getByText('Axiom Planner')).toBeInTheDocument();
  });

  it('should render Generate Daily Journal button', () => {
    render(
      <ScheduleHeader
        viewMode="calendar"
        onViewModeChange={mockOnViewModeChange}
        onGenerateJournal={mockOnGenerateJournal}
      />
    );
    expect(screen.getByText('Generate Daily Journal')).toBeInTheDocument();
  });

  it('should render Calendar and Kanban toggle buttons', () => {
    render(
      <ScheduleHeader
        viewMode="calendar"
        onViewModeChange={mockOnViewModeChange}
        onGenerateJournal={mockOnGenerateJournal}
      />
    );
    expect(screen.getByText('Calendar')).toBeInTheDocument();
    expect(screen.getByText('Kanban')).toBeInTheDocument();
  });

  it('should call onGenerateJournal when button is clicked', () => {
    render(
      <ScheduleHeader
        viewMode="calendar"
        onViewModeChange={mockOnViewModeChange}
        onGenerateJournal={mockOnGenerateJournal}
      />
    );

    fireEvent.click(screen.getByText('Generate Daily Journal'));
    expect(mockOnGenerateJournal).toHaveBeenCalledTimes(1);
  });

  it('should call onViewModeChange with calendar when Calendar button is clicked', () => {
    render(
      <ScheduleHeader
        viewMode="kanban"
        onViewModeChange={mockOnViewModeChange}
        onGenerateJournal={mockOnGenerateJournal}
      />
    );

    fireEvent.click(screen.getByText('Calendar'));
    expect(mockOnViewModeChange).toHaveBeenCalledWith('calendar');
  });

  it('should call onViewModeChange with kanban when Kanban button is clicked', () => {
    render(
      <ScheduleHeader
        viewMode="calendar"
        onViewModeChange={mockOnViewModeChange}
        onGenerateJournal={mockOnGenerateJournal}
      />
    );

    fireEvent.click(screen.getByText('Kanban'));
    expect(mockOnViewModeChange).toHaveBeenCalledWith('kanban');
  });

  it('should highlight active view mode', () => {
    const { rerender } = render(
      <ScheduleHeader
        viewMode="calendar"
        onViewModeChange={mockOnViewModeChange}
        onGenerateJournal={mockOnGenerateJournal}
      />
    );

    const calendarButton = screen.getByText('Calendar').closest('button');
    expect(calendarButton).toHaveClass('bg-white');
    expect(calendarButton).toHaveClass('text-black');

    rerender(
      <ScheduleHeader
        viewMode="kanban"
        onViewModeChange={mockOnViewModeChange}
        onGenerateJournal={mockOnGenerateJournal}
      />
    );

    const kanbanButton = screen.getByText('Kanban').closest('button');
    expect(kanbanButton).toHaveClass('bg-white');
    expect(kanbanButton).toHaveClass('text-black');
  });
});
