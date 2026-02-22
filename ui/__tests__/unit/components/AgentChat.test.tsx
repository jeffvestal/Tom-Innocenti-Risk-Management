import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AgentChat } from '@/components/AgentChat';

vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <div data-testid="markdown">{children}</div>,
}));

const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal('fetch', mockFetch);
});

describe('AgentChat', () => {
  describe('empty state', () => {
    it('shows advisor title in English', () => {
      render(<AgentChat language="en" />);
      expect(screen.getByText('EU AI Act Compliance Advisor')).toBeInTheDocument();
    });

    it('shows advisor title in German', () => {
      render(<AgentChat language="de" />);
      expect(screen.getByText('EU-KI-Gesetz Compliance-Berater')).toBeInTheDocument();
    });

    it('renders English suggestion pills', () => {
      render(<AgentChat language="en" />);
      expect(screen.getByText('What are the prohibited AI practices?')).toBeInTheDocument();
      expect(screen.getByText('Explain high-risk AI system requirements')).toBeInTheDocument();
      expect(screen.getByText('What penalties does the Act impose?')).toBeInTheDocument();
    });

    it('renders German suggestion pills', () => {
      render(<AgentChat language="de" />);
      expect(screen.getByText('Welche KI-Praktiken sind verboten?')).toBeInTheDocument();
      expect(screen.getByText('Welche Anforderungen gelten für Hochrisiko-KI-Systeme?')).toBeInTheDocument();
      expect(screen.getByText('Welche Strafen sieht das Gesetz vor?')).toBeInTheDocument();
    });

    it('German suggestions have English tooltips', () => {
      render(<AgentChat language="de" />);
      const btn = screen.getByText('Welche KI-Praktiken sind verboten?');
      expect(btn).toHaveAttribute('title', 'What are the prohibited AI practices?');
    });

    it('English suggestions do not have tooltips', () => {
      render(<AgentChat language="en" />);
      const btn = screen.getByText('What are the prohibited AI practices?');
      expect(btn).not.toHaveAttribute('title');
    });
  });

  describe('input area', () => {
    it('renders text input with EN placeholder', () => {
      render(<AgentChat language="en" />);
      expect(screen.getByPlaceholderText('Ask about the EU AI Act...')).toBeInTheDocument();
    });

    it('renders text input with DE placeholder', () => {
      render(<AgentChat language="de" />);
      expect(screen.getByPlaceholderText('Frage zum EU-KI-Gesetz...')).toBeInTheDocument();
    });

    it('renders image upload button', () => {
      render(<AgentChat language="en" />);
      expect(screen.getByTitle('Upload architecture diagram for VLM analysis')).toBeInTheDocument();
    });

    it('opens image upload modal when image button is clicked', async () => {
      const user = userEvent.setup();
      render(<AgentChat language="en" />);

      await user.click(screen.getByTitle('Upload architecture diagram for VLM analysis'));

      expect(screen.getByText('Upload Architecture Diagram')).toBeInTheDocument();
      expect(screen.getByText('Upload File')).toBeInTheDocument();
      expect(screen.getByText('Example Diagram')).toBeInTheDocument();
    });

    it('submit button is disabled when input is empty', () => {
      render(<AgentChat language="en" />);
      const submitButton = screen.getByRole('button', { name: '' });
      const submitButtons = screen.getAllByRole('button');
      const lastButton = submitButtons[submitButtons.length - 1];
      expect(lastButton).toBeDisabled();
    });
  });

  describe('suggestion interaction', () => {
    it('populates input when suggestion is clicked', async () => {
      const user = userEvent.setup();
      render(<AgentChat language="en" />);

      await user.click(screen.getByText('What are the prohibited AI practices?'));

      const input = screen.getByPlaceholderText('Ask about the EU AI Act...');
      expect(input).toHaveValue('What are the prohibited AI practices?');
    });
  });

  describe('file upload', () => {
    it('shows image preview when file is selected via modal', async () => {
      const user = userEvent.setup();
      render(<AgentChat language="en" />);

      global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/fake-url');

      await user.click(screen.getByTitle('Upload architecture diagram for VLM analysis'));
      expect(screen.getByText('Upload Architecture Diagram')).toBeInTheDocument();

      const file = new File(['fake-image'], 'diagram.png', { type: 'image/png' });
      const fileInput = screen.getByLabelText('Upload architecture diagram');
      await user.upload(fileInput, file);

      expect(screen.getByAltText('Selected diagram')).toBeInTheDocument();
      expect(screen.getByText('Architecture diagram attached')).toBeInTheDocument();
    });

    it('shows image preview when example is loaded via modal', async () => {
      const user = userEvent.setup();
      const fakeBlob = new Blob(['fake-png'], { type: 'image/png' });
      mockFetch.mockResolvedValue({ blob: () => Promise.resolve(fakeBlob) });

      global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/fake-url');

      render(<AgentChat language="en" />);

      await user.click(screen.getByTitle('Upload architecture diagram for VLM analysis'));
      await user.click(screen.getByTestId('load-example-btn'));

      expect(screen.getByAltText('Selected diagram')).toBeInTheDocument();
      expect(screen.getByText('Architecture diagram attached')).toBeInTheDocument();
    });

    it('shows image-attached suggestions when image is selected', async () => {
      const user = userEvent.setup();
      render(<AgentChat language="en" />);

      global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/fake-url');

      await user.click(screen.getByTitle('Upload architecture diagram for VLM analysis'));

      const file = new File(['fake-image'], 'diagram.png', { type: 'image/png' });
      const fileInput = screen.getByLabelText('Upload architecture diagram');
      await user.upload(fileInput, file);

      expect(screen.getByText('Are there any prohibited AI practices in this architecture?')).toBeInTheDocument();
      expect(screen.getByText('What high-risk AI requirements apply to this system?')).toBeInTheDocument();
    });
  });

  describe('message sending', () => {
    it('sends message and shows user bubble', async () => {
      const user = userEvent.setup();

      const encoder = new TextEncoder();
      const body = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode('event: message_chunk\ndata: {"data":{"text_chunk":"Hello"}}\n\n'));
          controller.close();
        },
      });
      mockFetch.mockResolvedValue({ ok: true, body });

      render(<AgentChat language="en" />);

      const input = screen.getByPlaceholderText('Ask about the EU AI Act...');
      await user.type(input, 'What is Article 5?');
      await user.click(screen.getAllByRole('button').pop()!);

      expect(screen.getByText('What is Article 5?')).toBeInTheDocument();
    });
  });
});
