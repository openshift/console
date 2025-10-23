import { screen, act } from '@testing-library/react';
import { UserPreferenceFieldType } from '@console/dynamic-plugin-sdk/src/extensions/user-preferences';
import { useUserSettings } from '@console/shared';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import UserPreferenceCheckboxField from '../UserPreferenceCheckboxField';

jest.mock('@console/shared/src/hooks/useUserSettings', () => ({
  useUserSettings: jest.fn(),
}));

const mockUserSettings = useUserSettings as jest.Mock;

describe('UserPreferenceCheckboxField', () => {
  type UserPreferenceCheckboxFieldProps = React.ComponentProps<typeof UserPreferenceCheckboxField>;
  const props: UserPreferenceCheckboxFieldProps = {
    type: UserPreferenceFieldType.checkbox,
    id: 'id',
    userSettingsKey: '',
    label: 'label',
    trueValue: 'trueValue',
    falseValue: 'falseValue',
  };

  const setupMocks = (
    userPreference: string,
    setValue: jest.Mock = jest.fn(),
    loaded: boolean = true,
  ) => {
    mockUserSettings.mockReturnValue([userPreference, setValue, loaded]);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading state while user preferences are being fetched', async () => {
    setupMocks('', jest.fn(), false);

    await act(async () => {
      renderWithProviders(<UserPreferenceCheckboxField {...props} />);
    });

    expect(screen.getByTestId('dropdown skeleton id')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('should display checkbox when user preferences have loaded', async () => {
    setupMocks('trueValue');

    await act(async () => {
      renderWithProviders(<UserPreferenceCheckboxField {...props} />);
    });

    expect(screen.getByRole('checkbox')).toBeVisible();
  });

  it('should render with isChecked true if defaultValue is equal to trueValue and user preference has loaded but is not defined', async () => {
    const mockSetValue = jest.fn();
    setupMocks('', mockSetValue, true);
    await act(async () => {
      renderWithProviders(<UserPreferenceCheckboxField {...props} defaultValue="trueValue" />);
    });

    expect(mockSetValue).toHaveBeenCalledWith('trueValue');
  });

  it('should render with isChecked true if user preference has loaded and is equal to trueValue', async () => {
    setupMocks('trueValue');
    await act(async () => {
      renderWithProviders(<UserPreferenceCheckboxField {...props} defaultValue="falseValue" />);
    });

    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('should render with isChecked false if user preference has loaded and is equal to falseValue', async () => {
    setupMocks('falseValue');
    await act(async () => {
      renderWithProviders(<UserPreferenceCheckboxField {...props} defaultValue="trueValue" />);
    });

    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });
});
