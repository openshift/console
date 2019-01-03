import * as React from 'react';
import { mount } from 'enzyme';
import * as _ from 'lodash-es';
import { CatalogTile, FilterSidePanel, VerticalTabs } from 'patternfly-react-extensions';
import { Modal } from 'patternfly-react';

import { MarkdownView } from '../../../public/components/operator-lifecycle-manager/clusterserviceversion';
import { OperatorHubTileView, getProviderValue, keywordCompare } from '../../../public/components/operator-hub/operator-hub-items';
import { OperatorHubItemModal } from '../../../public/components/operator-hub/operator-hub-item-modal';
import { OperatorHubList } from '../../../public/components/operator-hub/operator-hub-page';
import {
  operatorHubListPageProps,
  operatorHubTileViewPageProps,
  operatorHubTileViewPagePropsWithDummy,
  mockFilterStrings,
  mockProviderStrings,
  operatorHubModalProps,
  itemWithLongDescription,
  filterCounts,
} from '../../../__mocks__/operatorHubItemsMocks';

describe(OperatorHubList.displayName, () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(<OperatorHubList {...operatorHubListPageProps} subscription={{loaded: false, data: []}} />);
  });

  it('renders the correct number of tiles from props', () => {
    const tiles = wrapper.find(CatalogTile);
    expect(tiles.exists()).toBe(true);
    expect(tiles.length).toEqual(5);
  });

  it('renders amq-streams tile with correct props', () => {
    const tiles = wrapper.find(CatalogTile);
    expect(tiles.exists()).toBe(true);

    const amqTileProps = tiles.at(0).props();
    const amqPackageManifest = operatorHubListPageProps.packageManifest.data[0];
    const amqIcon = (amqPackageManifest.status.channels[0].currentCSVDesc as any).icon[0];
    expect(amqTileProps.title).toEqual(amqPackageManifest.metadata.name);
    expect(amqTileProps.iconImg).toEqual(`data:${amqIcon.mediatype};base64,${amqIcon.base64data}`);
    expect(amqTileProps.iconClass).toBe(null);
    expect(amqTileProps.vendor).toEqual(`provided by ${amqPackageManifest.metadata.labels.provider}`);
    expect(amqTileProps.description.startsWith('**Red Hat AMQ Streams** is a massively scalable, distributed, and high performance data streaming platform based on the Apache Kafka project.')).toBe(true);
  });

  it('renders prometheus tile with correct props', () => {
    const tiles = wrapper.find(CatalogTile);
    expect(tiles.exists()).toBe(true);

    const prometheusTileProps = tiles.at(3).props();
    const prometheusPackageManifest = operatorHubListPageProps.packageManifest.data[3];
    const prometheusIcon = (prometheusPackageManifest.status.channels[0].currentCSVDesc as any).icon[0];
    expect(prometheusTileProps.title).toEqual(prometheusPackageManifest.metadata.name);
    expect(prometheusTileProps.iconImg).toEqual(`data:${prometheusIcon.mediatype};base64,${prometheusIcon.base64data}`);
    expect(prometheusTileProps.iconClass).toBe(null);
    expect(prometheusTileProps.vendor).toEqual(`provided by ${prometheusPackageManifest.metadata.labels.provider}`);
    expect(prometheusTileProps.description.startsWith('The Prometheus Operator for Kubernetes provides easy monitoring definitions for Kubernetes services and deployment and management of Prometheus instances.')).toBe(true);
  });

  it('renders modal correctly on tile click', () => {
    const tiles = wrapper.find(CatalogTile);
    expect(tiles.exists()).toBe(true);

    tiles.at(0).simulate('click');
    const modal = wrapper.find(OperatorHubItemModal);
    expect(modal.exists()).toBe(true);
    expect(modal.props().show).toBe(true);

    const modalItem = modal.at(0).props().item;
    const amqPackageManifest = operatorHubListPageProps.packageManifest.data[0];
    const amqIcon = (amqPackageManifest.status.channels[0].currentCSVDesc as any).icon[0];
    expect(modalItem.name).toEqual(amqPackageManifest.metadata.name);
    expect(modalItem.imgUrl).toEqual(`data:${amqIcon.mediatype};base64,${amqIcon.base64data}`);
    expect(modalItem.iconClass).toBe(null);
    expect(modalItem.provider).toEqual(amqPackageManifest.metadata.labels.provider);
    expect(modalItem.description.startsWith('**Red Hat AMQ Streams** is a massively scalable, distributed, and high performance data streaming platform based on the Apache Kafka project.')).toBe(true);

    const closeButton = modal.find(Modal.CloseButton);
    closeButton.simulate('click');
    const noShowModal = wrapper.find(OperatorHubItemModal);
    expect(noShowModal.exists()).toBe(true);
    expect(noShowModal.props().show).toBe(false);
  });

});

describe(OperatorHubTileView.displayName, () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(<OperatorHubTileView.WrappedComponent {...operatorHubTileViewPageProps} />);
  });

  it('renders item filter controls', () => {
    const filterItems = wrapper.find(FilterSidePanel.CategoryItem);
    expect(filterItems.exists()).toBe(true);

    expect(filterItems.length).toBe(2); // Filter by Provider
    filterItems.forEach((filter) => {
      expect(filter.props().count).toBe(filterCounts[_.split(filter.childAt(0).text(), '(')[0]]);
    });
  });

  it('updates filter counts on item changes', () => {
    wrapper.setProps(operatorHubTileViewPagePropsWithDummy);
    wrapper.update();
    const filterItemsChanged = wrapper.find(FilterSidePanel.CategoryItem);
    expect(filterItemsChanged.exists()).toBe(true);

    expect(filterItemsChanged.length).toEqual(3); // Filter by Provider

    wrapper.setProps(operatorHubTileViewPageProps);
    wrapper.update();
    const filterItemsFinal = wrapper.find(FilterSidePanel.CategoryItem);
    expect(filterItemsFinal.exists()).toBe(true);

    expect(filterItemsFinal.length).toEqual(2); // Filter by Provider
  });

  it('renders category tabs', () => {
    const categories = wrapper.find(VerticalTabs.Tab);
    expect(categories.exists()).toBe(true);
    expect(categories.length).toBe(8);
  });

  it('filters items by keyword correctly', () => {
    _.each(mockFilterStrings, filterTest => {
      const {filter, resultLength} = filterTest;
      const results = _.reduce(operatorHubTileViewPageProps.items, (matches, item) => {
        if (keywordCompare(filter, item)) {
          matches.push(item);
        }
        return matches;
      }, []);
      expect(results.length).toBe(resultLength);
    });
  });

  it('removes \'Inc\' and \'LLC\' from provider names', () => {
    _.each(mockProviderStrings, providerTest => {
      const {provider, output} = providerTest;
      const result = getProviderValue(provider);
      expect(result).toEqual(output);
    });
  });

  // TODO: Test category functionality

});

describe(OperatorHubItemModal.displayName, () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(<OperatorHubItemModal {...operatorHubModalProps} />);
  });

  it('renders longDescription with a MarkdownView component', () => {
    const noMarkdown = wrapper.find(MarkdownView);
    expect(noMarkdown.exists()).toBe(false);

    wrapper.setProps({ item: itemWithLongDescription });
    wrapper.update();

    const markdown = wrapper.find(MarkdownView);
    expect(markdown.exists()).toBe(true);
  });

});
