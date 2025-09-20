import * as React from 'react';
import { render, screen, configure } from '@testing-library/react';
import { UserPreferenceFieldType } from '@console/dynamic-plugin-sdk/src/extensions/user-preferences';
import { useUserSettings } from '@console/shared';
import { render } from '@console/shared/src/test-utils/unit-test-utils';
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

  beforeAll(() => {
    configure({ testIdAttribute: 'data-test' });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render skeleton if user preferences have not loaded', () => {
    mockUserSettings.mockReturnValue(['', () => {}, false]);
    render(<UserPreferenceCheckboxField {...props} />);
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('should render checkbox if user preferences have loaded', () => {
    mockUserSettings.mockReturnValue(['trueValue', () => {}, true]);
    render(<UserPreferenceCheckboxField {...props} />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('should render with isChecked true if defaultValue is equal to trueValue and user preference has loaded but is not defined', () => {
    mockUserSettings.mockReturnValue(['', () => {}, true]);
    render(<UserPreferenceCheckboxField {...props} defaultValue="trueValue" />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('should render with isChecked true if user preference has loaded and is equal to trueValue', () => {
    mockUserSettings.mockReturnValue(['trueValue', () => {}, true]);
    render(<UserPreferenceCheckboxField {...props} defaultValue="falseValue" />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('should render with isChecked false if user preference has loaded and is equal to falseValue', () => {
    mockUserSettings.mockReturnValue(['falseValue', () => {}, true]);
    render(<UserPreferenceCheckboxField {...props} defaultValue="trueValue" />);
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });
});
