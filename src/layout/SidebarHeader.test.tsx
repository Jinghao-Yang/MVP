/* ================================================
   FILE: src/layout/SidebarHeader.test.tsx
   ================================================ */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SidebarHeader } from './SidebarHeader';

describe('SidebarHeader', () => {
  it('should render AXIOM brand name', () => {
    render(<SidebarHeader />);
    expect(screen.getByText('AXIOM')).toBeInTheDocument();
  });

  it('should render PLANNER badge', () => {
    render(<SidebarHeader />);
    expect(screen.getByText('PLANNER')).toBeInTheDocument();
  });

  it('should have correct styling classes', () => {
    const { container } = render(<SidebarHeader />);
    const header = container.firstChild as HTMLElement;

    expect(header).toHaveClass('h-20');
    expect(header).toHaveClass('px-6');
    expect(header).toHaveClass('flex');
    expect(header).toHaveClass('items-center');
    expect(header).toHaveClass('justify-between');
  });
});
