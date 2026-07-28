import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { SearchFilterDropdown } from '@console/internal/components/search-filter-dropdown';

const renderDropdown = () =>
  renderWithProviders(
    <SearchFilterDropdown onChange={jest.fn()} nameFilterInput="" labelFilterInput="" />,
  );

describe('SearchFilterDropdown', () => {
  it('defaults to filtering by Name to stay consistent with other resource lists', () => {
    renderDropdown();
    expect(screen.getByRole('button', { name: /Name/ })).toBeVisible();
  });

  it('allows the user to switch the filter to Label', async () => {
    const user = userEvent.setup();
    renderDropdown();

    await user.click(screen.getByRole('button', { name: /Name/ }));
    await user.click(screen.getByRole('option', { name: /Label/ }));

    expect(screen.getByRole('button', { name: /Label/ })).toBeVisible();
  });
});
