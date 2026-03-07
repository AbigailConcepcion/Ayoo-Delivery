import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import userEvent from '@testing-library/user-event';
import OrderTracking from '../screens/OrderTracking';
import { ToastProvider } from '../components/ToastContext';
import { ayooCloud } from '../api';
import { db } from '../db';

jest.mock('../api');
jest.mock('../db');

describe('OrderTracking screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows cancel button for pending order and cancels it', async () => {
    const sampleOrder = {
      id: 'o1',
      status: 'PENDING',
      items: [{ id: 'i1', quantity: 1 }],
      customerEmail: 'test@example.com',
      restaurantName: 'Test',
      total: 100,
      date: '',
      paymentMethod: 'COD',
      customerName: 'Test',
      deliveryAddress: 'Addr',
      pointsEarned: 0,
      isPaid: 0,
    };
    (db.getAllLiveOrders as jest.Mock).mockResolvedValue([sampleOrder]);
    (ayooCloud.getLiveOrder as jest.Mock).mockResolvedValue(null);
    const cloudSpy = jest.spyOn(ayooCloud, 'updateOrderStatus').mockResolvedValue();
    const dbSpy = jest.spyOn(db, 'updateOrderStatus').mockResolvedValue();

    render(
      <ToastProvider>
        <OrderTracking onBack={() => {}} restaurant={null} deliveryCity="City" customerEmail="test@example.com" />
      </ToastProvider>
    );

    await waitFor(() => expect(screen.getByText(/Live Tracking/i)).toBeDefined());
    const cancelBtn = screen.getByText('❌');
    userEvent.click(cancelBtn);

    await waitFor(() => expect(cloudSpy).toHaveBeenCalledWith('o1', 'CANCELLED'));
    expect(dbSpy).toHaveBeenCalledWith('o1', 'CANCELLED');
    // toast appears
    expect(screen.getByText(/Order cancelled/i)).toBeDefined();
    // ETA card updates as well
    await waitFor(() => expect(screen.getByText(/Order Cancelled/i)).toBeDefined());
  });

  it('shows reorder button for delivered order and triggers handler', async () => {
    const delivered = {
      id: 'o2',
      status: 'DELIVERED',
      items: [{ id: 'i2', quantity: 2 }],
      customerEmail: 'test@example.com',
      restaurantName: 'Test',
      total: 200,
      date: '',
      paymentMethod: 'COD',
      customerName: 'Test',
      deliveryAddress: 'Addr',
      pointsEarned: 0,
      isPaid: 1,
    };
    (db.getAllLiveOrders as jest.Mock).mockResolvedValue([delivered]);
    (ayooCloud.getLiveOrder as jest.Mock).mockResolvedValue(null);
    const reorderFn = jest.fn();

    render(
      <ToastProvider>
        <OrderTracking
          onBack={() => {}}
          restaurant={null}
          deliveryCity="City"
          customerEmail="test@example.com"
          onReorder={reorderFn}
        />
      </ToastProvider>
    );

    await waitFor(() => expect(screen.getByText(/Arrived!/i)).toBeDefined());
    const reorderBtn = screen.getByText('↻');
    userEvent.click(reorderBtn);
    expect(reorderFn).toHaveBeenCalledWith([{ id: 'i2', quantity: 2 }]);
  });
});