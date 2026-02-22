import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from '@/components/Header';

describe('Header', () => {
  it('renders brand name and subtitle', () => {
    render(<Header language="en" onLanguageChange={() => {}} />);
    expect(screen.getByText('Innocenti & Associates')).toBeInTheDocument();
    expect(screen.getByText('AI Compliance Intelligence')).toBeInTheDocument();
  });

  it('renders language toggle with correct language', () => {
    render(<Header language="de" onLanguageChange={() => {}} />);
    expect(screen.getByText('DE').className).toContain('text-amber-400');
  });

  it('renders EU AI Act button', () => {
    render(<Header language="en" onLanguageChange={() => {}} />);
    expect(screen.getByText('EU AI Act')).toBeInTheDocument();
  });

  it('calls onReset when brand name is clicked', async () => {
    const onReset = vi.fn();
    render(<Header language="en" onLanguageChange={() => {}} onReset={onReset} />);
    await userEvent.click(screen.getByText('Innocenti & Associates'));
    expect(onReset).toHaveBeenCalledOnce();
  });

  it('opens EU AI Act modal when button is clicked', async () => {
    render(<Header language="en" onLanguageChange={() => {}} />);
    await userEvent.click(screen.getByText('EU AI Act'));
    expect(screen.getByText('The EU AI Act')).toBeInTheDocument();
  });

  it('opens Tom modal when logo icon is clicked', async () => {
    render(<Header language="en" onLanguageChange={() => {}} />);
    const scaleButtons = screen.getAllByRole('button');
    const logoButton = scaleButtons[0];
    await userEvent.click(logoButton);
    expect(screen.getByText('Tom Innocenti')).toBeInTheDocument();
  });

  it('passes onLanguageChange to LanguageToggle', async () => {
    const onLanguageChange = vi.fn();
    render(<Header language="en" onLanguageChange={onLanguageChange} />);
    await userEvent.click(screen.getByText('DE'));
    expect(onLanguageChange).toHaveBeenCalledWith('de');
  });
});
