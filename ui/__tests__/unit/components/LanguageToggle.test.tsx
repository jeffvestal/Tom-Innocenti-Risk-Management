import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageToggle } from '@/components/LanguageToggle';

describe('LanguageToggle', () => {
  it('renders EN and DE buttons', () => {
    render(<LanguageToggle language="en" onChange={() => {}} />);
    expect(screen.getByText('EN')).toBeInTheDocument();
    expect(screen.getByText('DE')).toBeInTheDocument();
  });

  it('highlights EN when language is en', () => {
    render(<LanguageToggle language="en" onChange={() => {}} />);
    expect(screen.getByText('EN').className).toContain('text-amber-400');
    expect(screen.getByText('DE').className).not.toContain('text-amber-400');
  });

  it('highlights DE when language is de', () => {
    render(<LanguageToggle language="de" onChange={() => {}} />);
    expect(screen.getByText('DE').className).toContain('text-amber-400');
    expect(screen.getByText('EN').className).not.toContain('text-amber-400');
  });

  it('calls onChange with "de" when DE is clicked', async () => {
    const onChange = vi.fn();
    render(<LanguageToggle language="en" onChange={onChange} />);
    await userEvent.click(screen.getByText('DE'));
    expect(onChange).toHaveBeenCalledWith('de');
  });

  it('calls onChange with "en" when EN is clicked', async () => {
    const onChange = vi.fn();
    render(<LanguageToggle language="de" onChange={onChange} />);
    await userEvent.click(screen.getByText('EN'));
    expect(onChange).toHaveBeenCalledWith('en');
  });
});
