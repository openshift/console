import { screen } from '@testing-library/react';
import { UserPreferenceFieldType } from '@console/dynamic-plugin-sdk/src/extensions/user-preferences';
import { useUserPreference } from '@console/shared/src/hooks/useUserPreference';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import UserPreferenceCheckboxField from '../UserPreferenceCheckboxField';

jest.mock('@console/shared/src/hooks/useUserPreference', () => ({
  useUserPreference: jest.fn(),
}));

const mockUserPreference = useUserPreference as jest.Mock;

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
    mockUserPreference.mockReturnValue([userPreference, setValue, loaded]);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading state while user preferences are being fetched', () => {
    setupMocks('', jest.fn(), false);

    renderWithProviders(<UserPreferenceCheckboxField {...props} />);

    expect(screen.getByTestId('dropdown skeleton id')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('should display checkbox when user preferences have loaded', () => {
    setupMocks('trueValue');

    renderWithProviders(<UserPreferenceCheckboxField {...props} />);

    expect(screen.getByRole('checkbox')).toBeVisible();
  });

  it('should render with isChecked true if defaultValue is equal to trueValue and user preference has loaded but is not defined', () => {
    const mockSetValue = jest.fn();
    setupMocks('', mockSetValue, true);
    renderWithProviders(<UserPreferenceCheckboxField {...props} defaultValue="trueValue" />);

    expect(mockSetValue).toHaveBeenCalledWith('trueValue');

    // When user preference is explicitly undefined (not just falsy), defaultValue should be set
    setupMocks(undefined, mockSetValue, true);
    renderWithProviders(<UserPreferenceCheckboxField {...props} defaultValue="trueValue" />);

    expect(mockSetValue).toHaveBeenCalledWith('trueValue');
  });

  it('should NOT override falsy user preference values with defaultValue (bug fix)', () => {
    const mockSetValue = jest.fn();

    // Test with boolean false as the current value
    const booleanProps = {
      ...props,
      trueValue: true,
      falseValue: false,
    };

    // Current user preference is `false` (falsy), but it's a valid preference
    // The old code using `!currentUserPreferenceValue` would incorrectly treat this as "not set"
    // and override it with the defaultValue
    mockUserPreference.mockReturnValue([false, mockSetValue, true]);

    renderWithProviders(<UserPreferenceCheckboxField {...booleanProps} defaultValue />);

    // The bug fix ensures that `false` is NOT replaced with the defaultValue
    expect(mockSetValue).not.toHaveBeenCalled();
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('should render with isChecked true if user preference has loaded and is equal to trueValue', () => {
    setupMocks('trueValue');
    renderWithProviders(<UserPreferenceCheckboxField {...props} defaultValue="falseValue" />);

    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('should render with isChecked false if user preference has loaded and is equal to falseValue', () => {
    setupMocks('falseValue');
    renderWithProviders(<UserPreferenceCheckboxField {...props} defaultValue="trueValue" />);

    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });
});
