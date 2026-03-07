import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ToastProvider, useToast } from '../components/ToastContext';

const Demo: React.FC = () => {
  const { showToast } = useToast();
  return <button onClick={() => showToast('hello', 500)}>fire</button>;
};

test('toast appears and disappears after duration', async () => {
  jest.useFakeTimers();
  render(
    <ToastProvider>
      <Demo />
    </ToastProvider>
  );
  expect(screen.queryByText('hello')).not.toBeInTheDocument();
  act(() => {
    screen.getByText('fire').click();
  });
  expect(screen.getByText('hello')).toBeInTheDocument();
  act(() => {
    jest.advanceTimersByTime(600);
  });
  expect(screen.queryByText('hello')).not.toBeInTheDocument();
  jest.useRealTimers();
});