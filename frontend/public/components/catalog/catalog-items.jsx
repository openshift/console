import * as React from 'react';
import * as _ from 'lodash-es';
import * as PropTypes from 'prop-types';
import {CatalogTile} from 'patternfly-react-extensions/dist/js/components/CatalogTile';
import {Modal} from 'patternfly-react/dist/js/components/Modal';

import {normalizeIconClass} from './catalog-item-icon';
import {CatalogTileDetails} from './catalog-item-details';
import {TileViewPage} from '../utils/tile-view-page';

export const catalogCategories = [
  {
    id: 'languages',
    label: 'Languages',
    field: 'tags',
    subcategories: [
      {id: 'java', label: 'Java', values: ['java']},
      {id: 'javascript', field: 'tags', values: ['javascript', 'nodejs', 'js'], label: 'JavaScript'},
      {id: 'dotnet', label: '.NET', field: 'tags', values: ['dotnet']},
      {id: 'perl', label: 'Perl', field: 'tags', values: ['perl']},
      {id: 'ruby', label: 'Ruby', field: 'tags', values: ['ruby']},
      {id: 'php', label: 'PHP', field: 'tags', values: ['php']},
      {id: 'python', label: 'Python', field: 'tags', values: ['python']},
      {id: 'golang', label: 'Go', field: 'tags', values: ['golang', 'go']},
    ],
  },
  {
    id: 'databases',
    label: 'Databases',
    field: 'tags',
    subcategories: [
      {id: 'mongodb', label: 'Mongo', field: 'tags', values: ['mongodb']},
      {id: 'mysql', label: 'MySQL', field: 'tags', values: ['mysql']},
      {id: 'postgresql', label: 'Postgres', field: 'tags', values: ['postgresql']},
      {id: 'mariadb', label: 'MariaDB', field: 'tags', values: ['mariadb']},
    ],
  },
  {
    id: 'middleware',
    label: 'Middleware',
    field: 'tags',
    subcategories: [
      {id: 'integration', label: 'Integration', field: 'tags', values: ['amq', 'fuse', 'jboss-fuse', 'sso', '3scale']},
      {id: 'process-automation', label: 'Process Automation', field: 'tags', values: ['decisionserver', 'processserver']},
      {id: 'analytics-data', label: 'Analytics & Data', field: 'tags', values: ['datagrid', 'datavirt']},
      {id: 'runtimes', label: 'Runtimes & Frameworks', field: 'tags', values: ['eap', 'httpd', 'tomcat']},
    ],
  },
  {
    id: 'cicd',
    label: 'CI/CD',
    field: 'tags',
    subcategories: [
      {id: 'jenkins', label: 'Jenkins', field: 'tags', values: ['jenkins']},
      {id: 'pipelines', label: 'Pipelines', field: 'tags', values: ['pipelines']},
    ],
  },
  {
    id: 'virtualization',
    label: 'Virtualization',
    field: 'tags',
    subcategories: [
      {id: 'vms', label: 'Virtual Machines', field: 'tags', values: ['virtualmachine']},
    ],
  },
];

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
    ImageStream: {
      label: 'Source-to-Image',
      value: 'ImageStream',
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
    const detailsItemId = searchParams.get('details-item');
    const detailsItem = detailsItemId && _.find(items, item => detailsItemId === _.get(item, 'obj.metadata.uid'));

    this.setState({detailsItem});
  }

  static keywordCompare(filterString, item) {
    if (!filterString) {
      return true;
    }
    if (!item) {
      return false;
    }

    return item.tileName.toLowerCase().includes(filterString) ||
      (item.tileDescription && item.tileDescription.toLowerCase().includes(filterString)) ||
      (item.tags && item.tags.includes(filterString));
  }

  openOverlay(detailsItem) {
    const params = new URLSearchParams(window.location.search);
    params.set('details-item', _.get(detailsItem, 'obj.metadata.uid'));
    CatalogTileViewPage.setURLParams(params);

    this.setState({detailsItem});
  }

  closeOverlay() {
    const params = new URLSearchParams(window.location.search);
    params.delete('details-item');
    CatalogTileViewPage.setURLParams(params);

    this.setState({detailsItem: null});
  }

  renderTile(item) {
    if (!item) {
      return null;
    }

    const { obj, tileName, tileImgUrl, tileIconClass, tileProvider, tileDescription } = item;
    const uid = obj.metadata.uid;
    const iconClass = tileIconClass ? normalizeIconClass(tileIconClass) : null;
    const vendor = tileProvider ? `provided by ${tileProvider}` : null;
    return (
      <CatalogTile
        id={uid}
        key={uid}
        onClick={() => this.openOverlay(item)}
        title={tileName}
        iconImg={tileImgUrl}
        iconClass={iconClass}
        vendor={vendor}
        description={tileDescription} />
    );
  }

  render() {
    const { items } = this.props;
    const { detailsItem } = this.state;

    return (
      <React.Fragment>
        <TileViewPage
          items={items}
          itemsSorter={itemsToSort => _.sortBy(itemsToSort, 'tileName')}
          getAvailableCategories={() => catalogCategories}
          getAvailableFilters={getAvailableFilters}
          filterGroups={filterGroups}
          filterGroupNameMap={filterGroupNameMap}
          filterValueMap={filterValueMap}
          keywordCompare={CatalogTileViewPage.keywordCompare}
          renderTile={this.renderTile}
          emptyStateInfo="No catalog items are being shown due to the filters being applied."
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
