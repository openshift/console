import { screen, act } from '@testing-library/react';
import { UserPreferenceFieldType } from '@console/dynamic-plugin-sdk/src/extensions/user-preferences';
import { useUserSettings } from '@console/shared';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import UserPreferenceDropdownField from '../UserPreferenceDropdownField';

jest.mock('@console/shared', () => ({
  ...jest.requireActual('@console/shared'),
  useUserSettings: jest.fn(),
  useTelemetry: jest.fn(() => jest.fn()),
}));

const mockUserSettings = useUserSettings as jest.Mock;

describe('UserPreferenceDropdownField', () => {
  type UserPreferenceDropdownFieldProps = React.ComponentProps<typeof UserPreferenceDropdownField>;
  const baseProps: UserPreferenceDropdownFieldProps = {
    type: UserPreferenceFieldType.dropdown as const,
    id: 'test-dropdown-field',
    userSettingsKey: 'test.setting.key',
    options: [
      { value: 'option1', label: 'Option 1' },
      { value: '#LATEST#', label: 'Last viewed' },
    ],
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
      renderWithProviders(<UserPreferenceDropdownField {...baseProps} />);
    });

    expect(screen.getByTestId('select skeleton test-dropdown-field')).toBeVisible();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should display selected option when user preference is loaded', async () => {
    setupMocks('option1');

    await act(async () => {
      renderWithProviders(<UserPreferenceDropdownField {...baseProps} />);
    });

    expect(screen.getByRole('button')).toBeVisible();
    expect(screen.getByText('Option 1')).toBeVisible();
  });

  it('should apply default value when user preference is empty', async () => {
    const mockSetValue = jest.fn();
    setupMocks('', mockSetValue, true);

    await act(async () => {
      renderWithProviders(<UserPreferenceDropdownField {...baseProps} defaultValue="#LATEST#" />);
    });

    expect(screen.getByRole('button')).toBeVisible();
    expect(mockSetValue).toHaveBeenCalledWith('#LATEST#');
  });

  it('should render description when provided', async () => {
    setupMocks('option1');
    const testDescription = 'This is a test description for the dropdown';

    await act(async () => {
      renderWithProviders(
        <UserPreferenceDropdownField {...baseProps} description={testDescription} />,
      );
    });

    expect(screen.getByText(testDescription)).toBeVisible();
  });

  it('should display placeholder text when no option is selected', async () => {
    setupMocks('');

    await act(async () => {
      renderWithProviders(<UserPreferenceDropdownField {...baseProps} />);
    });

    expect(screen.getByText('Select an option')).toBeVisible();
  });
});
