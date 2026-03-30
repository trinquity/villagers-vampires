import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
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

  it('shows 6 and 7 in the player dropdown and keeps manual edits after randomizing roles', async () => {
    const randomSpy = vi.spyOn(Math, 'random').mockImplementation(() => 0);
    const user = userEvent.setup();
    render(<App />);

    const playerCountSelect = screen.getByLabelText('Oyuncu Sayısı');
    expect(screen.getByRole('option', { name: '6' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '7' })).toBeInTheDocument();

    await user.selectOptions(playerCountSelect, '6');
    await user.click(screen.getByRole('button', { name: 'Rastgele Dağıt' }));

    const roleSelects = screen.getAllByLabelText('Rol');
    const randomizedRoles = roleSelects.map((select) => (select as HTMLSelectElement).value);
    expect(randomizedRoles.filter((role) => role === 'vampire')).toHaveLength(1);
    expect(randomizedRoles.filter((role) => role === 'cleric')).toHaveLength(1);

    await user.selectOptions(roleSelects[0], 'cleric');
    expect((roleSelects[0] as HTMLSelectElement).value).toBe('cleric');

    randomSpy.mockRestore();
  });
});
