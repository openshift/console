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
import { DetailsPage, MultiListPage, Table, TableRow, TableData } from './factory';
import {
  Kebab,
  SectionHeading,
  navFactory,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  convertToBaseValue,
  FieldLevelHelp,
} from './utils';
import { connectToFlags, flagPending } from '../reducers/features';
import { GaugeChart } from './graphs/gauge';
import { LoadingBox } from './utils/status-box';
import { referenceForModel } from '../module/k8s';
import { ResourceQuotaModel, ClusterResourceQuotaModel } from '../models';

const { common } = Kebab.factory;
const resourceQuotaMenuActions = [
  ...Kebab.getExtensionsActionsForKind(ResourceQuotaModel),
  ...common,
];
const clusterResourceQuotaMenuActions = [
  ...Kebab.getExtensionsActionsForKind(ClusterResourceQuotaModel),
  ...common,
];

const isClusterQuota = (quota) => !quota.metadata.namespace;

const quotaKind = (quota) =>
  isClusterQuota(quota)
    ? referenceForModel(ClusterResourceQuotaModel)
    : referenceForModel(ResourceQuotaModel);
const quotaActions = (quota) =>
  quota.metadata.namespace ? resourceQuotaMenuActions : clusterResourceQuotaMenuActions;
const gaugeChartThresholds = [{ value: 90 }, { value: 101 }];

export const getQuotaResourceTypes = (quota) => {
  const specHard = isClusterQuota(quota)
    ? _.get(quota, 'spec.quota.hard')
    : _.get(quota, 'spec.hard');
  return _.keys(specHard).sort();
};

const getResourceUsage = (quota, resourceType) => {
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
  classNames('col-md-5', 'col-xs-6'),
  classNames('col-md-7', 'col-xs-6'),
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

export const ResourceUsageRow = ({ quota, resourceType }) => {
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

const NoQuotaGuage = ({ title, className }) => {
  const { t } = useTranslation();
  return (
    <GaugeChart
      error={t('resource-quota~No quota')}
      thresholds={[{ value: 100 }]}
      title={title}
      className={className}
    />
  );
};

export const QuotaGaugeCharts = ({ quota, resourceTypes, chartClassName = null }) => {
  const resourceTypesSet = new Set(resourceTypes);
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
  const { t } = useTranslation();
  return (
    <div className="co-resource-quota-chart-row">
      {resourceTypesSet.has('requests.cpu') || resourceTypesSet.has('cpu') ? (
        <div className="co-resource-quota-gauge-chart">
          <GaugeChart
            data={{
              x: `${cpuRequestUsagePercent}%`,
              y: cpuRequestUsagePercent,
            }}
            thresholds={gaugeChartThresholds}
            title={t('resource-quota~CPU request')}
            className={chartClassName}
          />
        </div>
      ) : (
        <div className="co-resource-quota-gauge-chart">
          <NoQuotaGuage title={t('resource-quota~CPU request')} />
        </div>
      )}
      {resourceTypesSet.has('limits.cpu') ? (
        <div className="co-resource-quota-gauge-chart">
          <GaugeChart
            data={{ x: `${cpuLimitUsagePercent}%`, y: cpuLimitUsagePercent }}
            thresholds={gaugeChartThresholds}
            title={t('resource-quota~CPU limit')}
            className={chartClassName}
          />
        </div>
      ) : (
        <div className="co-resource-quota-gauge-chart">
          <NoQuotaGuage title={t('resource-quota~CPU limit')} className={chartClassName} />
        </div>
      )}
      {resourceTypesSet.has('requests.memory') || resourceTypesSet.has('memory') ? (
        <div className="co-resource-quota-gauge-chart">
          <GaugeChart
            data={{
              x: `${memoryRequestUsagePercent}%`,
              y: memoryRequestUsagePercent,
            }}
            thresholds={gaugeChartThresholds}
            title={t('resource-quota~Memory request')}
            className={chartClassName}
          />
        </div>
      ) : (
        <div className="co-resource-quota-gauge-chart">
          <NoQuotaGuage title={t('resource-quota~Memory request')} className={chartClassName} />
        </div>
      )}
      {resourceTypesSet.has('limits.memory') ? (
        <div className="co-resource-quota-gauge-chart">
          <GaugeChart
            data={{ x: `${memoryLimitUsagePercent}%`, y: memoryLimitUsagePercent }}
            thresholds={gaugeChartThresholds}
            title={t('resource-quota~Memory limit')}
            className={chartClassName}
          />
        </div>
      ) : (
        <div className="co-resource-quota-gauge-chart">
          <NoQuotaGuage title={t('resource-quota~Memory limit')} className={chartClassName} />
        </div>
      )}
    </div>
  );
};

export const QuotaScopesInline = ({ scopes, className }) => {
  return <span className={classNames(className)}>({scopes.join(', ')})</span>;
};

export const QuotaScopesList = ({ scopes }) => {
  const { t } = useTranslation();
  const quotaScopes = {
    Terminating: {
      description: t(
        'resource-quota~Affects pods that have an active deadline. These pods usually include builds, deployers, and jobs.',
      ),
    },
    NotTerminating: {
      description: t(
        'resource-quota~Affects pods that do not have an active deadline. These pods usually include your applications.',
      ),
    },
    BestEffort: {
      description: t(
        'resource-quota~Affects pods that do not have resource limits set. These pods have a best effort quality of service.',
      ),
    },
    NotBestEffort: {
      description: t(
        'resource-quota~Affects pods that have at least one resource limit set. These pods do not have a best effort quality of service.',
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

const Details = ({ obj: rq }) => {
  const { t } = useTranslation();
  const resourceTypes = getQuotaResourceTypes(rq);
  const showChartRow = hasComputeResources(resourceTypes);
  const scopes = _.get(rq, ['spec', 'scopes']);
  const label = isClusterQuota(rq) ? ClusterResourceQuotaModel.label : ResourceQuotaModel.label;
  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={t('resource-quota~{{resource}} details', { resource: label })} />
        {showChartRow && <QuotaGaugeCharts quota={rq} resourceTypes={resourceTypes} />}
        <div className="row">
          <div className="col-sm-6">
            <ResourceSummary resource={rq} />
          </div>
          {scopes && (
            <div className="col-sm-6">
              <dl className="co-m-pane__details">
                <dt>{t('resource-quota~Scopes')}</dt>
                <QuotaScopesList scopes={scopes} />
              </dl>
            </div>
          )}
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading
          text={t('resource-quota~{{resource}} details', { resource: label })}
          style={{ display: 'block', marginBottom: '20px' }}
        >
          <FieldLevelHelp>
            <p>
              {t(
                'resource-quota~Requests are the amount of resources you expect to use. These are used when establishing if the cluster can fulfill your Request.',
              )}
            </p>
            <p>
              {t(
                'resource-quota~Limits are a maximum amount of a resource you can consume. Applications consuming more than the Limit may be terminated.',
              )}
            </p>
            <p>
              {`${t(
                'resource-quota~A cluster administrator can establish limits on both the amount you can Request and your Limits with a',
              )} ${ResourceQuotaModel.label}${t('resource-quota~.')}`}
            </p>
          </FieldLevelHelp>
        </SectionHeading>
        <div className="co-m-table-grid co-m-table-grid--bordered">
          <div className="row co-m-table-grid__head">
            <div className="col-sm-4 col-xs-6">{t('resource-quota~Resource type')}</div>
            <div className="col-sm-2 hidden-xs">{t('resource-quota~Capacity')}</div>
            <div className="col-sm-3 col-xs-3">{t('resource-quota~Used')}</div>
            <div className="col-sm-3 col-xs-3">{t('resource-quota~Max')}</div>
          </div>
          <div className="co-m-table-grid__body">
            {resourceTypes.map((type) => (
              <ResourceUsageRow key={type} quota={rq} resourceType={type} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export const ResourceQuotasList = (props) => {
  const { t } = useTranslation();
  const ResourceQuotaTableHeader = () => {
    return [
      {
        title: t('resource-quota~Name'),
        sortField: 'metadata.name',
        transforms: [sortable],
        props: { className: tableColumnClasses[0] },
      },
      {
        title: t('resource-quota~Namespace'),
        sortField: 'metadata.namespace',
        transforms: [sortable],
        props: { className: tableColumnClasses[1] },
        id: 'namespace',
      },
      {
        title: '',
        props: { className: tableColumnClasses[2] },
      },
    ];
  };
  const ResourceQuotaTableRow = ({ obj: rq, index, key, style }) => {
    return (
      <TableRow id={rq.metadata.uid} index={index} trKey={key} style={style}>
        <TableData className={tableColumnClasses[0]}>
          <ResourceLink
            kind={quotaKind(rq)}
            name={rq.metadata.name}
            namespace={rq.metadata.namespace}
            className="co-resource-item__resource-name"
          />
        </TableData>
        <TableData
          className={classNames(tableColumnClasses[1], 'co-break-word')}
          columnID="namespace"
        >
          {rq.metadata.namespace ? (
            <ResourceLink
              kind="Namespace"
              name={rq.metadata.namespace}
              title={rq.metadata.namespace}
            />
          ) : (
            t('resource-quota~None')
          )}
        </TableData>
        <TableData className={tableColumnClasses[2]}>
          <ResourceKebab actions={quotaActions(rq)} kind={quotaKind(rq)} resource={rq} />
        </TableData>
      </TableRow>
    );
  };
  return (
    <Table
      {...props}
      aria-label={ResourceQuotaModel.labelPlural}
      Header={ResourceQuotaTableHeader}
      Row={ResourceQuotaTableRow}
      virtualize
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
      resources.push({
        kind: referenceForModel(ClusterResourceQuotaModel),
        namespaced: false,
        optional: true,
      });
      rowFilters = [
        {
          filterGroupName: t('resource-quota~Role'),
          type: 'role-kind',
          reducer: quotaType,
          items: [
            {
              id: 'cluster',
              title: t('resource-quota~Cluster-wide {{resource}}', {
                resource: ResourceQuotaModel.labelPlural,
              }),
            },
            {
              id: 'namespace',
              title: t('resource-quota~Namespace {{resource}}', {
                resource: ResourceQuotaModel.labelPlural,
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
        createButtonText={t('resource-quota~Create {{resource}}', {
          resource: ResourceQuotaModel.label,
        })}
        createProps={{ to: `/k8s/ns/${createNS}/resourcequotas/~new` }}
        ListComponent={ResourceQuotasList}
        resources={resources}
        label={ResourceQuotaModel.labelPlural}
        namespace={namespace}
        flatten={flatten}
        title={ResourceQuotaModel.labelPlural}
        rowFilters={rowFilters}
        mock={mock}
        showTitle={showTitle}
      />
    );
  },
);

export const ResourceQuotasDetailsPage = (props) => (
  <DetailsPage
    {...props}
    menuActions={resourceQuotaMenuActions}
    pages={[navFactory.details(Details), navFactory.editYaml()]}
  />
);
