import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ToastProvider } from '../components/ToastContext';
import RiderDashboard from '../screens/RiderDashboard';

// quick smoke test, just ensure major UI elements render

test('shows Rider Log header', () => {
  render(
    <ToastProvider>
      <RiderDashboard />
    </ToastProvider>
  );
  expect(screen.getByText(/Rider Log/i)).toBeDefined();
});
