import * as React from 'react';
import { screen, configure } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import UserPreferenceField from '../UserPreferenceField';
import {
  userPreferenceItemWithCheckboxField,
  userPreferenceItemWithCustomComponent,
  userPreferenceItemWithDropdownField,
  userPreferenceItemWithUnknownField,
} from './userPreferences.data';

describe('UserPreferenceField', () => {
  beforeAll(() => {
    configure({ testIdAttribute: 'data-test' });
  });

  it('should render custom component if field type is custom', () => {
    renderWithProviders(<UserPreferenceField item={userPreferenceItemWithCustomComponent} />);
    expect(screen.getByTestId('test custom1 component')).toBeInTheDocument();
  });

  it('should render dropdown field if field type is dropdown', () => {
    renderWithProviders(<UserPreferenceField item={userPreferenceItemWithDropdownField} />);
    expect(screen.getByText('Perspective')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument(); // Dropdown button
  });

  it('should render checkbox field if field type is checkbox', () => {
    renderWithProviders(<UserPreferenceField item={userPreferenceItemWithCheckboxField} />);
    expect(screen.getByText('Date and time selections')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('should render form group with no interactive elements if field type is invalid or unknown', () => {
    renderWithProviders(<UserPreferenceField item={userPreferenceItemWithUnknownField} />);
    expect(screen.getByText('Unknown Input')).toBeInTheDocument();
    // Should not have any interactive elements for unknown field type
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});
