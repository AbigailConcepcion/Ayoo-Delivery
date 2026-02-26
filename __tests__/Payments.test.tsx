import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import type {} from '@testing-library/jest-dom';
import Payments from '../screens/Payments';

jest.mock('../db', () => ({ db: { getPayments: jest.fn().mockResolvedValue([]) } }));

test('renders Ayoo Wallet header', () => {
  render(<Payments onBack={() => {}} email="test@example.com" />);
  expect(screen.getByText(/Ayoo Wallet/i)).toBeInTheDocument();
});
