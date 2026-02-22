import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EuAiActModal } from '@/components/EuAiActModal';

describe('EuAiActModal', () => {
  it('renders modal title and content sections', () => {
    render(<EuAiActModal onClose={() => {}} />);
    expect(screen.getByText('The EU AI Act')).toBeInTheDocument();
    expect(screen.getByText('What it is')).toBeInTheDocument();
    expect(screen.getByText('Why keyword search fails')).toBeInTheDocument();
    expect(screen.getByText('What this demo solves')).toBeInTheDocument();
  });

  it('renders EUR-Lex link', () => {
    render(<EuAiActModal onClose={() => {}} />);
    const link = screen.getByText('View the full EU AI Act on EUR-Lex');
    expect(link.closest('a')).toHaveAttribute('href', 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32024R1689');
    expect(link.closest('a')).toHaveAttribute('target', '_blank');
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    render(<EuAiActModal onClose={onClose} />);
    await userEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    render(<EuAiActModal onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when backdrop is clicked', async () => {
    const onClose = vi.fn();
    const { container } = render(<EuAiActModal onClose={onClose} />);
    const backdrop = container.querySelector('.fixed.inset-0')!;
    await userEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not call onClose when modal content is clicked', async () => {
    const onClose = vi.fn();
    render(<EuAiActModal onClose={onClose} />);
    await userEvent.click(screen.getByText('The EU AI Act'));
    expect(onClose).not.toHaveBeenCalled();
  });
});
