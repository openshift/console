import { render } from '@testing-library/react';
import { useUserPreference } from '@console/shared/src/hooks/useUserPreference';
import { SHOW_LABELS_FILTER_ID } from '../const';
import { FilterContext, FilterProvider } from '../FilterProvider';

jest.mock('@console/shared/src/hooks/useUserPreference', () => ({
  useUserPreference: jest.fn(),
}));

const useUserPreferenceMock = useUserPreference as jest.Mock;

describe('FilterProvider', () => {
  it('seeds the filters from an already-loaded user preference on mount', () => {
    // The preference store lives at the app root, so it is typically already
    // loaded when the topology page (and this provider) mounts - there is no
    // later loaded-transition to trigger the seeding.
    useUserPreferenceMock.mockReturnValue([{ [SHOW_LABELS_FILTER_ID]: false }, jest.fn(), true]);

    let contextFilters;
    render(
      <FilterProvider>
        <FilterContext.Consumer>
          {(ctx) => {
            contextFilters = ctx.filters;
            return null;
          }}
        </FilterContext.Consumer>
      </FilterProvider>,
    );

    // The provider only renders children once the filters are seeded.
    expect(contextFilters).toBeDefined();
    const labelsFilter = contextFilters.find((f) => f.id === SHOW_LABELS_FILTER_ID);
    expect(labelsFilter.value).toBe(false);
  });
});
