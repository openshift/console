import * as React from 'react';
import * as _ from 'lodash-es';
import * as PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';

import { FLAGS, connectToFlags, flagPending } from '../features';
import { Firehose, NavTitle, StatusBox } from './utils';
import { CatalogTileViewPage } from './catalog-items';
import { getMostRecentBuilderTag, getAnnotationTags, isBuilder} from './image-stream';
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
    let clusterServiceClassItems = null, imageStreamsItems = null;

    if (!loaded) {
      return;
    }

    if (clusterserviceclasses) {
      clusterServiceClassItems = this.normalizeClusterServiceClasses(clusterserviceclasses.data, 'ClusterServiceClass');
    }

    if (imagestreams) {
      imageStreamsItems = this.normalizeImagestreams(imagestreams.data, 'ImageStream');
    }

    const items = _.sortBy([...clusterServiceClassItems, ...imageStreamsItems], 'tileName');

    this.setState({items});
  }

  normalizeClusterServiceClasses(serviceClasses, kind) {
    const {namespace = ''} = this.props;
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

    return <div className="co-m-pane">
      <div className="co-m-pane__body">
        <StatusBox data={items} loaded={loaded} loadError={loadError} label="Resources">
          <CatalogTileViewPage items={items} />
        </StatusBox>
      </div>
    </div>;
  }
}

CatalogListPage.displayName = 'CatalogList';

CatalogListPage.propTypes = {
  obj: PropTypes.object,
  namespace: PropTypes.string,
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
      <CatalogListPage namespace={namespace} />
    </Firehose>
  </div>;
});

Catalog.displayName = 'Catalog';

Catalog.propTypes = {
  namespace: PropTypes.string,
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
