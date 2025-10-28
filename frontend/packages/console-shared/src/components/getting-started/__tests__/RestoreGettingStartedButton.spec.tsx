import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../../test-utils/unit-test-utils';
import { RestoreGettingStartedButton } from '../RestoreGettingStartedButton';
import { useGettingStartedShowState, GettingStartedShowState } from '../useGettingStartedShowState';

jest.mock('../useGettingStartedShowState', () => ({
  ...jest.requireActual('../useGettingStartedShowState'),
  useGettingStartedShowState: jest.fn(),
}));

const useGettingStartedShowStateMock = useGettingStartedShowState as jest.Mock;

describe('RestoreGettingStartedButton', () => {
  it('should render nothing if getting started is shown', () => {
    useGettingStartedShowStateMock.mockReturnValue([GettingStartedShowState.SHOW, jest.fn(), true]);

    const { container } = renderWithProviders(
      <RestoreGettingStartedButton userSettingsKey="test" />,
    );

    expect(container.textContent).toBe('');
  });

  it('should render button if getting started is hidden', () => {
    useGettingStartedShowStateMock.mockReturnValue([GettingStartedShowState.HIDE, jest.fn(), true]);

    renderWithProviders(<RestoreGettingStartedButton userSettingsKey="test" />);

    expect(screen.getByText('Show getting started resources')).toBeVisible();
  });

  it('should change user settings to show if button is pressed', () => {
    const setGettingStartedShowState = jest.fn();
    useGettingStartedShowStateMock.mockReturnValue([
      GettingStartedShowState.HIDE,
      setGettingStartedShowState,
      true,
    ]);

    renderWithProviders(<RestoreGettingStartedButton userSettingsKey="test" />);

    fireEvent.click(screen.getByRole('button', { name: 'Show getting started resources' }));
    expect(setGettingStartedShowState).toHaveBeenCalledTimes(1);
    expect(setGettingStartedShowState).toHaveBeenLastCalledWith(GettingStartedShowState.SHOW);
  });

  it('should change user settings to disappear if close (x) on the button is pressed', () => {
    const setGettingStartedShowState = jest.fn();
    useGettingStartedShowStateMock.mockReturnValue([
      GettingStartedShowState.HIDE,
      setGettingStartedShowState,
      true,
    ]);

    renderWithProviders(<RestoreGettingStartedButton userSettingsKey="test" />);

    fireEvent.click(screen.getByRole('button', { name: 'Close Show getting started resources' }));
    expect(setGettingStartedShowState).toHaveBeenCalledTimes(1);
    expect(setGettingStartedShowState).toHaveBeenLastCalledWith(GettingStartedShowState.DISAPPEAR);
  });

  it('should render nothing if getting started is hidden and the button is disappeared', () => {
    useGettingStartedShowStateMock.mockReturnValue([
      GettingStartedShowState.DISAPPEAR,
      jest.fn(),
      true,
    ]);

    const { container } = renderWithProviders(
      <RestoreGettingStartedButton userSettingsKey="test" />,
    );

    expect(container.textContent).toBe('');
  });
});
