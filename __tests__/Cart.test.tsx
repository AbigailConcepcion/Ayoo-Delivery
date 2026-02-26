import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { TestingLibraryMatchers } from '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface Matchers<R> extends TestingLibraryMatchers<string, R> {}
  }
}
import Cart from '../screens/Cart';

test('renders Checkout Central header', () => {
  render(<Cart items={[]} onBack={() => {}} onCheckout={() => {}} onUpdateQuantity={() => {}} />);
  expect(screen.getByText(/Checkout Central/i)).toBeInTheDocument();
});
