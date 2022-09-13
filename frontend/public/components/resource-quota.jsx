import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import {
  OutlinedCircleIcon,
  ResourcesAlmostEmptyIcon,
  ResourcesAlmostFullIcon,
  ResourcesFullIcon,
  UnknownIcon,
} from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import AppliedClusterResourceQuotaCharts from '@console/app/src/components/resource-quota/AppliedClusterResourceQuotaCharts';
import ResourceQuotaCharts from '@console/app/src/components/resource-quota/ResourceQuotaCharts';
import ClusterResourceQuotaCharts from '@console/app/src/components/resource-quota/ClusterResourceQuotaCharts';

import { FLAGS, YellowExclamationTriangleIcon } from '@console/shared';
import { DetailsPage, MultiListPage, Table, TableData } from './factory';
import {
  Kebab,
  SectionHeading,
  navFactory,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  convertToBaseValue,
  FieldLevelHelp,
  useAccessReview,
  LabelList,
  Selector,
  Timestamp,
  DetailsItem,
} from './utils';
import { connectToFlags } from '../reducers/connectToFlags';
import { flagPending } from '../reducers/features';
import { LoadingBox } from './utils/status-box';
import { referenceFor, referenceForModel } from '../module/k8s';
import {
  AppliedClusterResourceQuotaModel,
  ResourceQuotaModel,
  ClusterResourceQuotaModel,
} from '../models';
import { getUsedPercentage } from '@console/app/src/components/resource-quota/utils';

const { common } = Kebab.factory;

const resourceQuotaMenuActions = [
  ...Kebab.getExtensionsActionsForKind(ResourceQuotaModel),
  ...common,
];
const clusterResourceQuotaMenuActions = [
  ...Kebab.getExtensionsActionsForKind(ClusterResourceQuotaModel),
  ...common,
];
const appliedClusterResourceQuotaMenuActions = (namespace) => [
  ...Kebab.getExtensionsActionsForKind(ClusterResourceQuotaModel),
  Kebab.factory.ModifyLabels,
  Kebab.factory.ModifyAnnotations,
  (kind, obj) => {
    return {
      // t('public~Edit AppliedClusterResourceQuota')
      labelKey: 'public~Edit AppliedClusterResourceQuota',
      href: `/k8s/ns/${namespace}/${referenceForModel(AppliedClusterResourceQuotaModel)}/${
        obj.metadata.name
      }/yaml`,
      accessReview: {
        group: kind.apiGroup,
        resource: kind.plural,
        name: obj.metadata.name,
        namespace,
        verb: 'update',
      },
    };
  },
  Kebab.factory.Delete,
];

const isClusterQuota = (quota) => !quota.metadata.namespace;

const clusterQuotaReference = referenceForModel(ClusterResourceQuotaModel);
const appliedClusterQuotaReference = referenceForModel(AppliedClusterResourceQuotaModel);

const quotaActions = (quota, customData = undefined) => {
  if (quota.metadata.namespace) {
    return resourceQuotaMenuActions;
  }

  if (quota.kind === 'ClusterResourceQuota') {
    return clusterResourceQuotaMenuActions;
  }

  if (quota.kind === 'AppliedClusterResourceQuota') {
    return appliedClusterResourceQuotaMenuActions(customData.namespace);
  }
};

export const getQuotaResourceTypes = (quota) => {
  const specHard = isClusterQuota(quota)
    ? _.get(quota, 'spec.quota.hard')
    : _.get(quota, 'spec.hard');
  return _.keys(specHard).sort();
};

export const getACRQResourceUsage = (quota, resourceType, namespace) => {
  let used;
  if (namespace) {
    const allNamespaceData = quota.status?.namespaces;
    const currentNamespaceData = allNamespaceData.filter((ns) => ns.namespace === namespace);
    used = {
      namespace: currentNamespaceData[0]?.status?.used[resourceType],
      cluster: quota.status?.total?.used[resourceType],
    };
  } else {
    used = { namespace: 0, cluster: quota.status?.total?.used[resourceType] };
  }
  const totalUsed = quota.status?.total?.used[resourceType];
  const max = quota.status?.total?.hard[resourceType] || quota.spec?.quota?.hard[resourceType];
  const percentNamespace =
    !max || !used.namespace
      ? 0
      : (convertToBaseValue(used.namespace) / convertToBaseValue(max)) * 100;
  const percentCluster =
    !max || !used.cluster ? 0 : (convertToBaseValue(used.cluster) / convertToBaseValue(max)) * 100;
  const percentOtherNamespaces = percentCluster - percentNamespace;

  return {
    used,
    totalUsed,
    max,
    percent: {
      namespace: percentNamespace,
      otherNamespaces: percentOtherNamespaces,
      unused: 100 - (percentNamespace + percentOtherNamespaces),
    },
  };
};

export const getResourceUsage = (quota, resourceType) => {
  const isCluster = isClusterQuota(quota);
  const statusPath = isCluster ? ['status', 'total', 'hard'] : ['status', 'hard'];
  const specPath = isCluster ? ['spec', 'quota', 'hard'] : ['spec', 'hard'];
  const usedPath = isCluster ? ['status', 'total', 'used'] : ['status', 'used'];
  const max =
    _.get(quota, [...statusPath, resourceType]) || _.get(quota, [...specPath, resourceType]);
  const used = _.get(quota, [...usedPath, resourceType]);
  const percent = !max || !used ? 0 : (convertToBaseValue(used) / convertToBaseValue(max)) * 100;

  return {
    used,
    max,
    percent,
  };
};

const tableColumnClasses = [
  '',
  '',
  'pf-m-hidden pf-m-visible-on-lg',
  'pf-m-hidden pf-m-visible-on-lg',
  'pf-m-hidden pf-m-visible-on-lg',
  'pf-m-hidden pf-m-visible-on-lg',
  Kebab.columnClass,
];

const acrqTableColumnClasses = [
  '',
  'pf-m-hidden pf-m-visible-on-lg',
  'pf-m-hidden pf-m-visible-on-lg',
  'pf-m-hidden pf-m-visible-on-lg',
  'pf-m-hidden pf-m-visible-on-lg',
  Kebab.columnClass,
];

export const UsageIcon = ({ percent }) => {
  let usageIcon = <UnknownIcon />;
  if (percent === 0) {
    usageIcon = <OutlinedCircleIcon className="co-resource-quota-empty" />;
  } else if (percent > 0 && percent < 50) {
    usageIcon = <ResourcesAlmostEmptyIcon className="co-resource-quota-almost-empty" />;
  } else if (percent >= 50 && percent < 100) {
    usageIcon = <ResourcesAlmostFullIcon className="co-resource-quota-almost-full" />;
  } else if (percent === 100) {
    usageIcon = <ResourcesFullIcon className="co-resource-quota-full" />;
  } else if (percent > 100) {
    usageIcon = <YellowExclamationTriangleIcon className="co-resource-quota-exceeded" />;
  }
  return usageIcon;
};

export const ResourceUsageRow = ({ quota, resourceType, namespace = undefined }) => {
  const reference = referenceFor(quota);
  const isACRQ = reference === appliedClusterQuotaReference;
  if (isACRQ) {
    const { used, totalUsed, max, percent } = getACRQResourceUsage(quota, resourceType, namespace);
    return (
      <div className="row co-m-row">
        <div className="col-sm-4 col-xs-6 co-break-word">{resourceType}</div>
        <div className="col-sm-2 hidden-xs co-resource-quota-icon">
          <UsageIcon percent={percent.namespace} />
        </div>
        <div className="col-sm-2 col-xs-2">{used.namespace}</div>
        <div className="col-sm-2 col-xs-2">{totalUsed}</div>
        <div className="col-sm-2 col-xs-2">{max}</div>
      </div>
    );
  }

  const { used, max, percent } = getResourceUsage(quota, resourceType);
  return (
    <div className="row co-m-row">
      <div className="col-sm-4 col-xs-6 co-break-word">{resourceType}</div>
      <div className="col-sm-2 hidden-xs co-resource-quota-icon">
        <UsageIcon percent={percent} />
      </div>
      <div className="col-sm-3 col-xs-3">{used}</div>
      <div className="col-sm-3 col-xs-3">{max}</div>
    </div>
  );
};

export const QuotaScopesInline = ({ scopes }) => {
  return <span>({scopes.join(', ')})</span>;
};

export const QuotaScopesList = ({ scopes }) => {
  const { t } = useTranslation();
  const quotaScopes = {
    Terminating: {
      description: t(
        'public~Affects pods that have an active deadline. These pods usually include builds, deployers, and jobs.',
      ),
    },
    NotTerminating: {
      description: t(
        'public~Affects pods that do not have an active deadline. These pods usually include your applications.',
      ),
    },
    BestEffort: {
      description: t(
        'public~Affects pods that do not have resource limits set. These pods have a best effort quality of service.',
      ),
    },
    NotBestEffort: {
      description: t(
        'public~Affects pods that have at least one resource limit set. These pods do not have a best effort quality of service.',
      ),
    },
  };
  return scopes.map((scope) => {
    const scopeObj = _.get(quotaScopes, scope);
    return scopeObj ? (
      <dd key={scope}>
        <div className="co-resource-quota-scope__label">{scope}</div>
        <div className="co-resource-quota-scope__description">{scopeObj.description}</div>
      </dd>
    ) : (
      <dd key={scope} className="co-resource-quota-scope__label">
        {scope}
      </dd>
    );
  });
};

export const hasComputeResources = (resourceTypes) => {
  const chartResourceTypes = [
    'requests.cpu',
    'cpu',
    'limits.cpu',
    'requests.memory',
    'memory',
    'limits.memory',
  ];
  return _.intersection(resourceTypes, chartResourceTypes).length > 0;
};

const Details = ({ obj: rq, match }) => {
  const { t } = useTranslation();
  const resourceTypes = getQuotaResourceTypes(rq);
  const scopes = rq.spec?.scopes ?? rq.spec?.quota?.scopes;
  const reference = referenceFor(rq);
  const isACRQ = reference === appliedClusterQuotaReference;
  const namespace = match?.params?.ns;
  let text;
  let charts;
  switch (reference) {
    case appliedClusterQuotaReference:
      text = t('public~AppliedClusterResourceQuota details');
      charts = (
        <AppliedClusterResourceQuotaCharts appliedClusterResourceQuota={rq} namespace={namespace} />
      );
      break;
    case clusterQuotaReference:
      text = t('public~ClusterResourceQuota details');
      charts = <ClusterResourceQuotaCharts clusterResourceQuota={rq} />;
      break;
    default:
      text = t('public~ResourceQuota details');
      charts = <ResourceQuotaCharts resourceQuota={rq} />;
  }
  const canListCRQ = useAccessReview({
    group: ClusterResourceQuotaModel.apiGroup,
    resource: ClusterResourceQuotaModel.plural,
    verb: 'list',
  });

  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={text} />
        {charts}
        <div className="row">
          <div className="col-sm-6">
            <ResourceSummary resource={rq}>
              {canListCRQ && (
                <DetailsItem
                  label={t('public~ClusterResourceQuota')}
                  obj={rq}
                  path="rq.metadata.name"
                >
                  <ResourceLink kind={clusterQuotaReference} name={rq.metadata.name} />
                </DetailsItem>
              )}
              <DetailsItem
                label={t('public~Label selector')}
                obj={rq}
                path="spec.selector.labels.matchLabels"
              >
                <LabelList
                  kind={appliedClusterQuotaReference}
                  labels={rq.spec?.selector?.labels?.matchLabels}
                />
              </DetailsItem>
              <DetailsItem
                label={t('public~Project annotations')}
                obj={rq}
                path="spec.selector.annotations"
              >
                <Selector selector={rq.spec?.selector?.annotations} namespace={namespace} />
              </DetailsItem>
            </ResourceSummary>
          </div>
          {scopes && (
            <div className="col-sm-6">
              <dl className="co-m-pane__details">
                <dt>{t('public~Scopes')}</dt>
                <QuotaScopesList scopes={scopes} />
              </dl>
            </div>
          )}
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text={text} style={{ display: 'block', marginBottom: '20px' }}>
          <FieldLevelHelp>
            <p>
              {t(
                'public~Requests are the amount of resources you expect to use. These are used when establishing if the cluster can fulfill your Request.',
              )}
            </p>
            <p>
              {t(
                'public~Limits are a maximum amount of a resource you can consume. Applications consuming more than the Limit may be terminated.',
              )}
            </p>
            <p>
              {t(
                'public~A cluster administrator can establish limits on both the amount you can request and your limits with a ResourceQuota.',
              )}
            </p>
          </FieldLevelHelp>
        </SectionHeading>
        <div className="co-m-table-grid co-m-table-grid--bordered">
          <div className="row co-m-table-grid__head">
            <div className="col-sm-4 col-xs-6">{t('public~Resource type')}</div>
            <div className="col-sm-2 hidden-xs">{t('public~Capacity')}</div>
            <div
              className={classNames(
                { 'col-sm-2 col-xs-2': isACRQ },
                { 'col-sm-3 col-xs-3': !isACRQ },
              )}
            >
              {t('public~Used')}
            </div>
            {isACRQ && <div className="col-sm-2 col-xs-2">{t('public~Total used')}</div>}
            <div
              className={classNames(
                { 'col-sm-2 col-xs-2': isACRQ },
                { 'col-sm-3 col-xs-3': !isACRQ },
              )}
            >
              {t('public~Max')}
            </div>
          </div>
          <div className="co-m-table-grid__body">
            {resourceTypes.map((type) => (
              <ResourceUsageRow key={type} quota={rq} resourceType={type} namespace={namespace} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

const ResourceQuotaTableRow = ({ obj: rq, customData }) => {
  const { t } = useTranslation();
  const actions = quotaActions(rq, customData);
  let resourcesAtQuota;
  if (rq.kind === ResourceQuotaModel.kind) {
    resourcesAtQuota = Object.keys(rq?.status?.hard || {}).reduce(
      (acc, resource) =>
        getUsedPercentage(rq?.status?.hard[resource], rq?.status?.used?.[resource]) >= 100
          ? acc + 1
          : acc,
      0,
    );
  } else {
    resourcesAtQuota = Object.keys(rq?.status?.total?.hard || {}).reduce(
      (acc, resource) =>
        getUsedPercentage(rq?.status?.total?.hard[resource], rq?.status?.total?.used?.[resource]) >=
        100
          ? acc + 1
          : acc,
      0,
    );
  }
  return (
    <>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={referenceFor(rq)}
          name={rq.metadata.name}
          namespace={
            referenceFor(rq) === appliedClusterQuotaReference
              ? customData.namespace
              : rq.metadata.namespace
          }
          className="co-resource-item__resource-name"
          dataTest="resource-quota-link"
        />
      </TableData>
      <TableData
        className={classNames(tableColumnClasses[1], 'co-break-word')}
        columnID="namespace"
      >
        {rq.metadata.namespace ? (
          <ResourceLink kind="Namespace" name={rq.metadata.namespace} />
        ) : (
          t('public~None')
        )}
      </TableData>
      <TableData className={classNames(tableColumnClasses[2], 'co-break-word')}>
        <LabelList
          kind={appliedClusterQuotaReference}
          labels={rq.spec?.selector?.labels?.matchLabels}
        />
      </TableData>
      <TableData className={classNames(tableColumnClasses[3], 'co-break-word')}>
        <Selector selector={rq.spec?.selector?.annotations} namespace={customData.namespace} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[4], 'co-break-word')}>
        {resourcesAtQuota > 0 ? (
          <>
            <YellowExclamationTriangleIcon />{' '}
            {t('public~{{count}} resource reached quota', { count: resourcesAtQuota })}
          </>
        ) : (
          t('public~none are at quota')
        )}
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <Timestamp timestamp={rq.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[6]}>
        <ResourceKebab
          customData={customData}
          actions={actions}
          kind={referenceFor(rq)}
          resource={rq}
        />
      </TableData>
    </>
  );
};

const AppliedClusterResourceQuotaTableRow = ({ obj: rq, customData }) => {
  const { t } = useTranslation();
  const actions = quotaActions(rq, customData);
  const resourcesAtQuota = Object.keys(rq?.status?.total?.hard || {}).reduce(
    (acc, resource) =>
      getUsedPercentage(rq?.status?.total?.hard[resource], rq?.status?.total?.used?.[resource]) >=
      100
        ? acc + 1
        : acc,
    0,
  );
  return (
    <>
      <TableData className={acrqTableColumnClasses[0]}>
        <ResourceLink
          kind={appliedClusterQuotaReference}
          name={rq.metadata.name}
          namespace={customData.namespace}
          className="co-resource-item__resource-name"
        />
      </TableData>
      <TableData className={classNames(acrqTableColumnClasses[1], 'co-break-word')}>
        <LabelList
          kind={appliedClusterQuotaReference}
          labels={rq.spec?.selector?.labels?.matchLabels}
        />
      </TableData>
      <TableData className={classNames(acrqTableColumnClasses[2], 'co-break-word')}>
        <Selector selector={rq.spec?.selector?.annotations} namespace={customData.namespace} />
      </TableData>
      <TableData className={classNames(acrqTableColumnClasses[3], 'co-break-word')}>
        {resourcesAtQuota > 0 ? (
          <>
            <YellowExclamationTriangleIcon />{' '}
            {t('public~{{count}} resource reached quota', { count: resourcesAtQuota })}
          </>
        ) : (
          t('public~none are at quota')
        )}
      </TableData>
      <TableData className={acrqTableColumnClasses[4]}>
        <Timestamp timestamp={rq.metadata.creationTimestamp} />
      </TableData>
      <TableData className={acrqTableColumnClasses[5]}>
        <ResourceKebab
          customData={customData}
          actions={actions}
          kind={appliedClusterQuotaReference}
          resource={rq}
        />
      </TableData>
    </>
  );
};

export const ResourceQuotasList = (props) => {
  const { t } = useTranslation();
  const ResourceQuotaTableHeader = () => {
    return [
      {
        title: t('public~Name'),
        sortField: 'metadata.name',
        transforms: [sortable],
        props: { className: tableColumnClasses[0] },
      },
      {
        title: t('public~Namespace'),
        sortField: 'metadata.namespace',
        transforms: [sortable],
        props: { className: tableColumnClasses[1] },
        id: 'namespace',
      },
      {
        title: t('public~Label selector'),
        sortField: 'spec.selector.labels.matchLabels',
        transforms: [sortable],
        props: { className: tableColumnClasses[2] },
      },
      {
        title: t('public~Project annotations'),
        sortField: 'spec.selector.annotations',
        transforms: [sortable],
        props: { className: tableColumnClasses[3] },
      },
      {
        title: t('public~Status'),
        props: { className: tableColumnClasses[4] },
        transforms: [sortable],
      },
      {
        title: t('public~Created'),
        sortField: 'metadata.creationTimestamp',
        transforms: [sortable],
        props: { className: tableColumnClasses[5] },
      },
      {
        title: '',
        props: { className: tableColumnClasses[6] },
      },
    ];
  };
  return (
    <Table
      {...props}
      aria-label={t('public~ResourceQuotas')}
      Header={ResourceQuotaTableHeader}
      Row={ResourceQuotaTableRow}
      virtualize
      customData={{ namespace: props.namespace }}
    />
  );
};

export const AppliedClusterResourceQuotasList = (props) => {
  const { t } = useTranslation();
  const AppliedClusterResourceQuotaTableHeader = () => {
    return [
      {
        title: t('public~Name'),
        sortField: 'metadata.name',
        transforms: [sortable],
        props: { className: acrqTableColumnClasses[0] },
      },
      {
        title: t('public~Label selector'),
        sortField: 'spec.selector.labels.matchLabels',
        transforms: [sortable],
        props: { className: acrqTableColumnClasses[1] },
      },
      {
        title: t('public~Project annotations'),
        sortField: 'spec.selector.annotations',
        transforms: [sortable],
        props: { className: acrqTableColumnClasses[2] },
      },
      {
        title: t('public~Status'),
        props: { className: acrqTableColumnClasses[3] },
        transforms: [sortable],
      },
      {
        title: t('public~Created'),
        sortField: 'metadata.creationTimestamp',
        transforms: [sortable],
        props: { className: acrqTableColumnClasses[4] },
      },
      {
        title: '',
        props: { className: acrqTableColumnClasses[5] },
      },
    ];
  };
  return (
    <Table
      {...props}
      aria-label={t('public~AppliedClusterResourceQuotas')}
      Header={AppliedClusterResourceQuotaTableHeader}
      Row={AppliedClusterResourceQuotaTableRow}
      virtualize
      customData={{ namespace: props.namespace }}
    />
  );
};

export const quotaType = (quota) => {
  if (!quota) {
    return undefined;
  }
  return quota.metadata.namespace ? 'namespace' : 'cluster';
};

// Split each resource quota into one row per subject
export const flatten = (resources) => _.flatMap(resources, (resource) => _.compact(resource.data));

export const ResourceQuotasPage = connectToFlags(FLAGS.OPENSHIFT)(
  ({ namespace, flags, mock, showTitle }) => {
    const { t } = useTranslation();
    const resources = [{ kind: 'ResourceQuota', namespaced: true }];
    let rowFilters = null;

    if (flagPending(flags[FLAGS.OPENSHIFT])) {
      return <LoadingBox />;
    }
    if (flags[FLAGS.OPENSHIFT]) {
      if (!namespace) {
        resources.push({
          kind: referenceForModel(ClusterResourceQuotaModel),
          namespaced: false,
          optional: true,
        });
      } else {
        resources.push({
          kind: referenceForModel(AppliedClusterResourceQuotaModel),
          namespaced: true,
          namespace,
          optional: true,
        });
      }

      rowFilters = [
        {
          filterGroupName: t('public~Role'),
          type: 'role-kind',
          reducer: quotaType,
          items: [
            {
              id: 'cluster',
              title: t('public~Cluster-wide {{resource}}', {
                resource: t(ResourceQuotaModel.labelPluralKey),
              }),
            },
            {
              id: 'namespace',
              title: t('public~Namespace {{resource}}', {
                resource: t(ResourceQuotaModel.labelPluralKey),
              }),
            },
          ],
        },
      ];
    }
    const createNS = namespace || 'default';
    const accessReview = {
      model: ResourceQuotaModel,
      namespace: createNS,
    };
    return (
      <MultiListPage
        canCreate={true}
        createAccessReview={accessReview}
        createButtonText={t('public~Create ResourceQuota')}
        createProps={{ to: `/k8s/ns/${createNS}/resourcequotas/~new` }}
        ListComponent={ResourceQuotasList}
        resources={resources}
        label={t(ResourceQuotaModel.labelPluralKey)}
        namespace={namespace}
        flatten={flatten}
        title={t(ResourceQuotaModel.labelPluralKey)}
        rowFilters={rowFilters}
        mock={mock}
        showTitle={showTitle}
      />
    );
  },
);

export const AppliedClusterResourceQuotasPage = ({ namespace, mock, showTitle }) => {
  const { t } = useTranslation();
  const resources = [
    {
      kind: referenceForModel(AppliedClusterResourceQuotaModel),
      namespaced: true,
      namespace,
      optional: true,
    },
  ];

  return (
    <MultiListPage
      ListComponent={AppliedClusterResourceQuotasList}
      resources={resources}
      label={t(AppliedClusterResourceQuotaModel.labelPluralKey)}
      namespace={namespace}
      flatten={flatten}
      title={t(AppliedClusterResourceQuotaModel.labelPluralKey)}
      mock={mock}
      showTitle={showTitle}
    />
  );
};

export const ResourceQuotasDetailsPage = (props) => {
  return (
    <DetailsPage
      {...props}
      menuActions={resourceQuotaMenuActions}
      pages={[navFactory.details(Details), navFactory.editYaml()]}
    />
  );
};

export const AppliedClusterResourceQuotasDetailsPage = (props) => {
  const { match } = props;
  const actions = appliedClusterResourceQuotaMenuActions(match?.params?.ns);
  return (
    <DetailsPage
      {...props}
      menuActions={actions}
      pages={[navFactory.details(Details), navFactory.editYaml()]}
    />
  );
};
