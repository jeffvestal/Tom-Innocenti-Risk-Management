import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeepAnalysisButton } from '@/components/DeepAnalysisButton';

describe('DeepAnalysisButton', () => {
  it('renders "Deep Analysis" label', () => {
    render(<DeepAnalysisButton onClick={() => {}} />);
    expect(screen.getByText('Deep Analysis')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<DeepAnalysisButton onClick={onClick} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('shows "Analyzing..." when isLoading', () => {
    render(<DeepAnalysisButton onClick={() => {}} isLoading />);
    expect(screen.getByText('Analyzing...')).toBeInTheDocument();
    expect(screen.queryByText('Deep Analysis')).toBeNull();
  });

  it('is disabled when isLoading', () => {
    render(<DeepAnalysisButton onClick={() => {}} isLoading />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is disabled when disabled prop is true', () => {
    render(<DeepAnalysisButton onClick={() => {}} disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is enabled by default', () => {
    render(<DeepAnalysisButton onClick={() => {}} />);
    expect(screen.getByRole('button')).not.toBeDisabled();
  });
});
