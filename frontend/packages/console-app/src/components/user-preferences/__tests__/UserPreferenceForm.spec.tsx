import * as React from 'react';
import { screen, configure } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import UserPreferenceForm from '../UserPreferenceForm';
import { mockUserPreferenceItems } from './userPreferences.data';

describe('UserPreferenceForm', () => {
  beforeAll(() => {
    configure({ testIdAttribute: 'data-test' });
  });

  it('should return null if items array is empty', () => {
    const { container } = renderWithProviders(<UserPreferenceForm items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('should return Form with UserPreferenceFields if items array is not empty', () => {
    renderWithProviders(<UserPreferenceForm items={mockUserPreferenceItems} />);
    expect(screen.getByRole('form')).toBeInTheDocument();
    // Check that preference items are rendered based on their labels from mock data
    expect(screen.getByText('Project')).toBeInTheDocument();
    expect(screen.getByText('Perspective')).toBeInTheDocument();
  });
});
