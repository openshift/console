import type { ComponentProps } from 'react';
import { screen, within } from '@testing-library/react';
import type { CatalogItem } from '@console/dynamic-plugin-sdk/src/extensions';
import { renderWithProviders } from '../../../test-utils/unit-test-utils';
import { CatalogTile } from '../CatalogTile';

const item: CatalogItem = {
  uid: 'example-operator-1',
  type: 'operator',
  name: 'Test Operator',
  typeLabel: 'Red Hat',
  badges: [
    { text: 'Custom badge', color: 'blue' },
    { text: 'Deprecated', color: 'orange' },
    { text: 'Installed', color: 'green' },
  ],
};

const renderTile = (props: Partial<ComponentProps<typeof CatalogTile>> = {}) =>
  renderWithProviders(<CatalogTile item={item} catalogTypes={[]} {...props} />);

describe('CatalogTile', () => {
  it('should render the catalog type as a badge in the tile header', () => {
    renderTile();

    expect(screen.getByText('Red Hat')).toBeVisible();
  });

  it('should fall back to the catalog type title when the item has no type label', () => {
    renderTile({
      item: { ...item, typeLabel: undefined },
      catalogTypes: [{ label: 'Operators', value: 'operator', description: 'Operators' }],
    });

    expect(screen.getByText('Operators')).toBeVisible();
  });

  it('should render custom and status badges together in the footer', () => {
    renderTile();

    const footer = within(screen.getByTestId('catalog-badges'));
    expect(footer.getByText('Custom badge')).toBeVisible();
    expect(footer.getByText('Deprecated')).toBeVisible();
    expect(footer.getByText('Installed')).toBeVisible();
    expect(footer.queryByText('Red Hat')).not.toBeInTheDocument();
  });

  it('should render the custom badge in the footer', () => {
    renderTile({ item: { ...item, badges: [{ text: 'Example badge', color: 'purple' }] } });

    expect(within(screen.getByTestId('catalog-badges')).getByText('Example badge')).toBeVisible();
  });

  it('should omit the footer badge group when the item has no badges', () => {
    renderTile({ item: { ...item, badges: [] } });

    expect(screen.queryByTestId('catalog-badges')).not.toBeInTheDocument();
  });
});
