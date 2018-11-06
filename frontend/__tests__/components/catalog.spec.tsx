import * as React from 'react';
import * as _ from 'lodash-es';
import { mount } from 'enzyme';

import {CatalogTileView} from '../../node_modules/patternfly-react-extensions/dist/js/components/CatalogTileView';
import {CatalogTile} from '../../node_modules/patternfly-react-extensions/dist/js/components/CatalogTile';
import {VerticalTabsTab} from '../../node_modules/patternfly-react-extensions/dist/js/components/VerticalTabs';
import {FilterSidePanel} from '../../node_modules/patternfly-react-extensions/dist/js/components/FilterSidePanel';

import { CatalogListPage } from '../../public/components/catalog/catalog-page';
import { CatalogTileViewPage } from '../../public/components/catalog/catalog-items';
import { catalogListPageProps, catalogItems, catalogCategories} from '../../__mocks__/catalogItemsMocks';
import { categorizeItems } from '../../public/components/utils/categorize-catalog-items';

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
    expect(filterItems.length).toEqual(2); // Filter by Types
    expect(filterItems.at(0).props().count).toBe(11); // total count for ClusterServiceClasses
    expect(filterItems.at(1).props().count).toBe(9); // total count for ClusterServiceClasses
  });

  it('renders sub category headings above tiles', () => {
    const categoryHeaders = wrapper.find(CatalogTileView.Category);

    expect(categoryHeaders.exists()).toBe(true);
    expect(categoryHeaders.length).toEqual(5); // Languages, Databases, etc..

    expect(categoryHeaders.at(0).props().totalItems).toBe(12); // Languages 'View All' count
  });

  it('renders tiles correctly', () => {
    const tiles = wrapper.find(CatalogTile);

    expect(tiles.exists()).toBe(true);
    expect(tiles.length).toEqual(20);

    const cakeSqlTileProps = tiles.at(1).props();
    expect(cakeSqlTileProps.title).toEqual('CakePHP + MySQL');
    expect(cakeSqlTileProps.iconImg).toEqual('test-file-stub');
    expect(cakeSqlTileProps.iconClass).toBe(null);
    expect(cakeSqlTileProps.vendor).toEqual('Provided by Red Hat, Inc.');
    expect(cakeSqlTileProps.description.startsWith('An example CakePHP application with a MySQL database')).toBe(true);

    const wildflyTileProps = tiles.at(19).props();
    expect(wildflyTileProps.title).toEqual('Nginx HTTP server and a reverse proxy (nginx)');
    expect(wildflyTileProps.iconImg).toEqual('test-file-stub');
    expect(wildflyTileProps.iconClass).toBe(null);
    expect(wildflyTileProps.vendor).toEqual(null);
    expect(wildflyTileProps.description.startsWith('Build and serve static content via Nginx HTTP Server and a reverse proxy (nginx)')).toBe(true);
  });

  it('categorizes catalog items', () => {
    const categories = categorizeItems(catalogItems);
    expect(categories.length).toEqual(catalogCategories.length);
    _.each(categories, (category, i) => {
      expect(category.numItems).toEqual(catalogCategories[i].numItems);
      if (category.subcategories) {
        expect(category.subcategories.length).toEqual(catalogCategories[i].subcategories.length);
      }
      _.each(category.subcategories, (subcategory, s) => {
        expect(subcategory.numItems).toEqual(catalogCategories[i].subcategories[s].numItems);
      });
    });
  });
});
