import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

Element.prototype.scrollTo = vi.fn();

vi.stubGlobal('fetch', vi.fn());
