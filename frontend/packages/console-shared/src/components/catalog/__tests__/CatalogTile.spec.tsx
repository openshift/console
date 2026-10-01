import type { ComponentProps } from 'react';
import { screen, within } from '@testing-library/react';
import type { CatalogItem } from '@console/dynamic-plugin-sdk/src/extensions';
import { renderWithProviders } from '../../../test-utils/unit-test-utils';
import { CatalogTile } from '../CatalogTile';

const item: CatalogItem = {
  uid: 'classic-operator-1',
  type: 'operator-olmv0',
  name: 'Test Operator',
  typeLabel: 'Red Hat',
  badges: [
    { text: 'Classic Operator', color: 'grey', placement: 'header' },
    { text: 'Deprecated', color: 'orange' },
    { text: 'Installed', color: 'green', placement: 'footer' },
  ],
};

const renderTile = (props: Partial<ComponentProps<typeof CatalogTile>> = {}) =>
  renderWithProviders(<CatalogTile item={item} catalogTypes={[]} {...props} />);

describe('CatalogTile', () => {
  it('should render the catalog type as a label in the tile header', () => {
    renderTile();

    expect(screen.getByTestId('catalog-type-label')).toHaveTextContent('Red Hat');
  });

  it('should fall back to the catalog type title when the item has no type label', () => {
    renderTile({
      item: { ...item, typeLabel: undefined },
      catalogTypes: [
        { label: 'Classic Operators', value: 'operator-olmv0', description: 'Classic operators' },
      ],
    });

    expect(screen.getByTestId('catalog-type-label')).toHaveTextContent('Classic Operators');
  });

  it('should render header badges below the catalog type label and footer badges separately', () => {
    renderTile();

    const header = within(screen.getByTestId('catalog-header-badges'));
    expect(header.getByTestId('Classic Operator-badge')).toBeVisible();
    expect(header.queryByTestId('Deprecated-badge')).toBeNull();
    expect(header.queryByTestId('Installed-badge')).toBeNull();

    const footer = within(screen.getByTestId('catalog-badges'));
    expect(footer.getByTestId('Deprecated-badge')).toBeVisible();
    expect(footer.getByTestId('Installed-badge')).toBeVisible();
  });

  it('should not render a footer badge group when every badge targets the header', () => {
    renderTile({ item: { ...item, badges: [{ text: 'Next-Gen Operator', placement: 'header' }] } });

    expect(
      within(screen.getByTestId('catalog-header-badges')).getByTestId('Next-Gen Operator-badge'),
    ).toBeVisible();
    expect(screen.queryByTestId('catalog-badges')).toBeNull();
  });
});
