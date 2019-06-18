import * as React from 'react';
import * as _ from 'lodash';
import * as PropTypes from 'prop-types';
import * as catalogImg from '../../imgs/logos/catalog-icon.svg';
import { CatalogTile } from 'patternfly-react-extensions';
import { Modal } from 'patternfly-react';

import { history } from '../utils/router';
import { normalizeIconClass } from './catalog-item-icon';
import { CatalogTileDetails } from './catalog-item-details';
import { TileViewPage } from '../utils/tile-view-page';

export const catalogCategories = {
  languages: {
    id: 'languages',
    label: 'Languages',
    field: 'tags',
    subcategories: {
      java: {id: 'java', label: 'Java', values: ['java']},
      javascript: {id: 'javascript', label: 'JavaScript', field: 'tags', values: ['javascript', 'nodejs', 'js']},
      dotnet: {id: 'dotnet', label: '.NET', field: 'tags', values: ['dotnet']},
      perl: {id: 'perl', label: 'Perl', field: 'tags', values: ['perl']},
      ruby: {id: 'ruby', label: 'Ruby', field: 'tags', values: ['ruby']},
      php: {id: 'php', label: 'PHP', field: 'tags', values: ['php']},
      python: {id: 'python', label: 'Python', field: 'tags', values: ['python']},
      golang: {id: 'golang', label: 'Go', field: 'tags', values: ['golang', 'go']},
    },
  },
  databases: {
    id: 'databases',
    label: 'Databases',
    field: 'tags',
    subcategories: {
      mongodb: {id: 'mongodb', label: 'Mongo', field: 'tags', values: ['mongodb']},
      mysql: {id: 'mysql', label: 'MySQL', field: 'tags', values: ['mysql']},
      postgresql: {id: 'postgresql', label: 'Postgres', field: 'tags', values: ['postgresql']},
      mariadb: {id: 'mariadb', label: 'MariaDB', field: 'tags', values: ['mariadb']},
    },
  },
  middleware: {
    id: 'middleware',
    label: 'Middleware',
    field: 'tags',
    subcategories: {
      integration: {id: 'integration', label: 'Integration', field: 'tags', values: ['amq', 'fuse', 'jboss-fuse', 'sso', '3scale']},
      processAutomation: {id: 'processAutomation', label: 'Process Automation', field: 'tags', values: ['decisionserver', 'processserver']},
      analyticsData: {id: 'analyticsData', label: 'Analytics & Data', field: 'tags', values: ['datagrid', 'datavirt']},
      runtimes: {id: 'runtimes', label: 'Runtimes & Frameworks', field: 'tags', values: ['eap', 'httpd', 'tomcat']},
    },
  },
  cicd: {
    id: 'cicd',
    label: 'CI/CD',
    field: 'tags',
    subcategories: {
      jenkins: {id: 'jenkins', label: 'Jenkins', field: 'tags', values: ['jenkins']},
      pipelines: {id: 'pipelines', label: 'Pipelines', field: 'tags', values: ['pipelines']},
    },
  },
  virtualization: {
    id: 'virtualization',
    label: 'Virtualization',
    field: 'tags',
    subcategories: {
      vms: {id: 'vms', label: 'Virtual Machines', field: 'tags', values: ['virtualmachine']},
    },
  },
};

const pageDescription = 'Add shared apps, services, or source-to-image builders to your project from the Developer ' +
  'Catalog. Cluster admins can install additional apps which will show up here automatically.';

// Filter property white list
const filterGroups = [
  'kind',
];

const getAvailableFilters = initialFilters => {
  const filters = _.cloneDeep(initialFilters);
  filters.kind = {
    ClusterServiceClass: {
      label: 'Service Class',
      value: 'ClusterServiceClass',
      active: false,
    },
    Template: {
      label: 'Template',
      value: 'Template',
      active: false,
    },
    ImageStream: {
      label: 'Source-to-Image',
      value: 'ImageStream',
      active: false,
    },
    ClusterServiceVersion: {
      label: 'Installed Operators',
      value: 'InstalledOperator',
      active: false,
    },
  };

  return filters;
};


const filterGroupNameMap = {
  kind: 'Type',
};

const filterValueMap = {
  ClusterServiceClass: 'Service Class',
  ImageStream: 'Source-to-Image',
};

const keywordCompare = (filterString, item) => {
  if (!filterString) {
    return true;
  }
  if (!item) {
    return false;
  }

  return item.tileName.toLowerCase().includes(filterString) ||
    (item.tileDescription && item.tileDescription.toLowerCase().includes(filterString)) ||
    (item.tags && item.tags.includes(filterString));
};

const setURLParams = params => {
  const url = new URL(window.location);
  const searchParams = `?${params.toString()}${url.hash}`;

  history.replace(`${url.pathname}${searchParams}`);
};

export class CatalogTileViewPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {detailsItem: null};

    this.openOverlay = this.openOverlay.bind(this);
    this.closeOverlay = this.closeOverlay.bind(this);
    this.renderTile = this.renderTile.bind(this);
  }

  componentDidMount() {
    const {items} = this.props;
    const searchParams = new URLSearchParams(window.location.search);
    const detailsItemID = searchParams.get('details-item');
    const detailsItem = detailsItemID && _.find(items, item => detailsItemID === _.get(item, 'obj.metadata.uid'));

    this.setState({detailsItem});
  }

  openOverlay(detailsItem) {
    const params = new URLSearchParams(window.location.search);
    params.set('details-item', _.get(detailsItem, 'obj.metadata.uid'));
    setURLParams(params);

    this.setState({detailsItem});
  }

  closeOverlay() {
    const params = new URLSearchParams(window.location.search);
    params.delete('details-item');
    setURLParams(params);

    this.setState({detailsItem: null});
  }

  renderTile(item) {
    if (!item) {
      return null;
    }

    const { obj, tileName, tileImgUrl, tileIconClass, tileProvider, tileDescription, kind } = item;
    const uid = obj.metadata.uid;
    const iconClass = tileIconClass ? normalizeIconClass(tileIconClass) : null;
    const vendor = tileProvider ? `provided by ${tileProvider}` : null;
    const iconImgUrl = tileImgUrl || catalogImg;
    return (
      <CatalogTile
        key={uid}
        onClick={() => this.openOverlay(item)}
        title={tileName}
        iconImg={iconImgUrl}
        iconClass={iconClass}
        vendor={vendor}
        description={tileDescription}
        data-test={`${kind}-${obj.metadata.name}`}
      />
    );
  }

  render() {
    const { items } = this.props;
    const { detailsItem } = this.state;

    return (
      <React.Fragment>
        <TileViewPage
          items={items}
          itemsSorter={itemsToSort => _.sortBy(itemsToSort, ({tileName}) => tileName.toLowerCase())}
          getAvailableCategories={() => catalogCategories}
          // TODO(alecmerdler): Dynamic filters for each Operator and its provided APIs
          getAvailableFilters={getAvailableFilters}
          filterGroups={filterGroups}
          filterGroupNameMap={filterGroupNameMap}
          filterValueMap={filterValueMap}
          keywordCompare={keywordCompare}
          renderTile={this.renderTile}
          pageDescription={pageDescription}
          emptyStateInfo="No developer catalog items are being shown due to the filters being applied."
        />
        <Modal show={!!detailsItem} onHide={this.closeOverlay} bsSize={'lg'} className="co-catalog-page__overlay right-side-modal-pf">
          {detailsItem && <CatalogTileDetails item={detailsItem} closeOverlay={this.closeOverlay} />}
        </Modal>
      </React.Fragment>
    );
  }
}

CatalogTileViewPage.displayName = 'CatalogTileViewPage';
CatalogTileViewPage.propTypes = {
  items: PropTypes.array,
};
