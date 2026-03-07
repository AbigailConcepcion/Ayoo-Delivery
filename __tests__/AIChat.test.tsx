import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// we don't exercise the real GoogleGenAI library in unit tests; just
// ensure the UI appears and can be opened/closed.
import AIChat from '../components/AIChat';

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class {
    constructor() {}
    getGenerativeModel() {
      return {
        startChat: () => ({
          sendMessage: jest.fn().mockResolvedValue({
            response: {
              text: () => 'Hi there! How can I help?'
            }
          })
        })
      };
    }
  }
}));

// minimal props
const props = {
  restaurants: [],
  onAddToCart: jest.fn(),
  onSelectRestaurant: jest.fn(),
  onNavigate: jest.fn(),
};

test('AIChat toggle button appears and can open/close', async () => {
  render(<AIChat {...props} />);

  const toggle = screen.getByRole('button', { name: /💬|✕/ });
  expect(toggle).toBeInTheDocument();

  // open the chat
  fireEvent.click(toggle);
  expect(screen.getByPlaceholderText(/Ask me anything/i)).toBeInTheDocument();

  // close the chat again
  fireEvent.click(toggle);
  await waitFor(() => {
    expect(screen.queryByPlaceholderText(/Ask me anything/i)).not.toBeInTheDocument();
  });
});
