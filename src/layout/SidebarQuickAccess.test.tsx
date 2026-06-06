/* ================================================
   FILE: src/layout/SidebarQuickAccess.test.tsx
   ================================================ */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SidebarQuickAccess } from './SidebarQuickAccess';

describe('SidebarQuickAccess', () => {
  const mockOpenCommandPalette = vi.fn();
  const mockOnCreateNewNode = vi.fn();

  it('should render Search Node button', () => {
    render(
      <SidebarQuickAccess
        openCommandPalette={mockOpenCommandPalette}
        onCreateNewNode={mockOnCreateNewNode}
      />
    );
    expect(screen.getByText('Search Node')).toBeInTheDocument();
  });

  it('should render New Page Node button', () => {
    render(
      <SidebarQuickAccess
        openCommandPalette={mockOpenCommandPalette}
        onCreateNewNode={mockOnCreateNewNode}
      />
    );
    expect(screen.getByText('New Page Node')).toBeInTheDocument();
  });

  it('should call openCommandPalette when Search Node button is clicked', () => {
    render(
      <SidebarQuickAccess
        openCommandPalette={mockOpenCommandPalette}
        onCreateNewNode={mockOnCreateNewNode}
      />
    );

    fireEvent.click(screen.getByText('Search Node'));
    expect(mockOpenCommandPalette).toHaveBeenCalledTimes(1);
  });

  it('should call onCreateNewNode when New Page Node button is clicked', () => {
    render(
      <SidebarQuickAccess
        openCommandPalette={mockOpenCommandPalette}
        onCreateNewNode={mockOnCreateNewNode}
      />
    );

    fireEvent.click(screen.getByText('New Page Node'));
    expect(mockOnCreateNewNode).toHaveBeenCalledTimes(1);
  });

  it('should display keyboard shortcut for search', () => {
    render(
      <SidebarQuickAccess
        openCommandPalette={mockOpenCommandPalette}
        onCreateNewNode={mockOnCreateNewNode}
      />
    );
    expect(screen.getByText('⌘K')).toBeInTheDocument();
  });
});
