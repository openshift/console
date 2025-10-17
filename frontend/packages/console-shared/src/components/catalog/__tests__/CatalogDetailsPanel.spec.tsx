import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../test-utils/unit-test-utils';
import CatalogDetailsPanel from '../details/CatalogDetailsPanel';
import { eventSourceCatalogItems } from './catalog-item-data';

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useLocation: () => ({
    pathname: '/test-path',
    search: '',
    hash: '',
    state: null,
  }),
}));

describe('CatalogDetailsPanel', () => {
  const itemWithSupportProperty = eventSourceCatalogItems[1];

  it('should show the correct support level', () => {
    renderWithProviders(<CatalogDetailsPanel item={itemWithSupportProperty} />);

    expect(screen.getByText('Support')).toBeVisible();
    expect(screen.getByText('Community')).toBeVisible();
  });

  it('should show only one "Support" property in the side panel', () => {
    renderWithProviders(<CatalogDetailsPanel item={itemWithSupportProperty} />);

    expect(screen.getAllByText('Support')).toHaveLength(1);
  });
});
