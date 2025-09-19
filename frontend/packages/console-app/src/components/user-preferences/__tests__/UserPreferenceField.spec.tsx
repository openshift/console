import { screen, configure, act } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import UserPreferenceField from '../UserPreferenceField';
import {
  userPreferenceItemWithCheckboxField,
  userPreferenceItemWithCustomComponent,
  userPreferenceItemWithDropdownField,
  userPreferenceItemWithUnknownField,
} from './userPreferences.data';

jest.mock('../UserPreferenceDropdownField', () => ({
  default: () => null,
}));

jest.mock('../UserPreferenceCheckboxField', () => ({
  default: () => null,
}));

jest.mock('../UserPreferenceCustomField', () => ({
  default: ({ component, props: componentProps }) => (component ? component(componentProps) : null),
}));

describe('UserPreferenceField', () => {
  beforeAll(() => {
    configure({ testIdAttribute: 'data-test' });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render custom component if field type is custom', async () => {
    await act(async () => {
      renderWithProviders(<UserPreferenceField item={userPreferenceItemWithCustomComponent} />);
    });

    expect(screen.getByTestId('test custom1 component')).toBeInTheDocument();
  });

  it('should render dropdown field if field type is dropdown', async () => {
    await act(async () => {
      renderWithProviders(<UserPreferenceField item={userPreferenceItemWithDropdownField} />);
    });

    expect(screen.getByText('Perspective')).toBeVisible();
  });

  it('should render checkbox field if field type is checkbox', async () => {
    await act(async () => {
      renderWithProviders(<UserPreferenceField item={userPreferenceItemWithCheckboxField} />);
    });

    expect(screen.getByText('Date and time selections')).toBeVisible();
  });

  it('should render form group with no interactive elements if field type is invalid or unknown', async () => {
    await act(async () => {
      renderWithProviders(<UserPreferenceField item={userPreferenceItemWithUnknownField} />);
    });

    expect(screen.getByText('Unknown Input')).toBeVisible();
  });
});
