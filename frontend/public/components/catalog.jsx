import * as React from 'react';
import * as _ from 'lodash-es';
import * as PropTypes from 'prop-types';
import * as classNames from 'classnames';
import { Helmet } from 'react-helmet';

import { FLAGS, connectToFlags, flagPending } from '../features';
import { Firehose, PageHeading, StatusBox } from './utils';
import { CatalogTileViewPage } from './catalog-items';
import { serviceClassDisplayName } from '../module/k8s';
import {
  getAnnotationTags,
  getMostRecentBuilderTag,
  isBuilder
} from './image-stream';
import {
  getImageForIconClass,
  getImageStreamIcon,
  getServiceClassIcon,
  getServiceClassImage,
} from './catalog-item-icon';
import { OpenShiftGettingStarted } from './start-guide';

const getResources = (flags) => {
  const resources = [];
  if (flags.SERVICE_CATALOG) {
    resources.push({
      isList: true,
      kind: 'ClusterServiceClass',
      namespaced: false,
      prop: 'clusterserviceclasses'
    });
  }
  if (flags.OPENSHIFT) {
    resources.push({
      isList: true,
      kind: 'ImageStream',
      namespace: 'openshift',
      prop: 'imagestreams'
    });
  }
  return resources;
};

class CatalogListPage extends React.Component {
  constructor(props) {
    super(props);

    const items = this.getItems();
    this.state = {items};
  }

  componentDidUpdate(prevProps) {
    const {clusterserviceclasses, imagestreams, namespace} = this.props;
    if (namespace !== prevProps.namespace ||
      clusterserviceclasses !== prevProps.clusterserviceclasses ||
      imagestreams !== prevProps.imagestreams) {
      const items = this.getItems();
      this.setState({items});
    }
  }

  getItems() {
    const {clusterserviceclasses, imagestreams, loaded} = this.props;
    let clusterServiceClassItems = [], imageStreamsItems = [];

    if (!loaded) {
      return [];
    }

    if (clusterserviceclasses) {
      clusterServiceClassItems = this.normalizeClusterServiceClasses(clusterserviceclasses.data, 'ClusterServiceClass');
    }

    if (imagestreams) {
      imageStreamsItems = this.normalizeImagestreams(imagestreams.data, 'ImageStream');
    }

    return _.sortBy([...clusterServiceClassItems, ...imageStreamsItems], 'tileName');
  }

  normalizeClusterServiceClasses(serviceClasses, kind) {
    const {namespace = ''} = this.props;
    const activeServiceClasses = _.reject(serviceClasses, serviceClass => {
      const tags = _.get(serviceClass, 'spec.tags');
      return serviceClass.status.removedFromBrokerCatalog || _.includes(tags, 'hidden');
    });

    return _.map(activeServiceClasses, serviceClass => {
      const tileName = serviceClassDisplayName(serviceClass);
      const iconClass = getServiceClassIcon(serviceClass);
      const tileImgUrl = getServiceClassImage(serviceClass, iconClass);
      const tileIconClass = tileImgUrl ? null : iconClass;
      const tileDescription = _.get(serviceClass, 'spec.description');
      const tileProvider = _.get(serviceClass, 'spec.externalMetadata.providerDisplayName');
      const tags = _.get(serviceClass, 'spec.tags');
      const href = `/k8s/cluster/clusterserviceclasses/${serviceClass.metadata.name}/create-instance?preselected-ns=${namespace}`;
      return {
        obj: serviceClass,
        kind,
        tileName,
        tileIconClass,
        tileImgUrl,
        tileDescription,
        tileProvider,
        href,
        tags,
      };
    });
  }

  normalizeImagestreams(imagestreams, kind) {
    const builderImageStreams = _.filter(imagestreams, imagestream => {
      return isBuilder(imagestream);
    });

    return _.map(builderImageStreams, imageStream => {
      const { namespace: currentNamespace = '' } = this.props;
      const tag = getMostRecentBuilderTag(imageStream);
      const tileName = _.get(imageStream, ['metadata', 'annotations', 'openshift.io/display-name']) || imageStream.metadata.name;
      const iconClass = getImageStreamIcon(tag);
      const tileImgUrl = getImageForIconClass(iconClass);
      const tileIconClass = tileImgUrl ? null : iconClass;
      const tileDescription = _.get(tag, 'annotations.description');
      const tags = getAnnotationTags(tag);
      const tileProvider = _.get(tag, 'annotations.openshift.io/provider-display-name');
      const { name, namespace } = imageStream.metadata;
      const href = `/source-to-image?imagestream=${name}&imagestream-ns=${namespace}&preselected-ns=${currentNamespace}`;
      return {
        obj: imageStream,
        kind,
        tileName,
        tileIconClass,
        tileImgUrl,
        tileDescription,
        tileProvider,
        href,
        tags,
      };
    });
  }

  render() {
    const {loaded, loadError} = this.props;
    const {items} = this.state;

    return <StatusBox data={items} loaded={loaded} loadError={loadError} label="Resources">
      <CatalogTileViewPage items={items} />
    </StatusBox>;
  }
}

CatalogListPage.displayName = 'CatalogList';

CatalogListPage.propTypes = {
  obj: PropTypes.object,
  namespace: PropTypes.string,
};

// eventually may use namespace
export const Catalog = ({flags, namespace}) => {
  const resources = getResources(flags);
  return <Firehose resources={resources}>
    <CatalogListPage namespace={namespace} />
  </Firehose>;
};

Catalog.displayName = 'Catalog';

Catalog.propTypes = {
  namespace: PropTypes.string,
};

export const CatalogPage = connectToFlags(FLAGS.OPENSHIFT, FLAGS.PROJECTS_AVAILABLE, FLAGS.SERVICE_CATALOG)(({match, flags}) => {
  const namespace = _.get(match, 'params.ns');
  if (flagPending(flags.OPENSHIFT) || flagPending(flags.PROJECTS_AVAILABLE) || flagPending(flags.PROJECTS_AVAILABLE)) {
    return null;
  }

  const showGettingStarted = flags.OPENSHIFT && !flags.PROJECTS_AVAILABLE;
  const className = classNames('co-catalog', {'co-disabled': showGettingStarted});
  return <React.Fragment>
    { showGettingStarted && <OpenShiftGettingStarted /> }
    <Helmet>
      <title>Catalog</title>
    </Helmet>
    <div className={className}>
      <PageHeading title="Catalog" />
      <Catalog namespace={namespace} flags={flags} />
    </div>
  </React.Fragment>;
});
