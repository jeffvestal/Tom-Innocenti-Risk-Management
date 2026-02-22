import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TomModal } from '@/components/TomModal';

vi.mock('next/image', () => ({
  default: ({ alt, ...props }: Record<string, unknown>) => (
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    <img alt={alt as string} {...props} />
  ),
}));

describe('TomModal', () => {
  it('renders Tom Innocenti name and title', () => {
    render(<TomModal onClose={() => {}} />);
    expect(screen.getByText('Tom Innocenti')).toBeInTheDocument();
    expect(screen.getByText('Managing Partner')).toBeInTheDocument();
  });

  it('renders the quote', () => {
    render(<TomModal onClose={() => {}} />);
    expect(screen.getByText(/If you don.t sue, shame on you/)).toBeInTheDocument();
  });

  it('renders the profile image', () => {
    render(<TomModal onClose={() => {}} />);
    expect(screen.getByAltText('Tom Innocenti')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    render(<TomModal onClose={onClose} />);
    await userEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose on Escape key', () => {
    const onClose = vi.fn();
    render(<TomModal onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when backdrop is clicked', async () => {
    const onClose = vi.fn();
    const { container } = render(<TomModal onClose={onClose} />);
    const backdrop = container.querySelector('.fixed.inset-0')!;
    await userEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledOnce();
  });
});
