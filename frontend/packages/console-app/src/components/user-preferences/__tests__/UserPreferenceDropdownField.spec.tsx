import * as React from 'react';
import { render, screen, configure } from '@testing-library/react';
import { UserPreferenceFieldType } from '@console/dynamic-plugin-sdk/src/extensions/user-preferences';
import { useUserSettings } from '@console/shared';
import { render } from '@console/shared/src/test-utils/unit-test-utils';
import UserPreferenceDropdownField from '../UserPreferenceDropdownField';

jest.mock('@console/shared/src/hooks/useUserSettings', () => ({
  useUserSettings: jest.fn(),
}));

const mockUserSettings = useUserSettings as jest.Mock;

describe('UserPreferenceDropdownField', () => {
  type UserPreferenceDropdownFieldProps = React.ComponentProps<typeof UserPreferenceDropdownField>;
  const props: UserPreferenceDropdownFieldProps = {
    type: UserPreferenceFieldType.dropdown,
    id: 'id',
    userSettingsKey: '',
    options: [
      { value: 'value', label: 'label' },
      { value: '#LATEST#', label: 'Last viewed' },
    ],
  };

  beforeAll(() => {
    configure({ testIdAttribute: 'data-test' });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render skeleton if user preference have not loaded', () => {
    mockUserSettings.mockReturnValue(['', () => {}, false]);
    render(<UserPreferenceDropdownField {...props} />);
    expect(screen.getByTestId('select skeleton id')).toBeInTheDocument();
  });

  it('should render select with selected value corresponding to user preference if it has loaded and is defined', () => {
    mockUserSettings.mockReturnValue(['value', () => {}, true]);
    render(<UserPreferenceDropdownField {...props} />);
    expect(screen.getByTestId('select id')).toBeInTheDocument();
    expect(screen.getByDisplayValue('label')).toBeInTheDocument();
  });

  it('should render select with selected value corresponding to defaultValue if user preference has loaded and is undefined', () => {
    mockUserSettings.mockReturnValue(['', () => {}, true]);
    render(<UserPreferenceDropdownField {...props} defaultValue="#LATEST#" />);
    expect(screen.getByTestId('select id')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Last viewed')).toBeInTheDocument();
  });
});
