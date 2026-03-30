import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('App locale switching', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('switches the setup screen to English from the top-right selector', async () => {
    const user = userEvent.setup();
    render(<App />);

    const languageSelect = screen.getByLabelText('Dil');
    await user.selectOptions(languageSelect, 'en');

    expect(screen.getByText('Language')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Game Setup' })).toBeInTheDocument();
    expect(
      screen.getByText('Run the night, track the event deck, and keep the table balanced.'),
    ).toBeInTheDocument();
  });
});
