import { screen, act } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import UserPreferenceForm from '../UserPreferenceForm';
import { mockUserPreferenceItems } from './userPreferences.data';

describe('UserPreferenceForm', () => {
  it('should not render form when items array is empty', () => {
    renderWithProviders(<UserPreferenceForm items={[]} />);

    expect(screen.queryByRole('form')).not.toBeInTheDocument();
  });

  it('should render form with preference fields when items are provided', async () => {
    await act(async () => {
      renderWithProviders(<UserPreferenceForm items={mockUserPreferenceItems} />);
    });

    expect(screen.getByRole('form')).toBeInTheDocument();
    expect(screen.getByText('Project')).toBeVisible();
    expect(screen.getByText('Perspective')).toBeVisible();
  });
});
