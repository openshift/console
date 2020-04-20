import * as React from 'react';
import * as _ from 'lodash-es';
import { Link } from 'react-router-dom';
import * as catalogImg from '../../imgs/logos/catalog-icon.svg';
import { Badge, Modal } from '@patternfly/react-core';
import {
  CatalogItemHeader,
  CatalogTile,
  CatalogTileBadge,
} from '@patternfly/react-catalog-view-extension';

import { DEV_CATALOG_FILTER_KEY as filterKey } from '@console/shared';
import { history } from '../utils/router';
import { normalizeIconClass } from './catalog-item-icon';
import { CatalogTileDetails } from './catalog-item-details';
import { TileViewPage } from '../utils/tile-view-page';

type Metadata = { uid?: string; name: string; namespace?: string };

export type Item = {
  obj?: {
    metadata?: Metadata;
    csv?: { kind?: string; spec: { displayName: string }; metadata?: Metadata };
  };
  createLabel: string;
  href: string;
  kind?: string;
  tileName?: string;
  tileImgUrl?: string;
  tileIconClass?: string;
  tileProvider?: string;
  tileDescription?: string;
  tags?: string[];
  documentationUrl?: string | undefined;
};

export type CatalogTileViewPageProps = {
  items: Item[];
};
export type CatalogTileViewPageState = {
  detailsItem: Item;
};

export type FilterItem = {
  label: string;
  value: string;
  active: boolean;
};

type TypeFilters = {
  ClusterServiceVersion: FilterItem;
  HelmChart: FilterItem;
  ImageStream: FilterItem;
  Template: FilterItem;
  ClusterServiceClass: FilterItem;
};

type CapabilityFilters = {
  BasicInstall: FilterItem;
  SeamlessUpgrades: FilterItem;
  FullLifecycle: FilterItem;
  DeepInsights: FilterItem;
  AutoPilot: FilterItem;
};

type PageFilters = {
  kind: TypeFilters;
  capabilityLevel: CapabilityFilters;
};

export const catalogCategories: Record<
  string,
  Record<string, string | Record<string, string | Record<string, any>>>
> = {
  languages: {
    id: 'languages',
    label: 'Languages',
    field: 'tags',
    subcategories: {
      java: { id: 'java', label: 'Java', values: ['java'] },
      javascript: {
        id: 'javascript',
        label: 'JavaScript',
        field: 'tags',
        values: ['javascript', 'nodejs', 'js'],
      },
      dotnet: { id: 'dotnet', label: '.NET', field: 'tags', values: ['dotnet'] },
      perl: { id: 'perl', label: 'Perl', field: 'tags', values: ['perl'] },
      ruby: { id: 'ruby', label: 'Ruby', field: 'tags', values: ['ruby'] },
      php: { id: 'php', label: 'PHP', field: 'tags', values: ['php'] },
      python: { id: 'python', label: 'Python', field: 'tags', values: ['python'] },
      golang: { id: 'golang', label: 'Go', field: 'tags', values: ['golang', 'go'] },
    },
  },
  databases: {
    id: 'databases',
    label: 'Databases',
    field: 'tags',
    subcategories: {
      mongodb: { id: 'mongodb', label: 'Mongo', field: 'tags', values: ['mongodb'] },
      mysql: { id: 'mysql', label: 'MySQL', field: 'tags', values: ['mysql'] },
      postgresql: { id: 'postgresql', label: 'Postgres', field: 'tags', values: ['postgresql'] },
      mariadb: { id: 'mariadb', label: 'MariaDB', field: 'tags', values: ['mariadb'] },
    },
  },
  middleware: {
    id: 'middleware',
    label: 'Middleware',
    field: 'tags',
    subcategories: {
      integration: {
        id: 'integration',
        label: 'Integration',
        field: 'tags',
        values: ['amq', 'fuse', 'jboss-fuse', 'sso', '3scale'],
      },
      processAutomation: {
        id: 'processAutomation',
        label: 'Process Automation',
        field: 'tags',
        values: ['decisionserver', 'processserver'],
      },
      analyticsData: {
        id: 'analyticsData',
        label: 'Analytics & Data',
        field: 'tags',
        values: ['datagrid', 'datavirt'],
      },
      runtimes: {
        id: 'runtimes',
        label: 'Runtimes & Frameworks',
        field: 'tags',
        values: ['eap', 'httpd', 'tomcat'],
      },
    },
  },
  cicd: {
    id: 'cicd',
    label: 'CI/CD',
    field: 'tags',
    subcategories: {
      jenkins: { id: 'jenkins', label: 'Jenkins', field: 'tags', values: ['jenkins'] },
      pipelines: { id: 'pipelines', label: 'Pipelines', field: 'tags', values: ['pipelines'] },
    },
  },
  virtualization: {
    id: 'virtualization',
    label: 'Virtualization',
    field: 'tags',
    subcategories: {
      vms: { id: 'vms', label: 'Virtual Machines', field: 'tags', values: ['virtualmachine'] },
    },
  },
};

const pageDescription =
  'Add shared apps, services, or source-to-image builders to your project from the Developer ' +
  'Catalog. Cluster admins can install additional apps which will show up here automatically.';

// Filter property white list
const filterGroups = ['kind'];

// initialFilters cannot be typed as it has multiple usages
const getAvailableFilters = (initialFilters): PageFilters => {
  const filters: PageFilters = _.cloneDeep(initialFilters);
  filters.kind = {
    ClusterServiceVersion: {
      label: 'Operator Backed',
      value: 'InstalledOperator',
      active: true,
    },
    HelmChart: {
      label: 'Helm Charts',
      value: 'HelmChart',
      active: false,
    },
    ImageStream: {
      label: 'Builder Image',
      value: 'ImageStream',
      active: false,
    },
    Template: {
      label: 'Template',
      value: 'Template',
      active: false,
    },
    ClusterServiceClass: {
      label: 'Service Class',
      value: 'ClusterServiceClass',
      active: false,
    },
  };

  return filters;
};

const filterPreference = ['kind'];
const filterGroupNameMap: Record<string, string> = {
  kind: 'Type',
};

const GroupByTypes: Record<string, string> = {
  Operator: 'Operator',
  None: 'None',
};

const keywordCompare = (filterString: string, item: Item): boolean => {
  if (!filterString) {
    return true;
  }
  if (!item) {
    return false;
  }

  return (
    item.tileName.toLowerCase().includes(filterString) ||
    (item.tileDescription && item.tileDescription.toLowerCase().includes(filterString)) ||
    (item.tags && item.tags.includes(filterString))
  );
};

const setURLParams = (params): void => {
  const url = new URL(window.location.href);
  const searchParams = `?${params.toString()}${url.hash}`;

  history.replace(`${url.pathname}${searchParams}`);
};

const sortByOperators = (items: Record<string, Item[]>): Record<string, Item[]> => {
  const sortedItemsByOperators = {};
  _.forEach(Object.keys(items).sort(), (key) => (sortedItemsByOperators[key] = items[key]));
  return sortedItemsByOperators;
};

export const groupItems = (items: Item[], groupBy: string): Item[] | Record<string, Item[]> => {
  if (groupBy === GroupByTypes.Operator) {
    const installedOperators = _.filter(items, (item) => item.kind === 'InstalledOperator');
    const nonOperators = _.filter(items, (item) => item.kind !== 'InstalledOperator');
    let groupedOperators = _.groupBy(installedOperators, (item) => item.obj.csv.spec.displayName);
    groupedOperators = sortByOperators(groupedOperators);
    const groupAllItems = { ...groupedOperators, 'Non Operators': nonOperators };
    return groupAllItems;
  }
  return items;
};

export class CatalogTileViewPage extends React.Component<
  CatalogTileViewPageProps,
  CatalogTileViewPageState
> {
  static displayName = `CatalogTileViewPage`;

  constructor(props) {
    super(props);

    this.state = { detailsItem: null };
  }

  componentDidMount() {
    const { items } = this.props;
    const searchParams = new URLSearchParams(window.location.search);
    const detailsItemID = searchParams.get('details-item');
    const detailsItem =
      detailsItemID && _.find(items, (item) => detailsItemID === _.get(item, 'obj.metadata.uid'));
    this.setState({ detailsItem });
  }

  openOverlay = (detailsItem: Item): void => {
    const params = new URLSearchParams(window.location.search);
    params.set('details-item', _.get(detailsItem, 'obj.metadata.uid'));
    setURLParams(params);

    this.setState({ detailsItem });
  };

  closeOverlay = (): void => {
    const params = new URLSearchParams(window.location.search);
    params.delete('details-item');
    setURLParams(params);

    this.setState({ detailsItem: null });
  };

  renderTile = (item: Item): React.ReactElement => {
    if (!item) {
      return null;
    }
    const { obj, tileName, tileImgUrl, tileIconClass, tileProvider, tileDescription, kind } = item;
    const uid = obj.metadata.uid;
    const iconClass = tileIconClass ? normalizeIconClass(tileIconClass) : null;
    const vendor = tileProvider ? `provided by ${tileProvider}` : null;
    const iconImgUrl = tileImgUrl || catalogImg;
    const { kind: filters } = getAvailableFilters({ kind });
    const filter = _.find(filters, ['value', kind]);
    return (
      <CatalogTile
        className="co-catalog-tile"
        key={uid}
        onClick={() => this.openOverlay(item)}
        title={tileName}
        badges={[
          <CatalogTileBadge key="type">
            <Badge isRead>{filter.label}</Badge>
          </CatalogTileBadge>,
        ]}
        iconImg={iconImgUrl}
        iconClass={iconClass}
        vendor={vendor}
        description={tileDescription}
        data-test={`${kind}-${obj.metadata.name}`}
      />
    );
  };

  render() {
    const { items } = this.props;
    const { detailsItem } = this.state;
    return (
      <>
        <TileViewPage
          items={items}
          itemsSorter={(itemsToSort) =>
            _.sortBy(itemsToSort, ({ tileName }) => tileName.toLowerCase())
          }
          getAvailableCategories={() => catalogCategories}
          // TODO(alecmerdler): Dynamic filters for each Operator and its provided APIs
          getAvailableFilters={getAvailableFilters}
          filterGroups={filterGroups}
          storeFilterKey={filterKey}
          filterGroupNameMap={filterGroupNameMap}
          keywordCompare={keywordCompare}
          filterRetentionPreference={filterPreference}
          renderTile={this.renderTile}
          pageDescription={pageDescription}
          emptyStateInfo="No developer catalog items are being shown due to the filters being applied."
          groupItems={groupItems}
          groupByTypes={GroupByTypes}
        />
        {detailsItem && (
          <Modal
            className="co-catalog-page__overlay co-catalog-page__overlay--right"
            header={
              <>
                <CatalogItemHeader
                  title={detailsItem.tileName}
                  vendor={
                    detailsItem.tileProvider ? `Provided by ${detailsItem.tileProvider}` : null
                  }
                  iconClass={
                    detailsItem.tileIconClass ? normalizeIconClass(detailsItem.tileIconClass) : null
                  }
                  iconImg={detailsItem.tileImgUrl}
                />
                <div className="co-catalog-page__overlay-actions">
                  <Link
                    className="pf-c-button pf-m-primary co-catalog-page__overlay-action"
                    to={detailsItem.href}
                    role="button"
                    title={detailsItem.createLabel}
                    onClick={this.closeOverlay}
                  >
                    {detailsItem.createLabel}
                  </Link>
                </div>
              </>
            }
            isOpen={!!detailsItem}
            onClose={this.closeOverlay}
            title={detailsItem.tileName}
          >
            <CatalogTileDetails item={detailsItem} closeOverlay={this.closeOverlay} />
          </Modal>
        )}
      </>
    );
  }
}
