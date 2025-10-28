import { screen } from '@testing-library/react';
import { mockFormikRenderer } from '../../../test-utils/unit-test-utils';
import ItemSelectorField from '../item-selector-field/ItemSelectorField';

describe('ItemSelectorField', () => {
  it('should not render if showIfSingle is false and list contains single item', () => {
    const list = { ListItem: { name: 'ItemName', title: 'ItemName', iconUrl: 'DisplayIcon' } };
    mockFormikRenderer(<ItemSelectorField name="test" itemList={list} />, { test: '' });

    expect(screen.queryByText('ItemName')).not.toBeInTheDocument();
  });

  it('should display empty state if list is empty and filter is shown', () => {
    const list = {};
    mockFormikRenderer(<ItemSelectorField name="test" itemList={list} showFilter />, { test: '' });

    expect(screen.getByText('No results match the filter criteria')).toBeVisible();
  });

  it('should render items when list has multiple items', () => {
    const list = {
      item1: { name: 'item1', title: 'Item 1', iconUrl: 'icon1' },
      item2: { name: 'item2', title: 'Item 2', iconUrl: 'icon2' },
    };
    mockFormikRenderer(<ItemSelectorField name="test" itemList={list} />, { test: '' });

    expect(screen.getByText('Item 1')).toBeVisible();
    expect(screen.getByText('Item 2')).toBeVisible();
  });
});
