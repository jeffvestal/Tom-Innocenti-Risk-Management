import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImageUploadModal } from '@/components/ImageUploadModal';

const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal('fetch', mockFetch);
});

describe('ImageUploadModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onFile: vi.fn(),
  };

  beforeEach(() => {
    defaultProps.onClose.mockClear();
    defaultProps.onFile.mockClear();
  });

  it('renders nothing when isOpen is false', () => {
    render(<ImageUploadModal isOpen={false} onClose={() => {}} onFile={() => {}} />);
    expect(screen.queryByText('Upload Architecture Diagram')).toBeNull();
  });

  it('renders heading and two option cards when open', () => {
    render(<ImageUploadModal {...defaultProps} />);
    expect(screen.getByText('Upload Architecture Diagram')).toBeInTheDocument();
    expect(screen.getByText('Upload File')).toBeInTheDocument();
    expect(screen.getByText('Example Diagram')).toBeInTheDocument();
  });

  it('renders the example thumbnail image', () => {
    render(<ImageUploadModal {...defaultProps} />);
    const img = screen.getByAltText('Example architecture diagram');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/example-architecture.png');
  });

  it('closes on Escape key', async () => {
    const user = userEvent.setup();
    render(<ImageUploadModal {...defaultProps} />);

    await user.keyboard('{Escape}');
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on backdrop click', async () => {
    const user = userEvent.setup();
    render(<ImageUploadModal {...defaultProps} />);

    const backdrop = screen.getByText('Upload Architecture Diagram').closest('.fixed');
    if (backdrop) await user.click(backdrop);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('closes on close button click', async () => {
    const user = userEvent.setup();
    render(<ImageUploadModal {...defaultProps} />);

    await user.click(screen.getByLabelText('Close'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('triggers file input when "Upload File" is clicked', async () => {
    const user = userEvent.setup();
    render(<ImageUploadModal {...defaultProps} />);

    const file = new File(['test'], 'diagram.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText('Upload architecture diagram');

    await user.upload(fileInput, file);

    expect(defaultProps.onFile).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'diagram.png', type: 'image/png' })
    );
  });

  it('fetches example image and calls onFile when "Example Diagram" is clicked', async () => {
    const user = userEvent.setup();
    const fakeBlob = new Blob(['fake-png'], { type: 'image/png' });
    mockFetch.mockResolvedValue({ blob: () => Promise.resolve(fakeBlob) });

    render(<ImageUploadModal {...defaultProps} />);

    await user.click(screen.getByTestId('load-example-btn'));

    expect(mockFetch).toHaveBeenCalledWith('/example-architecture.png');
    expect(defaultProps.onFile).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'example-architecture.png', type: 'image/png' })
    );
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
