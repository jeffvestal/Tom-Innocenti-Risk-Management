import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from '@/components/SearchBar';

describe('SearchBar', () => {
  it('renders search input with placeholder', () => {
    render(<SearchBar onSearch={() => {}} />);
    expect(screen.getByPlaceholderText('Search the EU AI Act...')).toBeInTheDocument();
  });

  it('renders search button', () => {
    render(<SearchBar onSearch={() => {}} />);
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
  });

  it('calls onSearch with trimmed query on submit', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    const input = screen.getByPlaceholderText('Search the EU AI Act...');
    await user.type(input, '  facial recognition  ');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(onSearch).toHaveBeenCalledWith('facial recognition');
  });

  it('does not call onSearch when query is empty', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('disables input and button when isLoading', () => {
    render(<SearchBar onSearch={() => {}} isLoading />);
    expect(screen.getByPlaceholderText('Search the EU AI Act...')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Searching...' })).toBeDisabled();
  });

  it('shows auditing placeholder when isAuditing', () => {
    render(<SearchBar onSearch={() => {}} isAuditing />);
    expect(screen.getByPlaceholderText('Auditing Architecture Diagram...')).toBeInTheDocument();
  });

  it('renders image upload button when onImageUpload is provided', () => {
    render(<SearchBar onSearch={() => {}} onImageUpload={() => {}} />);
    expect(screen.getByTitle('Upload architecture diagram for VLM audit')).toBeInTheDocument();
  });

  it('does not render image upload button when onImageUpload is not provided', () => {
    render(<SearchBar onSearch={() => {}} />);
    expect(screen.queryByTitle('Upload architecture diagram for VLM audit')).toBeNull();
  });

  it('uses initialQuery as starting value', () => {
    render(<SearchBar onSearch={() => {}} initialQuery="pre-filled" />);
    expect(screen.getByDisplayValue('pre-filled')).toBeInTheDocument();
  });
});
