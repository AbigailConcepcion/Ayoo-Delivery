import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { TestingLibraryMatchers } from '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface Matchers<R> extends TestingLibraryMatchers<string, R> {}
  }
}
import Cart from '../screens/Cart';
import { ToastProvider } from '../components/ToastContext';
import userEvent from '@testing-library/user-event';

test('renders Checkout Central header', () => {
  render(
    <ToastProvider>
      <Cart items={[]} onBack={() => {}} onCheckout={() => {}} onUpdateQuantity={() => {}} />
    </ToastProvider>
  );
  expect(screen.getByText(/Checkout Central/i)).toBeDefined();
});

test('quantity buttons call update callback', () => {
  const updateFn = jest.fn();
  render(
    <ToastProvider>
      <Cart
        items={[{ id: 'item1', quantity: 1 }]}
        onBack={() => {}}
        onCheckout={() => {}}
        onUpdateQuantity={updateFn}
      />
    </ToastProvider>
  );
  const plus = screen.getByText('+');
  const minus = screen.getByText('-');
  userEvent.click(plus);
  expect(updateFn).toHaveBeenCalledWith('item1', 1);
  userEvent.click(minus);
  expect(updateFn).toHaveBeenCalledWith('item1', -1);
});
