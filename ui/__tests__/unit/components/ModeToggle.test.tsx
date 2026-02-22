import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModeToggle } from '@/components/ModeToggle';

describe('ModeToggle', () => {
  it('renders Search and Agent buttons', () => {
    render(<ModeToggle mode="search" onChange={() => {}} />);
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Agent')).toBeInTheDocument();
  });

  it('highlights Search when mode is search', () => {
    render(<ModeToggle mode="search" onChange={() => {}} />);
    expect(screen.getByText('Search').closest('button')!.className).toContain('text-amber-300');
  });

  it('highlights Agent when mode is agent', () => {
    render(<ModeToggle mode="agent" onChange={() => {}} />);
    expect(screen.getByText('Agent').closest('button')!.className).toContain('text-amber-300');
  });

  it('calls onChange with "agent" when Agent is clicked', async () => {
    const onChange = vi.fn();
    render(<ModeToggle mode="search" onChange={onChange} />);
    await userEvent.click(screen.getByText('Agent'));
    expect(onChange).toHaveBeenCalledWith('agent');
  });

  it('calls onChange with "search" when Search is clicked', async () => {
    const onChange = vi.fn();
    render(<ModeToggle mode="agent" onChange={onChange} />);
    await userEvent.click(screen.getByText('Search'));
    expect(onChange).toHaveBeenCalledWith('search');
  });
});
