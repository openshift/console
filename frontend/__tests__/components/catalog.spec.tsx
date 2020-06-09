import * as React from 'react';
import * as _ from 'lodash-es';
import { mount, ReactWrapper } from 'enzyme';
import { Provider } from 'react-redux';

import {
  CatalogTile,
  FilterSidePanelCategoryItem,
  VerticalTabsTab,
} from '@patternfly/react-catalog-view-extension';

import store from '@console/internal/redux';
import {
  CatalogListPage,
  CatalogListPageProps,
  CatalogListPageState,
} from '../../public/components/catalog/catalog-page';
import {
  catalogCategories as initCatalogCategories,
  groupItems,
  CatalogTileViewPage,
} from '../../public/components/catalog/catalog-items';
import {
  catalogListPageProps,
  catalogItems,
  catalogCategories,
} from '../../__mocks__/catalogItemsMocks';
import { developerCatalogItems, groupedByOperator } from './catalog-data';
import { categorizeItems } from '../../public/components/utils/tile-view-page';
import { Dropdown } from '../../public/components/utils';

describe(CatalogTileViewPage.displayName, () => {
  let wrapper: ReactWrapper<CatalogListPageProps, CatalogListPageState>;

  beforeEach(() => {
    wrapper = mount(<CatalogListPage {...catalogListPageProps} />, {
      wrappingComponent: ({ children }) => <Provider store={store}>{children}</Provider>,
    });
  });

  it('renders main and sub category tabs', () => {
    const tabs = wrapper.find(VerticalTabsTab);

    expect(tabs.exists()).toBe(true);
    expect(tabs.length).toEqual(20); // 'All' through 'Other', plus subcategories
  });

  it('renders category filter controls', () => {
    const filterItems = wrapper.find<any>(FilterSidePanelCategoryItem);
    expect(filterItems.exists()).toBe(true);
    expect(filterItems.length).toEqual(5); // Filter by Types
    expect(filterItems.at(0).props().count).toBe(0); // total count for Operator Backed
    expect(filterItems.at(0).props().checked).toBe(true); // Check operator backed filter is true by default
    expect(filterItems.at(1).props().count).toBe(2); // total count for Helm Charts
    expect(filterItems.at(1).props().checked).toBe(false); // Check Helm Charts filter is true by default
    expect(filterItems.at(2).props().count).toBe(9); // total count for templates
    expect(filterItems.at(2).props().checked).toBe(false); // filter templates should be false by default
    expect(filterItems.at(3).props().count).toBe(2); // total count for imagestreams
    expect(filterItems.at(3).props().checked).toBe(false); // filter imagestreams should be false by default
    expect(filterItems.at(4).props().count).toBe(12); // total count for clusterServiceClasses
    expect(filterItems.at(4).props().checked).toBe(false); // filter clusterServiceClasses should be false by default
  });

  it('renders tiles correctly', () => {
    // De-activating all filters to render all tiles
    const filterItems = wrapper.find<any>(FilterSidePanelCategoryItem);
    filterItems.forEach((filter) => {
      filter.find('input').simulate('click', { target: { checked: false } });
    });

    const tiles = wrapper.find<any>(CatalogTile);

    expect(tiles.exists()).toBe(true);
    expect(tiles.length).toEqual(25);

    const cakeSqlTileProps = tiles.at(2).props();
    expect(cakeSqlTileProps.title).toEqual('CakePHP + MySQL');
    expect(cakeSqlTileProps.iconImg).toEqual('test-file-stub');
    expect(cakeSqlTileProps.iconClass).toBe(null);
    expect(cakeSqlTileProps.vendor).toEqual('provided by Red Hat, Inc.');
    expect(
      cakeSqlTileProps.description.startsWith(
        'An example CakePHP application with a MySQL database',
      ),
    ).toBe(true);

    const amqTileProps = tiles.at(22).props();
    expect(amqTileProps.title).toEqual('Red Hat JBoss A-MQ 6.3 (Ephemeral, no SSL)');
    expect(amqTileProps.iconImg).toEqual('test-file-stub');
    expect(amqTileProps.iconClass).toBe(null);
    expect(amqTileProps.vendor).toEqual('provided by Red Hat, Inc.');
    expect(
      amqTileProps.description.startsWith(
        "Application template for JBoss A-MQ brokers. These can be deployed as standalone or in a mesh. This template doesn't feature SSL support.",
      ),
    ).toBe(true);

    const wildflyTileProps = tiles.at(24).props();
    expect(wildflyTileProps.title).toEqual('WildFly');
    expect(wildflyTileProps.iconImg).toEqual('test-file-stub');
    expect(wildflyTileProps.iconClass).toBe(null);
    expect(wildflyTileProps.vendor).toEqual('provided by Red Hat, Inc.');
    expect(
      wildflyTileProps.description.startsWith(
        'Build and run WildFly 10.1 applications on CentOS 7. For more information about using this builder image',
      ),
    ).toBe(true);

    const faIconTileProps = tiles.at(5).props();
    expect(faIconTileProps.title).toEqual('FA icon example');
    expect(faIconTileProps.iconImg).toBe(null);
    expect(faIconTileProps.iconClass).toBe('fa fa-fill-drip');
    expect(faIconTileProps.vendor).toEqual('provided by Red Hat, Inc.');
    expect(faIconTileProps.description).toEqual('Example to validate icon');
  });

  it('categorizes catalog items', () => {
    const categories = categorizeItems(
      catalogItems,
      (itemsToSort) => _.sortBy(itemsToSort, 'tileName'),
      initCatalogCategories,
    );
    expect(_.keys(categories).length).toEqual(_.keys(catalogCategories).length);
    _.each(_.keys(categories), (key) => {
      const category = categories[key];
      expect(category.numItems).toEqual(catalogCategories[key].numItems);
      if (category.subcategories) {
        expect(category.subcategories.length).toEqual(catalogCategories[key].subcategories.length);
      }
      _.each(_.keys(category.subcategories), (subKey) => {
        const subcategory = category.subcategories[subKey];
        expect(subcategory.numItems).toEqual(catalogCategories[key].subcategories[subKey].numItems);
      });
    });
  });

  it('should render the group-by dropdown', () => {
    expect(wrapper.find(Dropdown).exists()).toBe(true);
    expect(wrapper.find(Dropdown).props().titlePrefix).toBe('Group By');
    expect(wrapper.find(Dropdown).props().items).toEqual({ Operator: 'Operator', None: 'None' });
  });

  it('should group catalog items by Operator', () => {
    const groupedByOperatorResult = groupItems(developerCatalogItems, 'Operator');
    expect(groupedByOperatorResult).toEqual(groupedByOperator);
  });

  it('should not group the items when None is selected in the Group By Dropdown', () => {
    const groupedByTypeResult = groupItems(developerCatalogItems, 'None');
    expect(groupedByTypeResult).toEqual(developerCatalogItems);
  });
});
