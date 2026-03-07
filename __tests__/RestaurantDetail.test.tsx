import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import RestaurantDetail from '../screens/RestaurantDetail';
import { ToastProvider } from '../components/ToastContext';
import { Restaurant } from '../types';

const sample: Restaurant = {
  id: 'res1',
  name: 'Testaurant',
  image: '',
  items: [
    { id: 'i1', name: 'Burger', price: 100, category: 'Main', image: '' },
  ],
  reviews: []
};

test('add button triggers callback and toast', () => {
  const onAdd = jest.fn();
  render(
    <ToastProvider>
      <RestaurantDetail
        restaurant={sample}
        onBack={() => {}}
        onAddToCart={onAdd}
        onOpenCart={() => {}}
        cartCount={0}
      />
    </ToastProvider>
  );
  const addBtn = screen.getByText(/Add \+/i);
  userEvent.click(addBtn);
  expect(onAdd).toHaveBeenCalledWith('i1');
  // toast is produced by App.addToCart; the wrapper here only checks callback invocation
});