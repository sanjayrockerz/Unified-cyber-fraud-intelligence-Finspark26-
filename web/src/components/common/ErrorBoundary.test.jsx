import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ErrorBoundary from './ErrorBoundary';

function Bomb({ shouldThrow }) {
  if (shouldThrow) throw new Error('Simulated render crash');
  return <div>safe content</div>;
}

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(<ErrorBoundary><div>safe content</div></ErrorBoundary>);
    expect(screen.getByText('safe content')).toBeInTheDocument();
  });

  it('catches a render error and shows the fallback instead of crashing the tree', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>
    );
    expect(screen.getByText(/unexpected error/i)).toBeInTheDocument();
    expect(screen.queryByText('safe content')).not.toBeInTheDocument();
    spy.mockRestore();
  });

  it('recovers when resetKey changes after an error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { rerender } = render(
      <ErrorBoundary resetKey="a">
        <Bomb shouldThrow />
      </ErrorBoundary>
    );
    expect(screen.getByText(/unexpected error/i)).toBeInTheDocument();

    rerender(
      <ErrorBoundary resetKey="b">
        <Bomb shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText('safe content')).toBeInTheDocument();
    spy.mockRestore();
  });
});
