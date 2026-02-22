import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VlmWarmupModal } from '@/components/VlmWarmupModal';

describe('VlmWarmupModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <VlmWarmupModal isOpen={false} attempt={1} maxAttempts={5} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders heading and description when open', () => {
    render(<VlmWarmupModal isOpen={true} attempt={1} maxAttempts={5} />);

    expect(screen.getByText('VLM Service Waking Up')).toBeInTheDocument();
    expect(
      screen.getByText(/Vision AI model goes to sleep/i),
    ).toBeInTheDocument();
  });

  it('displays the current attempt and max attempts', () => {
    render(<VlmWarmupModal isOpen={true} attempt={3} maxAttempts={5} />);

    expect(screen.getByText(/attempt 3 of 5/)).toBeInTheDocument();
  });

  it('updates progress bar width based on attempt', () => {
    const { container } = render(
      <VlmWarmupModal isOpen={true} attempt={2} maxAttempts={5} />,
    );

    const bar = container.querySelector('[style*="width"]');
    expect(bar).toBeTruthy();
    expect(bar!.getAttribute('style')).toContain('40%');
  });

  it('has no close or dismiss button', () => {
    render(<VlmWarmupModal isOpen={true} attempt={1} maxAttempts={5} />);

    expect(screen.queryByRole('button')).toBeNull();
  });
});
