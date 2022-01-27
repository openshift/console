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
import { GaugeChart } from './graphs/gauge';
import { DonutChart } from './graphs/donut';
import { LoadingBox } from './utils/status-box';
import { referenceFor, referenceForModel } from '../module/k8s';
import {
  AppliedClusterResourceQuotaModel,
  ResourceQuotaModel,
  ClusterResourceQuotaModel,
} from '../models';

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

const gaugeChartThresholds = [{ value: 90 }, { value: 101 }];

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
  Kebab.columnClass,
];

const acrqTableColumnClasses = ['', '', '', '', Kebab.columnClass];

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

const NoQuotaGauge = ({ title, className }) => {
  const { t } = useTranslation();
  return (
    <GaugeChart
      error={t('public~No quota')}
      thresholds={[{ value: 100 }]}
      title={title}
      className={className}
    />
  );
};

export const QuotaGaugeCharts = ({
  quota,
  resourceTypes,
  chartClassName = null,
  namespace = undefined,
}) => {
  const reference = referenceFor(quota);
  const isACRQ = reference === appliedClusterQuotaReference;
  const resourceTypesSet = new Set(resourceTypes);
  const { t } = useTranslation();

  if (isACRQ) {
    const cpuRequestUsagePercent = getACRQResourceUsage(
      quota,
      resourceTypesSet.has('requests.cpu') ? 'requests.cpu' : 'cpu',
      namespace,
    ).percent;
    const cpuLimitUsagePercent = getACRQResourceUsage(quota, 'limits.cpu', namespace).percent;
    const memoryRequestUsagePercent = getACRQResourceUsage(
      quota,
      resourceTypesSet.has('requests.memory') ? 'requests.memory' : 'memory',
      namespace,
    ).percent;
    const memoryLimitUsagePercent = getACRQResourceUsage(quota, 'limits.memory', namespace).percent;

    return (
      <div className="co-resource-quota-chart-row">
        {resourceTypesSet.has('requests.cpu') || resourceTypesSet.has('cpu') ? (
          <div className="co-resource-quota-gauge-chart" data-test="resource-quota-gauge-chart">
            <DonutChart
              ariaDescription={t(
                'public~Percentage of CPU used by current namespace vs. other namespaces',
              )}
              className={chartClassName}
              data={[
                {
                  x: 'Namespace',
                  y: cpuRequestUsagePercent.namespace,
                },
                {
                  x: 'Other namespaces',
                  y: cpuRequestUsagePercent.otherNamespaces,
                },
                {
                  x: 'Unused',
                  y: cpuRequestUsagePercent.unused,
                },
              ]}
              title={t('public~CPU request')}
              label={`${cpuRequestUsagePercent.namespace}%`}
            />
          </div>
        ) : (
          <div className="co-resource-quota-gauge-chart">
            <NoQuotaGauge title={t('public~CPU request')} />
          </div>
        )}
        {resourceTypesSet.has('limits.cpu') ? (
          <div className="co-resource-quota-gauge-chart" data-test="resource-quota-gauge-chart">
            <DonutChart
              ariaDescription={t(
                'public~Percentage of CPU limit used by current namespace vs. other namespaces',
              )}
              className={chartClassName}
              data={[
                {
                  x: 'Namespace',
                  y: cpuLimitUsagePercent.namespace,
                },
                {
                  x: 'Other namespaces',
                  y: cpuLimitUsagePercent.otherNamespaces,
                },
                {
                  x: 'Unused',
                  y: cpuLimitUsagePercent.unused,
                },
              ]}
              title={t('public~CPU limit')}
              label={`${cpuLimitUsagePercent.namespace}%`}
            />
          </div>
        ) : (
          <div className="co-resource-quota-gauge-chart">
            <NoQuotaGauge title={t('public~CPU limit')} className={chartClassName} />
          </div>
        )}
        {resourceTypesSet.has('requests.memory') || resourceTypesSet.has('memory') ? (
          <div className="co-resource-quota-gauge-chart" data-test="resource-quota-gauge-chart">
            <DonutChart
              ariaDescription={t(
                'public~Percentage of memory requests used by current namespace vs. other namespaces',
              )}
              className={chartClassName}
              data={[
                {
                  x: 'Namespace',
                  y: memoryRequestUsagePercent.namespace,
                },
                {
                  x: 'Other namespaces',
                  y: memoryRequestUsagePercent.otherNamespaces,
                },
                {
                  x: 'Unused',
                  y: memoryRequestUsagePercent.unused,
                },
              ]}
              title={t('public~Memory request')}
              label={`${memoryRequestUsagePercent.namespace}%`}
            />
          </div>
        ) : (
          <div className="co-resource-quota-gauge-chart">
            <NoQuotaGauge title={t('public~Memory request')} className={chartClassName} />
          </div>
        )}
        {resourceTypesSet.has('limits.memory') ? (
          <div className="co-resource-quota-gauge-chart" data-test="resource-quota-gauge-chart">
            <DonutChart
              ariaDescription={t(
                'public~Percentage of memory limits used by current namespace vs. other namespaces',
              )}
              className={chartClassName}
              data={[
                {
                  x: 'Namespace',
                  y: memoryLimitUsagePercent.namespace,
                },
                {
                  x: 'Other namespaces',
                  y: memoryLimitUsagePercent.otherNamespaces,
                },
                {
                  x: 'Unused',
                  y: memoryLimitUsagePercent.unused,
                },
              ]}
              title={t('public~Memory limit')}
              label={`${memoryLimitUsagePercent.namespace}%`}
            />
          </div>
        ) : (
          <div className="co-resource-quota-gauge-chart">
            <NoQuotaGauge title={t('public~Memory limit')} className={chartClassName} />
          </div>
        )}
      </div>
    );
  }
  const cpuRequestUsagePercent = getResourceUsage(
    quota,
    resourceTypesSet.has('requests.cpu') ? 'requests.cpu' : 'cpu',
  ).percent;
  const cpuLimitUsagePercent = getResourceUsage(quota, 'limits.cpu').percent;
  const memoryRequestUsagePercent = getResourceUsage(
    quota,
    resourceTypesSet.has('requests.memory') ? 'requests.memory' : 'memory',
  ).percent;
  const memoryLimitUsagePercent = getResourceUsage(quota, 'limits.memory').percent;

  return (
    <div className="co-resource-quota-chart-row">
      {resourceTypesSet.has('requests.cpu') || resourceTypesSet.has('cpu') ? (
        <div className="co-resource-quota-gauge-chart" data-test="resource-quota-gauge-chart">
          <GaugeChart
            data={{
              x: `${cpuRequestUsagePercent}%`,
              y: cpuRequestUsagePercent,
            }}
            thresholds={gaugeChartThresholds}
            title={t('public~CPU request')}
            className={chartClassName}
          />
        </div>
      ) : (
        <div className="co-resource-quota-gauge-chart">
          <NoQuotaGauge title={t('public~CPU request')} />
        </div>
      )}
      {resourceTypesSet.has('limits.cpu') ? (
        <div className="co-resource-quota-gauge-chart" data-test="resource-quota-gauge-chart">
          <GaugeChart
            data={{ x: `${cpuLimitUsagePercent}%`, y: cpuLimitUsagePercent }}
            thresholds={gaugeChartThresholds}
            title={t('public~CPU limit')}
            className={chartClassName}
          />
        </div>
      ) : (
        <div className="co-resource-quota-gauge-chart">
          <NoQuotaGauge title={t('public~CPU limit')} className={chartClassName} />
        </div>
      )}
      {resourceTypesSet.has('requests.memory') || resourceTypesSet.has('memory') ? (
        <div className="co-resource-quota-gauge-chart" data-test="resource-quota-gauge-chart">
          <GaugeChart
            data={{
              x: `${memoryRequestUsagePercent}%`,
              y: memoryRequestUsagePercent,
            }}
            thresholds={gaugeChartThresholds}
            title={t('public~Memory request')}
            className={chartClassName}
          />
        </div>
      ) : (
        <div className="co-resource-quota-gauge-chart">
          <NoQuotaGauge title={t('public~Memory request')} className={chartClassName} />
        </div>
      )}
      {resourceTypesSet.has('limits.memory') ? (
        <div className="co-resource-quota-gauge-chart" data-test="resource-quota-gauge-chart">
          <GaugeChart
            data={{ x: `${memoryLimitUsagePercent}%`, y: memoryLimitUsagePercent }}
            thresholds={gaugeChartThresholds}
            title={t('public~Memory limit')}
            className={chartClassName}
          />
        </div>
      ) : (
        <div className="co-resource-quota-gauge-chart">
          <NoQuotaGauge title={t('public~Memory limit')} className={chartClassName} />
        </div>
      )}
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
  const showChartRow = hasComputeResources(resourceTypes);
  const scopes = rq.spec?.scopes ?? rq.spec?.quota?.scopes;
  const reference = referenceFor(rq);
  const isACRQ = reference === appliedClusterQuotaReference;
  const namespace = match?.params?.ns;
  let text;
  switch (reference) {
    case appliedClusterQuotaReference:
      text = t('public~AppliedClusterResourceQuota details');
      break;
    case clusterQuotaReference:
      text = t('public~ClusterResourceQuota details');
      break;
    default:
      text = t('public~ResourceQuota details');
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
        {showChartRow && (
          <QuotaGaugeCharts quota={rq} resourceTypes={resourceTypes} namespace={namespace} />
        )}
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
      <TableData className={tableColumnClasses[4]}>
        <Timestamp timestamp={rq.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
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
  const actions = quotaActions(rq, customData);
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
      <TableData className={acrqTableColumnClasses[3]}>
        <Timestamp timestamp={rq.metadata.creationTimestamp} />
      </TableData>
      <TableData className={acrqTableColumnClasses[4]}>
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
        title: t('public~Created'),
        sortField: 'metadata.creationTimestamp',
        transforms: [sortable],
        props: { className: tableColumnClasses[4] },
      },
      {
        title: '',
        props: { className: tableColumnClasses[5] },
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
        title: t('public~Created'),
        sortField: 'metadata.creationTimestamp',
        transforms: [sortable],
        props: { className: acrqTableColumnClasses[3] },
      },
      {
        title: '',
        props: { className: acrqTableColumnClasses[4] },
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
