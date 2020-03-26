import * as React from 'react';
import * as _ from 'lodash-es';
import { Helmet } from 'react-helmet';
import { safeLoad } from 'js-yaml';

import { ANNOTATIONS, FLAGS, APIError } from '@console/shared';
import { CatalogTileViewPage } from './catalog-items';
import {
  k8sListPartialMetadata,
  referenceForModel,
  serviceClassDisplayName,
  K8sResourceCommon,
  K8sResourceKind,
  PartialObjectMetadata,
} from '../../module/k8s';
import { withStartGuide } from '../start-guide';
import { connectToFlags, flagPending, FlagsObject } from '../../reducers/features';
import {
  Firehose,
  LoadError,
  PageHeading,
  skeletonCatalog,
  StatusBox,
  FirehoseResult,
} from '../utils';
import { getAnnotationTags, getMostRecentBuilderTag, isBuilder } from '../image-stream';
import {
  getImageForIconClass,
  getImageStreamIcon,
  getServiceClassIcon,
  getServiceClassImage,
  getTemplateIcon,
} from './catalog-item-icon';
import { ClusterServiceClassModel, TemplateModel } from '../../models';
import * as plugins from '../../plugins';
import { coFetch, coFetchJSON } from '../../co-fetch';

export class CatalogListPage extends React.Component<CatalogListPageProps, CatalogListPageState> {
  constructor(props: CatalogListPageProps) {
    super(props);

    const items = this.getItems();
    this.state = { items };
  }

  componentDidUpdate(prevProps) {
    const {
      clusterServiceClasses,
      templateMetadata,
      projectTemplateMetadata,
      imageStreams,
      helmCharts,
      namespace,
      loaded,
    } = this.props;
    if (
      (!prevProps.loaded && loaded) ||
      !_.isEqual(namespace, prevProps.namespace) ||
      !_.isEqual(clusterServiceClasses, prevProps.clusterServiceClasses) ||
      !_.isEqual(templateMetadata, prevProps.templateMetadata) ||
      !_.isEqual(projectTemplateMetadata, prevProps.projectTemplateMetadata) ||
      !_.isEqual(imageStreams, prevProps.imageStreams) ||
      !_.isEqual(helmCharts, prevProps.helmCharts)
    ) {
      const items = this.getItems();
      this.setState({ items });
    }
  }

  getItems() {
    const extensionItems = _.flatten(
      plugins.registry
        .getDevCatalogModels()
        .filter(({ properties }) => _.get(this.props, referenceForModel(properties.model)))
        .map(({ properties }) =>
          properties.normalize(_.get(this.props, [referenceForModel(properties.model), 'data'])),
        ),
    );

    const {
      clusterServiceClasses,
      imageStreams,
      templateMetadata,
      projectTemplateMetadata,
      helmCharts,
      loaded,
    } = this.props;
    let clusterServiceClassItems = [];
    let imageStreamItems = [];
    let templateItems = [];
    let projectTemplateItems = [];
    let helmChartItems = [];

    if (!loaded) {
      return [];
    }

    if (clusterServiceClasses) {
      clusterServiceClassItems = this.normalizeClusterServiceClasses(clusterServiceClasses.data);
    }

    if (imageStreams) {
      imageStreamItems = this.normalizeImageStreams(imageStreams.data);
    }

    // Templates are not passed as a Firehose item since we only request template metadata.
    if (templateMetadata) {
      templateItems = this.normalizeTemplates(templateMetadata);
    }

    // Templates are not passed as a Firehose item since we only request template metadata.
    if (projectTemplateMetadata) {
      projectTemplateItems = this.normalizeTemplates(projectTemplateMetadata);
    }

    if (helmCharts) {
      helmChartItems = this.normalizeHelmCharts(helmCharts);
    }

    const items = [
      ...clusterServiceClassItems,
      ...imageStreamItems,
      ...templateItems,
      ...extensionItems,
      ...projectTemplateItems,
      ...helmChartItems,
    ];

    return _.sortBy(items, 'tileName');
  }

  normalizeClusterServiceClasses(serviceClasses) {
    const { namespace = '' } = this.props;
    return _.reduce(
      serviceClasses,
      (acc, serviceClass) => {
        // Prefer native templates to template-service-broker service classes.
        if (
          serviceClass.status.removedFromBrokerCatalog ||
          serviceClass.spec.clusterServiceBrokerName === 'template-service-broker'
        ) {
          return acc;
        }

        const iconClass = getServiceClassIcon(serviceClass);
        const tileImgUrl = getServiceClassImage(serviceClass);

        acc.push({
          obj: serviceClass,
          kind: 'ClusterServiceClass',
          tileName: serviceClassDisplayName(serviceClass),
          tileIconClass: tileImgUrl ? null : iconClass,
          tileImgUrl,
          tileDescription: serviceClass.spec.description,
          tileProvider: _.get(serviceClass, 'spec.externalMetadata.providerDisplayName'),
          tags: serviceClass.spec.tags,
          createLabel: 'Create Service Instance',
          href: `/catalog/create-service-instance?cluster-service-class=${serviceClass.metadata.name}&preselected-ns=${namespace}`,
          supportUrl: _.get(serviceClass, 'spec.externalMetadata.supportUrl'),
          longDescription: _.get(serviceClass, 'spec.externalMetadata.longDescription'),
          documentationUrl: _.get(serviceClass, 'spec.externalMetadata.documentationUrl'),
        });
        return acc;
      },
      [],
    );
  }

  normalizeTemplates(templates) {
    return _.reduce(
      templates,
      (acc, template) => {
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
          href: `/catalog/instantiate-template?template=${name}&template-ns=${namespace}&preselected-ns=${this
            .props.namespace || ''}`,
        });
        return acc;
      },
      [],
    );
  }

  normalizeHelmCharts(chartEntries: HelmChartEntries) {
    const { namespace: currentNamespace = '' } = this.props;

    return _.reduce(
      chartEntries,
      (normalizedCharts, charts) => {
        charts.forEach((chart: HelmChart) => {
          const tags = chart.keywords;
          const chartName = chart.name;
          const tileName = `${_.startCase(chartName)} v${chart.version}`;
          const tileImgUrl = chart.icon || getImageForIconClass('icon-helm');
          const chartURL = _.get(chart, 'urls.0');
          const encodedChartURL = encodeURIComponent(chartURL);
          const markdownDescription = async () => {
            let chartData;
            try {
              chartData = await coFetchJSON(`/api/helm/chart?url=${chartURL}`);
            } catch (err) {
              return '';
            }
            const readmeFile = chartData?.files?.find((file) => file.name === 'README.md');
            return readmeFile?.data && atob(readmeFile?.data);
          };

          normalizedCharts.push({
            obj: { ...chart, ...{ metadata: { uid: chart.digest } } },
            kind: 'HelmChart',
            tileName,
            tileIconClass: null,
            tileImgUrl,
            tileDescription: chart.description,
            tags,
            createLabel: 'Install Helm Chart',
            tileProvider: _.get(chart, 'maintainers.0.name'),
            documentationUrl: chart.home,
            supportUrl: chart.home,
            markdownDescription,
            href: `/catalog/helm-install?chartName=${chartName}&chartURL=${encodedChartURL}&preselected-ns=${currentNamespace}`,
          });
        });
        return normalizedCharts;
      },
      [],
    );
  }

  normalizeImageStreams(imageStreams) {
    const builderimageStreams = _.filter(imageStreams, isBuilder);
    return _.map(builderimageStreams, (imageStream) => {
      const { namespace: currentNamespace = '' } = this.props;
      const { name, namespace } = imageStream.metadata;
      const tag = getMostRecentBuilderTag(imageStream);
      const tileName =
        _.get(imageStream, ['metadata', 'annotations', ANNOTATIONS.displayName]) || name;
      const iconClass = getImageStreamIcon(tag);
      const tileImgUrl = getImageForIconClass(iconClass);
      const tileIconClass = tileImgUrl ? null : iconClass;
      const tileDescription = _.get(tag, 'annotations.description');
      const tags = getAnnotationTags(tag);
      const createLabel = 'Create Application';
      const tileProvider = _.get(tag, ['annotations', ANNOTATIONS.providerDisplayName]);
      const href = `/catalog/source-to-image?imagestream=${name}&imagestream-ns=${namespace}&preselected-ns=${currentNamespace}`;
      const builderImageTag = _.head(_.get(imageStream, 'spec.tags'));
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
    const { loaded, loadError } = this.props;
    const { items } = this.state;

    return (
      <StatusBox
        skeleton={skeletonCatalog}
        data={items}
        loaded={loaded}
        loadError={loadError}
        label="Resources"
      >
        <CatalogTileViewPage items={items} />
      </StatusBox>
    );
  }
}

export const Catalog = connectToFlags<CatalogProps>(
  FLAGS.OPENSHIFT,
  FLAGS.SERVICE_CATALOG,
  ...plugins.registry.getDevCatalogModels().map(({ properties }) => properties.flag),
)((props) => {
  const { flags, mock, namespace } = props;
  const openshiftFlag = flags[FLAGS.OPENSHIFT];
  const serviceCatalogFlag = flags[FLAGS.SERVICE_CATALOG];
  const [templateMetadata, setTemplateMetadata] = React.useState<K8sResourceCommon>();
  const [templateError, setTemplateError] = React.useState<APIError>();
  const [projectTemplateMetadata, setProjectTemplateMetadata] = React.useState<K8sResourceCommon[]>(
    null,
  );
  const [projectTemplateError, setProjectTemplateError] = React.useState<APIError>();
  const [helmCharts, setHelmCharts] = React.useState<HelmChartEntries>();

  const loadTemplates = openshiftFlag && !mock;

  // Load templates from the shared `openshift` namespace. Don't use Firehose
  // for templates so that we can request only metadata. This keeps the request
  // much smaller.
  React.useEffect(() => {
    if (!loadTemplates) {
      return;
    }
    k8sListPartialMetadata(TemplateModel, { ns: 'openshift' })
      .then((metadata) => {
        setTemplateMetadata(metadata);
        setTemplateError(null);
      })
      .catch(setTemplateError);
  }, [loadTemplates]);

  // Load templates for the current project.
  React.useEffect(() => {
    if (!loadTemplates) {
      return;
    }
    // Don't load templates from the `openshift` namespace twice if it's the current namespace
    if (!namespace || namespace === 'openshift') {
      setProjectTemplateMetadata([]);
      setProjectTemplateError(null);
    } else {
      k8sListPartialMetadata(TemplateModel, { ns: namespace })
        .then((metadata) => {
          setProjectTemplateMetadata(metadata);
          setProjectTemplateError(null);
        })
        .catch(setTemplateError);
    }
  }, [loadTemplates, namespace]);

  React.useEffect(() => {
    coFetch('/api/helm/charts/index.yaml').then(async (res) => {
      const yaml = await res.text();
      const json = safeLoad(yaml);
      setHelmCharts(json.entries);
    });
  }, []);

  const error = templateError || projectTemplateError;
  if (error) {
    return (
      <LoadError
        message={error.message}
        label="Templates"
        className="loading-box loading-box__errored"
      />
    );
  }

  if (_.some(flags, (flag) => flagPending(flag))) {
    return null;
  }

  const resources = [
    ...(serviceCatalogFlag
      ? [
          {
            isList: true,
            kind: referenceForModel(ClusterServiceClassModel),
            namespaced: false,
            prop: 'clusterServiceClasses',
          },
        ]
      : []),
    ...(openshiftFlag
      ? [
          {
            isList: true,
            kind: 'ImageStream',
            namespace: 'openshift',
            prop: 'imageStreams',
          },
        ]
      : []),
    ...plugins.registry
      .getDevCatalogModels()
      .filter(({ properties }) => !properties.flag || flags[properties.flag])
      .map(({ properties }) => ({
        isList: true,
        kind: referenceForModel(properties.model),
        namespaced: properties.model.namespaced,
        namespace,
        prop: referenceForModel(properties.model),
      })),
  ];

  return (
    <div className="co-catalog__body">
      <Firehose resources={mock ? [] : resources}>
        <CatalogListPage
          namespace={namespace}
          templateMetadata={templateMetadata}
          projectTemplateMetadata={projectTemplateMetadata}
          helmCharts={helmCharts}
          {...(props as any)}
        />
      </Firehose>
    </div>
  );
});

export const CatalogPage = withStartGuide(({ match, noProjectsAvailable }) => {
  const namespace = _.get(match, 'params.ns');
  return (
    <>
      <Helmet>
        <title>Developer Catalog</title>
      </Helmet>
      <div className="co-m-page__body">
        <div className="co-catalog">
          <PageHeading title="Developer Catalog" />
          <p className="co-catalog-page__description">
            Add shared apps, services, or source-to-image builders to your project from the
            Developer Catalog. Cluster admins can install additional apps which will show up here
            automatically.
          </p>
          <Catalog namespace={namespace} mock={noProjectsAvailable} />
        </div>
      </div>
    </>
  );
});

export type CatalogListPageProps = {
  clusterServiceClasses?: FirehoseResult<K8sResourceKind[]>;
  imageStreams?: FirehoseResult<K8sResourceKind[]>;
  templateMetadata?: PartialObjectMetadata[];
  projectTemplateMetadata?: PartialObjectMetadata[];
  helmCharts?: HelmChartEntries;
  loaded: boolean;
  loadError?: string;
  namespace?: string;
};

export type CatalogListPageState = {
  items: any[];
};

export type CatalogProps = {
  flags: FlagsObject;
  namespace?: string;
  mock: boolean;
};

export type HelmChartEntries = {
  [name: string]: Array<HelmChart>;
};

export type HelmChart = {
  apiVersion: string;
  appVersion: string;
  created: string;
  description: string;
  digest: string;
  home: string;
  icon: string;
  keywords: string[];
  maintainers: Array<{ email: string; name: string }>;
  name: string;
  tillerVersion: string;
  urls: string[];
  version: string;
};

CatalogPage.displayName = 'CatalogPage';
Catalog.displayName = 'Catalog';
