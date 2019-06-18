import * as React from 'react';
import * as _ from 'lodash';
import { mount } from 'enzyme';

import {CatalogTile} from '../../node_modules/patternfly-react-extensions/dist/js/components/CatalogTile';
import {VerticalTabsTab} from '../../node_modules/patternfly-react-extensions/dist/js/components/VerticalTabs';
import {FilterSidePanel} from '../../node_modules/patternfly-react-extensions/dist/js/components/FilterSidePanel';

import { CatalogListPage } from '../../public/components/catalog/catalog-page';
import { CatalogTileViewPage, catalogCategories as initCatalogCategories } from '../../public/components/catalog/catalog-items';
import { catalogListPageProps, catalogItems, catalogCategories} from '../../__mocks__/catalogItemsMocks';
import { categorizeItems } from '../../public/components/utils/tile-view-page';

describe(CatalogTileViewPage.displayName, () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(<CatalogListPage {...catalogListPageProps} />);
  });

  it('renders main and sub category tabs', () => {
    const tabs = wrapper.find(VerticalTabsTab);

    expect(tabs.exists()).toBe(true);
    expect(tabs.length).toEqual(20); // 'All' through 'Other', plus subcategories
  });

  it('renders category filter controls', () => {
    const filterItems = wrapper.find(FilterSidePanel.CategoryItem);

    expect(filterItems.exists()).toBe(true);
    expect(filterItems.length).toEqual(4); // Filter by Types
    expect(filterItems.at(0).props().count).toBe(11); // total count for clusterServiceClasses
    expect(filterItems.at(1).props().count).toBe(2); // total count for templates
    expect(filterItems.at(2).props().count).toBe(9); // total count for imagestreams
    expect(filterItems.at(3).props().count).toBe(9); // total count for clusterServiceVersions
  });

  it('renders tiles correctly', () => {
    const tiles = wrapper.find(CatalogTile);

    expect(tiles.exists()).toBe(true);
    expect(tiles.length).toEqual(31);

    const cakeSqlTileProps = tiles.at(2).props();
    expect(cakeSqlTileProps.title).toEqual('CakePHP + MySQL');
    expect(cakeSqlTileProps.iconImg).toEqual('test-file-stub');
    expect(cakeSqlTileProps.iconClass).toBe(null);
    expect(cakeSqlTileProps.vendor).toEqual('provided by Red Hat, Inc.');
    expect(cakeSqlTileProps.description.startsWith('An example CakePHP application with a MySQL database')).toBe(true);

    const amqTileProps = tiles.at(23).props();
    expect(amqTileProps.title).toEqual('Red Hat JBoss A-MQ 6.3 (Ephemeral, no SSL)');
    expect(amqTileProps.iconImg).toEqual('test-file-stub');
    expect(amqTileProps.iconClass).toBe(null);
    expect(amqTileProps.vendor).toEqual('provided by Red Hat, Inc.');
    expect(amqTileProps.description.startsWith('Application template for JBoss A-MQ brokers. These can be deployed as standalone or in a mesh. This template doesn\'t feature SSL support.')).toBe(true);

    const wildflyTileProps = tiles.at(30).props();
    expect(wildflyTileProps.title).toEqual('WildFly');
    expect(wildflyTileProps.iconImg).toEqual('test-file-stub');
    expect(wildflyTileProps.iconClass).toBe(null);
    expect(wildflyTileProps.vendor).toEqual('provided by Red Hat, Inc.');
    expect(wildflyTileProps.description.startsWith('Build and run WildFly 10.1 applications on CentOS 7. For more information about using this builder image')).toBe(true);
  });

  it('categorizes catalog items', () => {
    const categories = categorizeItems(catalogItems, itemsToSort => _.sortBy(itemsToSort, 'tileName'), initCatalogCategories);
    expect(_.keys(categories).length).toEqual(_.keys(catalogCategories).length);
    _.each(_.keys(categories), key => {
      const category = categories[key];
      expect(category.numItems).toEqual(catalogCategories[key].numItems);
      if (category.subcategories) {
        expect(category.subcategories.length).toEqual(catalogCategories[key].subcategories.length);
      }
      _.each(_.keys(category.subcategories), subKey => {
        const subcategory = category.subcategories[subKey];
        expect(subcategory.numItems).toEqual(catalogCategories[key].subcategories[subKey].numItems);
      });
    });
  });
});
