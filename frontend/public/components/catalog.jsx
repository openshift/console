import * as React from 'react';
import * as _ from 'lodash-es';
import * as PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';

import { FLAGS, connectToFlags, flagPending } from '../features';
import { Firehose, NavTitle, StatusBox } from './utils';
import { CatalogList } from './catalog-items';
import { getMostRecentBuilderTag, isBuilder} from './image-stream';
import { serviceClassDisplayName } from '../module/k8s';
import { getServiceClassIcon, getServiceClassImage, getImageStreamIcon, getImageForIconClass } from './catalog-item-icon';

class CatalogListPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      items: [],
    };
  }

  componentDidUpdate(prevProps) {
    const {clusterserviceclasses, imagestreams, namespace} = this.props;
    if (namespace !== prevProps.namespace ||
      clusterserviceclasses !== prevProps.clusterserviceclasses ||
      imagestreams !== prevProps.imagestreams) {
      this.createCatalogData();
    }
  }

  createCatalogData() {
    const {clusterserviceclasses, imagestreams, loaded} = this.props;

    if (!loaded) {
      return;
    }

    const clusterServiceClassItems = this.normalizeClusterServiceClasses(clusterserviceclasses.data, 'ClusterServiceClass');
    const imageStreamsItems = this.normalizeImagestreams(imagestreams.data, 'ImageStream');

    const items = _.sortBy([...clusterServiceClassItems, ...imageStreamsItems], 'tileName');

    this.setState({items});
  }

  normalizeClusterServiceClasses(serviceClasses, kind) {
    const activeServiceClasses = _.filter(serviceClasses, serviceClass => {
      return !serviceClass.status.removedFromBrokerCatalog;
    });

    return _.map(activeServiceClasses, serviceClass => {
      const tileName = serviceClassDisplayName(serviceClass);
      const iconClass = getServiceClassIcon(serviceClass);
      const tileImgUrl = getServiceClassImage(serviceClass, iconClass);
      const tileIconClass = tileImgUrl ? null : iconClass;
      const tileDescription = _.get(serviceClass, 'spec.description');
      const tileProvider = _.get(serviceClass, 'spec.externalMetadata.providerDisplayName');
      const href = `/k8s/cluster/clusterserviceclasses/${serviceClass.metadata.name}/create-instance`;
      return {
        obj: serviceClass,
        kind,
        tileName,
        tileIconClass,
        tileImgUrl,
        tileDescription,
        tileProvider,
        href,
      };
    });
  }

  normalizeImagestreams(imagestreams, kind) {
    const builderImageStreams = _.filter(imagestreams, imagestream => {
      return isBuilder(imagestream);
    });

    return _.map(builderImageStreams, imagestream => {
      const tag = getMostRecentBuilderTag(imagestream);
      const tileName = _.get(imagestream, ['metadata', 'annotations', 'openshift.io/display-name']) || imagestream.metadata.name;
      const iconClass = getImageStreamIcon(tag);
      const tileImgUrl = getImageForIconClass(iconClass);
      const tileIconClass = tileImgUrl ? null : iconClass;
      const tileDescription = _.get(tag, 'annotations.description');
      const tileProvider = _.get(tag, 'annotations.openshift.io/provider-display-name');
      const { name, namespace } = imagestream.metadata;
      const href = `/source-to-image?imagestream=${name}&ns=${namespace}`;
      return {
        obj: imagestream,
        kind,
        tileName,
        tileIconClass,
        tileImgUrl,
        tileDescription,
        tileProvider,
        href,
      };
    });
  }

  render() {
    const {loaded, loadError} = this.props;
    const {items} = this.state;

    return <div className="co-m-pane">
      <div className="co-m-pane__body">
        <StatusBox data={items} loaded={loaded} loadError={loadError} label="Resources">
          <CatalogList items={items} />
        </StatusBox>
      </div>
    </div>;
  }
}

CatalogListPage.displayName = 'CatalogList';

CatalogListPage.propTypes = {
  obj: PropTypes.object
};

// eventually may use namespace
// eslint-disable-next-line no-unused-vars
export const Catalog = connectToFlags(FLAGS.OPENSHIFT, FLAGS.SERVICE_CATALOG)(({namespace, flags}) => {

  if (flagPending(flags.OPENSHIFT) || flagPending(flags.SERVICE_CATALOG)) {
    return null;
  }

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
  return <div className="catalog">
    <Firehose resources={resources}>
      <CatalogListPage />
    </Firehose>
  </div>;
});

Catalog.displayName = 'Catalog';

Catalog.propTypes = {
  namespace: PropTypes.string.isRequired,
};

export const CatalogPage = ({match}) => {
  const namespace = _.get(match, 'params.ns');
  return <React.Fragment>
    <Helmet>
      <title>Catalog</title>
    </Helmet>
    <NavTitle title="Catalog" />
    <Catalog namespace={namespace} />
  </React.Fragment>;
};
