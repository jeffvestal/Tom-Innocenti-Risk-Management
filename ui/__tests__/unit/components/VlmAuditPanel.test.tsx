import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VlmAuditPanel } from '@/components/VlmAuditPanel';

describe('VlmAuditPanel', () => {
  const analysisText = 'The architecture diagram shows a data pipeline with ML services.';

  it('renders heading', () => {
    render(<VlmAuditPanel analysis={analysisText} />);
    expect(screen.getByText('VLM Audit Report')).toBeInTheDocument();
  });

  it('starts expanded and shows analysis text', () => {
    render(<VlmAuditPanel analysis={analysisText} />);
    expect(screen.getByText(analysisText)).toBeInTheDocument();
  });

  it('collapses when header is clicked', async () => {
    const user = userEvent.setup();
    render(<VlmAuditPanel analysis={analysisText} />);

    await user.click(screen.getByText('VLM Audit Report'));
    expect(screen.queryByText(analysisText)).toBeNull();
  });

  it('re-expands when header is clicked again', async () => {
    const user = userEvent.setup();
    render(<VlmAuditPanel analysis={analysisText} />);

    await user.click(screen.getByText('VLM Audit Report'));
    expect(screen.queryByText(analysisText)).toBeNull();

    await user.click(screen.getByText('VLM Audit Report'));
    expect(screen.getByText(analysisText)).toBeInTheDocument();
  });
});
