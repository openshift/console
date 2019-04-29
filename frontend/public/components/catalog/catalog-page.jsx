import * as React from 'react';
import * as _ from 'lodash-es';
import * as PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';

import { ANNOTATIONS } from '../../const';
import { CatalogTileViewPage } from './catalog-items';
import { serviceClassDisplayName, referenceForModel } from '../../module/k8s';
import { withStartGuide } from '../start-guide';
import { FLAGS, connectToFlags, flagPending } from '../../features';
import { Firehose, PageHeading, StatusBox } from '../utils';
import {
  getAnnotationTags,
  getMostRecentBuilderTag,
  isBuilder,
} from '../image-stream';
import {
  getImageForIconClass,
  getImageStreamIcon,
  getServiceClassIcon,
  getServiceClassImage,
  getTemplateIcon,
} from './catalog-item-icon';
import { ClusterServiceClassModel, ClusterServiceVersionModel } from '../../models';
import { providedAPIsFor, referenceForProvidedAPI } from '../operator-lifecycle-manager';
import * as operatorLogo from '../../imgs/operator.svg';

export class CatalogListPage extends React.Component {
  constructor(props) {
    super(props);

    const items = this.getItems();
    this.state = {items};
  }

  componentDidUpdate(prevProps) {
    const {serviceServiceClasses, templates, imageStreams, clusterServiceVersions, namespace} = this.props;
    if (!_.isEqual(namespace, prevProps.namespace) ||
      !_.isEqual(serviceServiceClasses, prevProps.serviceServiceClasses) ||
      !_.isEqual(templates, prevProps.templates) ||
      !_.isEqual(imageStreams, prevProps.imageStreams) ||
      !_.isEqual(clusterServiceVersions, prevProps.clusterServiceVersions)) {
      const items = this.getItems();
      this.setState({items});
    }
  }

  getItems() {
    const {clusterServiceClasses, templates, imageStreams, clusterServiceVersions, loaded} = this.props;
    let clusterServiceClassItems = [];
    let templateItems = [];
    let imageStreamItems = [];
    let operatorProvidedAPIs = [];

    if (!loaded) {
      return [];
    }

    if (clusterServiceClasses) {
      clusterServiceClassItems = this.normalizeClusterServiceClasses(clusterServiceClasses.data);
    }

    if (templates) {
      templateItems = this.normalizeTemplates(templates.data);
    }

    if (imageStreams) {
      imageStreamItems = this.normalizeImageStreams(imageStreams.data);
    }

    if (clusterServiceVersions) {
      const imgFor = (desc) => _.get(desc.csv, 'spec.icon')
        ? `data:${_.get(desc.csv, 'spec.icon', [])[0].mediatype};base64,${_.get(desc.csv, 'spec.icon', [])[0].base64data}`
        : operatorLogo;

      operatorProvidedAPIs = _.flatten(clusterServiceVersions.data.map(csv => providedAPIsFor(csv).map(desc => ({...desc, csv}))))
        .reduce((all, cur) => all.find(v => referenceForProvidedAPI(v) === referenceForProvidedAPI(cur)) ? all : all.concat([cur]), [])
        .map(desc => ({
          // NOTE: Faking a real k8s object to avoid fetching all CRDs
          obj: {metadata: {uid: `${desc.csv.metadata.uid}-${desc.displayName}`, creationTimestamp: desc.csv.metadata.creationTimestamp}, ...desc},
          kind: 'InstalledOperator',
          tileName: desc.displayName,
          tileIconClass: null,
          tileImgUrl: imgFor(desc),
          tileDescription: desc.description,
          tileProvider: desc.csv.spec.provider.name,
          tags: desc.csv.spec.keywords,
          createLabel: 'Create',
          href: `/ns/${this.props.namespace || desc.csv.metadata.namespace}/clusterserviceversions/${desc.csv.metadata.name}/${referenceForProvidedAPI(desc)}/~new`,
          supportUrl: null,
          longDescription: `This resource is provided by ${desc.csv.spec.displayName}, a Kubernetes Operator enabled by the Operator Lifecycle Manager.`,
          documentationUrl: _.get((desc.csv.spec.links || []).find(({name}) => name === 'Documentation'), 'url'),
        }));
    }

    return _.sortBy([...clusterServiceClassItems, ...templateItems, ...imageStreamItems, ...operatorProvidedAPIs], 'tileName');
  }

  normalizeClusterServiceClasses(serviceClasses) {
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
      const createLabel = 'Create Service Instance';
      const href = `/catalog/create-service-instance?cluster-service-class=${serviceClass.metadata.name}&preselected-ns=${namespace}`;
      const supportUrl = _.get(serviceClass, 'spec.externalMetadata.supportUrl');
      const longDescription = _.get(serviceClass, 'spec.externalMetadata.longDescription');
      const documentationUrl = _.get(serviceClass, 'spec.externalMetadata.documentationUrl');

      return {
        obj: serviceClass,
        kind: 'ClusterServiceClass',
        tileName,
        tileIconClass,
        tileImgUrl,
        tileDescription,
        tileProvider,
        tags,
        createLabel,
        href,
        supportUrl,
        longDescription,
        documentationUrl,
      };
    });
  }

  normalizeTemplates(templates) {
    return _.reduce(templates, (acc, template) => {
      const { name, namespace, annotations = {} } = template.metadata;
      const tags = (annotations.tags || '').split(/\s*,\s*/);
      if (tags.includes('hidden')) {
        return acc;
      }
      const iconClass = getTemplateIcon(template);
      const tileImgUrl = getImageForIconClass(iconClass);
      const tileIconClass = tileImgUrl ? null : iconClass;
      acc.push({
        obj: template,
        kind: 'Template',
        tileName: annotations[ANNOTATIONS.displayName] || name,
        tileIconClass,
        tileImgUrl,
        tileDescription: annotations.description,
        tags,
        createLabel: 'Instantiate Template',
        tileProvider: annotations[ANNOTATIONS.providerDisplayName],
        documentationUrl: annotations[ANNOTATIONS.documentationURL],
        supportUrl: annotations[ANNOTATIONS.supportURL],
        href: `/catalog/instantiate-template?template=${name}&template-ns=${namespace}&preselected-ns=${this.props.namespace || ''}`,
      });
      return acc;
    }, []);
  }

  normalizeImageStreams(imageStreams) {
    const builderimageStreams = _.filter(imageStreams, isBuilder);
    return _.map(builderimageStreams, imageStream => {
      const { namespace: currentNamespace = '' } = this.props;
      const { name, namespace } = imageStream.metadata;
      const tag = getMostRecentBuilderTag(imageStream);
      const tileName = _.get(imageStream, ['metadata', 'annotations', ANNOTATIONS.displayName]) || name;
      const iconClass = getImageStreamIcon(tag);
      const tileImgUrl = getImageForIconClass(iconClass);
      const tileIconClass = tileImgUrl ? null : iconClass;
      const tileDescription = _.get(tag, 'annotations.description');
      const tags = getAnnotationTags(tag);
      const createLabel = 'Create Application';
      const tileProvider = _.get(tag, ['annotations', ANNOTATIONS.providerDisplayName]);
      const href = `/catalog/source-to-image?imagestream=${name}&imagestream-ns=${namespace}&preselected-ns=${currentNamespace}`;
      const builderImageTag = _.head(_.get(imageStream,'spec.tags'));
      const sampleRepo = _.get(builderImageTag, 'annotations.sampleRepo');
      return {
        obj: imageStream,
        kind: 'ImageStream',
        tileName,
        tileIconClass,
        tileImgUrl,
        tileDescription,
        tags,
        createLabel,
        tileProvider,
        href,
        sampleRepo,
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
// eslint-disable-next-line no-unused-vars
export const Catalog = connectToFlags(FLAGS.OPENSHIFT, FLAGS.SERVICE_CATALOG, FLAGS.OPERATOR_LIFECYCLE_MANAGER)(({flags, mock, namespace}) => {

  if (flagPending(flags.OPENSHIFT) || flagPending(flags.SERVICE_CATALOG)) {
    return null;
  }

  const resources = [
    ...(flags.SERVICE_CATALOG ? [{
      isList: true,
      kind: referenceForModel(ClusterServiceClassModel),
      namespaced: false,
      prop: 'clusterServiceClasses',
    }] : []),
    ...(flags.OPENSHIFT ? [{
      isList: true,
      kind: 'ImageStream',
      namespace: 'openshift',
      prop: 'imageStreams',
    }] : []),
    // TODO: Check specifically for template service broker.
    ...((flags.OPENSHIFT && !flags.SERVICE_CATALOG) ? [{
      isList: true,
      kind: 'Template',
      namespace: 'openshift',
      prop: 'templates',
    }] : []),
    ...(flags.OPERATOR_LIFECYCLE_MANAGER ? [{
      isList: true,
      kind: referenceForModel(ClusterServiceVersionModel),
      namespaced: true,
      namespace,
      prop: 'clusterServiceVersions',
    }] : []),
  ];

  return <Firehose resources={mock ? [] : resources} className="co-catalog-connect">
    <CatalogListPage namespace={namespace} />
  </Firehose>;
});

Catalog.displayName = 'Catalog';

Catalog.propTypes = {
  namespace: PropTypes.string,
};

export const CatalogPage = withStartGuide(({match, noProjectsAvailable}) => {
  const namespace = _.get(match, 'params.ns');
  return <React.Fragment>
    <Helmet>
      <title>Developer Catalog</title>
    </Helmet>
    <div className="co-catalog">
      <PageHeading title="Developer Catalog" />
      <Catalog namespace={namespace} mock={noProjectsAvailable} />
    </div>
  </React.Fragment>;
});

CatalogPage.displayName = 'CatalogPage';
