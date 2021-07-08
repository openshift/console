import * as React from 'react';
import {
  CatalogTile,
  VerticalTabsTab,
  FilterSidePanelCategoryItem,
} from '@patternfly/react-catalog-view-extension';
import { Modal } from '@patternfly/react-core';
import { shallow, mount, ShallowWrapper, ReactWrapper } from 'enzyme';
import * as _ from 'lodash';
import { MemoryRouter } from 'react-router-dom';
import {
  operatorHubListPageProps,
  operatorHubTileViewPageProps,
  operatorHubTileViewPagePropsWithDummy,
  mockFilterStrings,
  mockProviderStrings,
  operatorHubDetailsProps,
  itemWithLongDescription,
  filterCounts,
} from '../../../mocks';
import { MarkdownView } from '../clusterserviceversion';
import { OperatorHubItemDetails, OperatorHubItemDetailsProps } from './operator-hub-item-details';
import {
  OperatorHubTileView,
  getProviderValue,
  keywordCompare,
  OperatorHubTileViewProps,
} from './operator-hub-items';
import { OperatorHubList, OperatorHubListProps } from './operator-hub-page';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

xdescribe('[https://issues.redhat.com/browse/CONSOLE-2136] OperatorHubList', () => {
  let wrapper: ReactWrapper<OperatorHubListProps>;

  beforeEach(() => {
    wrapper = mount(
      <MemoryRouter>
        <OperatorHubList
          {...operatorHubListPageProps}
          marketplacePackageManifest={null}
          subscription={{ loaded: false, data: [] }}
        />
      </MemoryRouter>,
    );
  });

  it('renders the correct number of tiles from props', () => {
    const tiles = wrapper.find(CatalogTile);

    expect(tiles.length).toEqual(5);
  });

  it('renders amq-streams tile with correct props', () => {
    const tiles = wrapper.find<any>(CatalogTile);
    const amqTileProps = tiles.at(0).props();
    const amqPackageManifest = operatorHubListPageProps.packageManifest.data[0];

    expect(amqTileProps.title).toEqual(
      amqPackageManifest.status.channels[0].currentCSVDesc.displayName,
    );
    expect(amqTileProps.iconImg).toEqual(
      '/api/kubernetes/apis/packages.operators.coreos.com/v1/namespaces/openshift-operator-lifecycle-manager/packagemanifests/amq-streams/icon?resourceVersion=amq-streams.preview.amqstreams.v1.0.0.beta',
    );
    expect(amqTileProps.iconClass).toBe(null);
    expect(amqTileProps.vendor).toEqual(
      `provided by ${amqPackageManifest.metadata.labels.provider}`,
    );
    expect(
      amqTileProps.description.startsWith(
        '**Red Hat AMQ Streams** is a massively scalable, distributed, and high performance data streaming platform based on the Apache Kafka project.',
      ),
    ).toBe(true);
  });

  it('renders prometheus tile with correct props', () => {
    const tiles = wrapper.find<any>(CatalogTile);
    const prometheusTileProps = tiles.at(3).props(); // Sorting makes this 3
    const prometheusPackageManifest = operatorHubListPageProps.packageManifest.data[3];

    expect(prometheusTileProps.title).toEqual(
      prometheusPackageManifest.status.channels[0].currentCSVDesc.displayName,
    );
    expect(prometheusTileProps.iconImg).toEqual(
      '/api/kubernetes/apis/packages.operators.coreos.com/v1/namespaces/openshift-operator-lifecycle-manager/packagemanifests/prometheus/icon?resourceVersion=prometheus.preview.prometheusoperator.0.22.2',
    );
    expect(prometheusTileProps.iconClass).toBe(null);
    expect(prometheusTileProps.vendor).toEqual(
      `provided by ${prometheusPackageManifest.metadata.labels.provider}`,
    );
    expect(
      prometheusTileProps.description.startsWith(
        'The Prometheus Operator for Kubernetes provides easy monitoring definitions for Kubernetes services and deployment and management of Prometheus instances.',
      ),
    ).toBe(true);
  });

  it('renders modal correctly on tile click', () => {
    const tiles = wrapper.find(CatalogTile);
    tiles.at(0).simulate('click');
    const details = wrapper.find(OperatorHubItemDetails);

    expect(details.exists()).toBe(true);

    const modalItem = details.at(0).props().item;
    const amqPackageManifest = operatorHubListPageProps.packageManifest.data[0];

    expect(modalItem.name).toEqual(
      amqPackageManifest.status.channels[0].currentCSVDesc.displayName,
    );
    expect(modalItem.imgUrl).toEqual(
      '/api/kubernetes/apis/packages.operators.coreos.com/v1/namespaces/openshift-operator-lifecycle-manager/packagemanifests/amq-streams/icon?resourceVersion=amq-streams.preview.amqstreams.v1.0.0.beta',
    );
    expect(modalItem.provider).toEqual(amqPackageManifest.metadata.labels.provider);
    expect(
      modalItem.description.startsWith(
        '**Red Hat AMQ Streams** is a massively scalable, distributed, and high performance data streaming platform based on the Apache Kafka project.',
      ),
    ).toBe(true);

    const closeButton = details.find(Modal).find('button');
    closeButton.simulate('click');
    const noShowDetails = wrapper.find(OperatorHubItemDetails);

    expect(noShowDetails.exists()).toBe(false);
  });
});

xdescribe(`[https://issues.redhat.com/browse/CONSOLE-2136] ${OperatorHubTileView.displayName}`, () => {
  let wrapper: ReactWrapper<OperatorHubTileViewProps>;

  beforeEach(() => {
    wrapper = mount(<OperatorHubTileView {...operatorHubTileViewPageProps} />);
  });

  it('renders item filter controls', () => {
    const filterItems = wrapper.find<any>(FilterSidePanelCategoryItem);

    expect(filterItems.length).toBe(4); // Filter by Provider and Install State
    filterItems.forEach((filter) => {
      expect(filter.props().count).toBe(filterCounts[_.split(filter.childAt(0).text(), '(')[0]]);
    });
  });

  it('updates filter counts on item changes', () => {
    wrapper.setProps(operatorHubTileViewPagePropsWithDummy);
    wrapper.update();
    const filterItemsChanged = wrapper.find(FilterSidePanelCategoryItem);

    expect(filterItemsChanged.exists()).toBe(true);
    expect(filterItemsChanged.length).toEqual(5); // Filter by Provider and Install State

    wrapper.setProps(operatorHubTileViewPageProps);
    wrapper.update();
    const filterItemsFinal = wrapper.find(FilterSidePanelCategoryItem);

    expect(filterItemsFinal.exists()).toBe(true);
    expect(filterItemsFinal.length).toEqual(4); // Filter by Provider and Install State
  });

  it('renders category tabs', () => {
    const categories = wrapper.find(VerticalTabsTab);

    expect(categories.exists()).toBe(true);
    expect(categories.length).toBe(8);
  });

  it('filters items by keyword correctly', () => {
    _.each(mockFilterStrings, (filterTest) => {
      const { filter, resultLength } = filterTest;
      const results = _.reduce(
        operatorHubTileViewPageProps.items,
        (matches, item) => {
          if (keywordCompare(filter, item)) {
            matches.push(item);
          }
          return matches;
        },
        [],
      );

      expect(results.length).toBe(resultLength);
    });
  });

  it("removes 'Inc' and 'LLC' from provider names", () => {
    _.each(mockProviderStrings, (providerTest) => {
      const { provider, output } = providerTest;
      const result = getProviderValue(provider);

      expect(result).toEqual(output);
    });
  });

  // TODO: Test category functionality
});

describe(OperatorHubItemDetails.displayName, () => {
  let wrapper: ShallowWrapper<OperatorHubItemDetailsProps>;

  beforeEach(() => {
    wrapper = shallow(<OperatorHubItemDetails {...operatorHubDetailsProps} />);
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
