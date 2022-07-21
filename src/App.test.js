import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(
    /Provide the URL of a JSON endpoint and see what it has to offer/i,
  );
  expect(linkElement).toBeInTheDocument();
});
