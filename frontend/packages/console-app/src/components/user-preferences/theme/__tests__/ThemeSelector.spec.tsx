import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useFlag } from '@console/dynamic-plugin-sdk/src/utils/flags';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
import { useUserPreference } from '@console/shared/src/hooks/useUserPreference';
import ThemeSelector from '../ThemeSelector';

jest.mock('@console/dynamic-plugin-sdk/src/utils/flags', () => ({
  useFlag: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useTelemetry', () => ({
  useTelemetry: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useUserPreference', () => ({
  useUserPreference: jest.fn(),
}));

const mockUseFlag = useFlag as jest.Mock;
const mockUseTelemetry = useTelemetry as jest.Mock;
const mockUseUserPreference = useUserPreference as jest.Mock;

const setColorScheme = jest.fn();
const setContrastMode = jest.fn();
const fireTelemetryEvent = jest.fn();

let preferences: Record<string, string | undefined>;
let loadedPreferences: Record<string, boolean>;

const colorSchemes = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'systemDefault', label: 'System default' },
];

const contrastModes = [
  { value: 'default', label: 'Traditional' },
  { value: 'glass', label: 'Glass' },
  { value: 'contrast', label: 'High contrast' },
  { value: 'systemDefault', label: 'System default' },
];

const getGroup = (name: 'Contrast mode' | 'Color scheme') =>
  within(screen.getByRole('dialog', { name: 'Theme' })).getByRole('group', { name });

describe('ThemeSelector', () => {
  beforeEach(() => {
    preferences = {
      'console.theme': 'dark',
      'console.theme/contrast': 'glass',
    };
    loadedPreferences = {
      'console.theme': true,
      'console.theme/contrast': true,
    };
    mockUseFlag.mockReturnValue(true);
    mockUseTelemetry.mockReturnValue(fireTelemetryEvent);
    mockUseUserPreference.mockImplementation((key: string, defaultValue: string) => [
      preferences[key] ?? defaultValue,
      key === 'console.theme' ? setColorScheme : setContrastMode,
      loadedPreferences[key],
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should summarize all 12 OpenShift 5 selection pairs with exact selected labels', () => {
    const [firstContrast, ...remainingContrasts] = contrastModes;
    const [firstColor, ...remainingColors] = colorSchemes;
    preferences['console.theme/contrast'] = firstContrast.value;
    preferences['console.theme'] = firstColor.value;
    const { rerender } = render(<ThemeSelector />);

    const assertSummary = (contrastLabel: string, colorLabel: string) =>
      expect(
        screen.getByRole('button', { name: `Theme: ${contrastLabel} · ${colorLabel}` }),
      ).toHaveTextContent(`${contrastLabel} · ${colorLabel}`);

    assertSummary(firstContrast.label, firstColor.label);
    [firstContrast, ...remainingContrasts].forEach((contrast) => {
      [firstColor, ...remainingColors].forEach((color) => {
        preferences['console.theme/contrast'] = contrast.value;
        preferences['console.theme'] = color.value;
        rerender(<ThemeSelector />);
        assertSummary(contrast.label, color.label);
      });
    });
  });

  it('should use synchronized System defaults and render groups and options in confirmed order', async () => {
    const user = userEvent.setup();
    delete preferences['console.theme'];
    delete preferences['console.theme/contrast'];

    render(<ThemeSelector />);

    expect(mockUseUserPreference).toHaveBeenCalledWith('console.theme', 'systemDefault', true);
    expect(mockUseUserPreference).toHaveBeenCalledWith(
      'console.theme/contrast',
      'systemDefault',
      true,
    );
    const toggle = screen.getByRole('button', {
      name: 'Theme: System default · System default',
    });
    expect(toggle).toHaveAttribute('aria-haspopup', 'dialog');
    expect(toggle).toHaveAttribute('aria-controls', 'console-theme-panel');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);

    const dialog = await screen.findByRole('dialog', { name: 'Theme' });
    expect(
      within(dialog)
        .getAllByRole('heading')
        .map((heading) => heading.textContent),
    ).toEqual(['Contrast mode', 'Color scheme']);
    expect(
      within(getGroup('Contrast mode'))
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(contrastModes.map(({ label }) => label));
    expect(
      within(getGroup('Color scheme'))
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(colorSchemes.map(({ label }) => label));
    expect(
      within(getGroup('Contrast mode')).getByRole('button', { name: 'System default' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      within(getGroup('Color scheme')).getByRole('button', { name: 'System default' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('should support keyboard focus entry, traversal, selection, and Escape focus return', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ThemeSelector />);
    const toggle = screen.getByRole('button', { name: 'Theme: Glass · Dark' });

    await user.tab();
    expect(toggle).toHaveFocus();
    await user.keyboard('{Enter}');

    expect(await screen.findByRole('dialog', { name: 'Theme' })).toBeVisible();
    const traditional = within(getGroup('Contrast mode')).getByRole('button', {
      name: 'Traditional',
    });
    const glass = within(getGroup('Contrast mode')).getByRole('button', { name: 'Glass' });
    const highContrast = within(getGroup('Contrast mode')).getByRole('button', {
      name: 'High contrast',
    });
    await waitFor(() => expect(traditional).toHaveFocus());
    expect(traditional).toHaveAttribute('aria-pressed', 'false');
    expect(glass).toHaveAttribute('aria-pressed', 'true');

    await user.tab();
    expect(glass).toHaveFocus();
    await user.tab();
    expect(highContrast).toHaveFocus();
    await user.keyboard(' ');
    expect(setContrastMode).toHaveBeenCalledWith('contrast');
    preferences['console.theme/contrast'] = 'contrast';
    rerender(<ThemeSelector />);
    expect(highContrast).toHaveAttribute('aria-pressed', 'true');
    expect(glass).toHaveAttribute('aria-pressed', 'false');

    await user.tab();
    await user.tab();
    const light = within(getGroup('Color scheme')).getByRole('button', { name: 'Light' });
    expect(light).toHaveFocus();
    await user.keyboard(' ');
    expect(setColorScheme).toHaveBeenCalledWith('light');
    preferences['console.theme'] = 'light';
    rerender(<ThemeSelector />);
    expect(light).toHaveAttribute('aria-pressed', 'true');
    expect(within(getGroup('Color scheme')).getByRole('button', { name: 'Dark' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Theme' })).not.toBeVisible());
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await waitFor(() => expect(toggle).toHaveFocus());
  });

  it('should close on an outside click without discarding selected values', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ThemeSelector />);
    const toggle = screen.getByRole('button', { name: 'Theme: Glass · Dark' });
    await user.click(toggle);
    await user.click(
      within(getGroup('Contrast mode')).getByRole('button', { name: 'Traditional' }),
    );
    preferences['console.theme/contrast'] = 'default';
    rerender(<ThemeSelector />);

    await user.click(document.body);

    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Theme' })).not.toBeVisible());
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveAccessibleName('Theme: Traditional · Dark');

    await user.click(toggle);
    expect(
      within(getGroup('Contrast mode')).getByRole('button', { name: 'Traditional' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(within(getGroup('Color scheme')).getByRole('button', { name: 'Dark' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('should update and report each underlying preference independently while staying open', async () => {
    const user = userEvent.setup();
    render(<ThemeSelector />);
    await user.click(screen.getByRole('button', { name: 'Theme: Glass · Dark' }));

    await user.click(
      within(getGroup('Contrast mode')).getByRole('button', { name: 'High contrast' }),
    );
    await user.click(within(getGroup('Color scheme')).getByRole('button', { name: 'Light' }));

    expect(setContrastMode).toHaveBeenCalledWith('contrast');
    expect(setColorScheme).toHaveBeenCalledWith('light');
    expect(fireTelemetryEvent).toHaveBeenNthCalledWith(1, 'User Preference Changed', {
      property: 'console.theme/contrast',
      value: 'contrast',
    });
    expect(fireTelemetryEvent).toHaveBeenNthCalledWith(2, 'User Preference Changed', {
      property: 'console.theme',
      value: 'light',
    });
    expect(screen.getByRole('dialog', { name: 'Theme' })).toBeVisible();
  });

  it('should keep all color choices usable and hide contrast outside OpenShift 5', async () => {
    const user = userEvent.setup();
    mockUseFlag.mockReturnValue(false);
    loadedPreferences['console.theme/contrast'] = false;
    preferences['console.theme'] = 'systemDefault';
    const { rerender } = render(<ThemeSelector />);
    const toggle = screen.getByRole('button', { name: 'Theme: System default' });

    await user.click(toggle);
    expect(screen.queryByRole('group', { name: 'Contrast mode' })).not.toBeInTheDocument();
    expect(
      within(getGroup('Color scheme'))
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(colorSchemes.map(({ label }) => label));

    expect(toggle).toHaveAccessibleName('Theme: System default');
    expect(
      within(getGroup('Color scheme')).getByRole('button', { name: 'System default' }),
    ).toHaveAttribute('aria-pressed', 'true');

    await user.click(within(getGroup('Color scheme')).getByRole('button', { name: 'Light' }));
    expect(setColorScheme).toHaveBeenLastCalledWith('light');
    preferences['console.theme'] = 'light';
    rerender(<ThemeSelector />);
    expect(toggle).toHaveAccessibleName('Theme: Light');
    expect(within(getGroup('Color scheme')).getByRole('button', { name: 'Light' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await user.click(within(getGroup('Color scheme')).getByRole('button', { name: 'Dark' }));
    expect(setColorScheme).toHaveBeenLastCalledWith('dark');
    preferences['console.theme'] = 'dark';
    rerender(<ThemeSelector />);
    expect(toggle).toHaveAccessibleName('Theme: Dark');
    expect(within(getGroup('Color scheme')).getByRole('button', { name: 'Dark' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await user.click(
      within(getGroup('Color scheme')).getByRole('button', { name: 'System default' }),
    );
    expect(setColorScheme).toHaveBeenLastCalledWith('systemDefault');
    preferences['console.theme'] = 'systemDefault';
    rerender(<ThemeSelector />);
    expect(toggle).toHaveAccessibleName('Theme: System default');
    expect(
      within(getGroup('Color scheme')).getByRole('button', { name: 'System default' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(setContrastMode).not.toHaveBeenCalled();
  });

  it('should normalize invalid visible preferences without rewriting hidden contrast', () => {
    preferences['console.theme'] = 'invalid-color';
    preferences['console.theme/contrast'] = 'invalid-contrast';
    const { unmount } = render(<ThemeSelector />);

    expect(setColorScheme).toHaveBeenCalledWith('systemDefault');
    expect(setContrastMode).toHaveBeenCalledWith('systemDefault');

    unmount();
    jest.clearAllMocks();
    mockUseFlag.mockReturnValue(false);
    render(<ThemeSelector />);

    expect(setColorScheme).toHaveBeenCalledWith('systemDefault');
    expect(setContrastMode).not.toHaveBeenCalled();
  });

  it('should show a loading skeleton until every visible preference is loaded', () => {
    loadedPreferences['console.theme/contrast'] = false;
    const { rerender } = render(<ThemeSelector />);

    expect(screen.getByTestId('select skeleton console.theme')).toBeVisible();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();

    mockUseFlag.mockReturnValue(false);
    rerender(<ThemeSelector />);
    expect(screen.getByRole('button', { name: 'Theme: Dark' })).toBeVisible();
  });
});
