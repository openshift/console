import * as React from 'react';
import * as _ from 'lodash-es';
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
    expect(tabs.length).toEqual(19); // 'All' through 'Other', plus subcategories
  });

  it('renders category filter controls', () => {
    const filterItems = wrapper.find(FilterSidePanel.CategoryItem);

    expect(filterItems.exists()).toBe(true);
    expect(filterItems.length).toEqual(3); // Filter by Types
    expect(filterItems.at(0).props().count).toBe(11); // total count for ClusterServiceClasses
    expect(filterItems.at(1).props().count).toBe(9); // total count for imagestreams
    expect(filterItems.at(2).props().count).toBe(9); // total count for clusterServiceVersions
  });

  it('renders tiles correctly', () => {
    const tiles = wrapper.find(CatalogTile);

    expect(tiles.exists()).toBe(true);
    expect(tiles.length).toEqual(29);

    const cakeSqlTileProps = tiles.at(2).props();
    expect(cakeSqlTileProps.title).toEqual('CakePHP + MySQL');
    expect(cakeSqlTileProps.iconImg).toEqual('test-file-stub');
    expect(cakeSqlTileProps.iconClass).toBe(null);
    expect(cakeSqlTileProps.vendor).toEqual('provided by Red Hat, Inc.');
    expect(cakeSqlTileProps.description.startsWith('An example CakePHP application with a MySQL database')).toBe(true);

    const wildflyTileProps = tiles.at(28).props();
    expect(wildflyTileProps.title).toEqual('WildFly');
    expect(wildflyTileProps.iconImg).toEqual('test-file-stub');
    expect(wildflyTileProps.iconClass).toBe(null);
    expect(wildflyTileProps.vendor).toEqual(null);
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
