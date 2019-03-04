import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { FieldLevelHelp } from 'patternfly-react';

import { ColHead, DetailsPage, List, ListHeader, MultiListPage } from './factory';
import { Kebab, SectionHeading, navFactory, ResourceKebab, ResourceLink, ResourceSummary, convertToBaseValue } from './utils';
import { FLAGS, connectToFlags, flagPending } from '../features';
import { Gauge } from './graphs';
import { LoadingBox } from './utils/status-box';
import { referenceForModel } from '../module/k8s';
import { ResourceQuotaModel, ClusterResourceQuotaModel } from '../models';

const { common } = Kebab.factory;
const menuActions = [...common];

const quotaKind = quota => quota.metadata.namespace ? referenceForModel(ResourceQuotaModel) : referenceForModel(ClusterResourceQuotaModel);
const gaugeChartThresholds = {warn: 90, error: 101};
const gaugeChartNoThresholds = {warn: 100, error: 100};

const quotaScopes = Object.freeze({
  'Terminating': {label: 'Terminating', description: 'Affects pods that have an active deadline. These pods usually include builds, deployers, and jobs.'},
  'NotTerminating': {label: 'Not Terminating', description: 'Affects pods that do not have an active deadline. These pods usually include your applications.'},
  'BestEffort': {label: 'Best Effort', description: 'Affects pods that do not have resource limits set. These pods have a best effort quality of service.'},
  'NotBestEffort': {label: 'Not Best Effort', description: 'Affects pods that have at least one resource limit set. These pods do not have a best effort quality of service.'},
});

export const getQuotaResourceTypes = (quota) => {
  const specHard = _.get(quota, 'spec.hard');
  return _.keys(specHard).sort();
};

const getResourceUsage = (quota, resourceType) => {
  const max = _.get(quota, ['status', 'hard', resourceType]) || _.get(quota, ['spec', 'hard', resourceType]);
  const used = _.get(quota, ['status', 'used', resourceType]);
  const percent = (!max || !used) ? 0 : convertToBaseValue(used) / convertToBaseValue(max) * 100;
  return {
    used,
    max,
    percent,
  };
};

const Header = props => <ListHeader>
  <ColHead {...props} className="col-md-5 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-md-7 col-xs-6" sortField="metadata.namespace">Namespace</ColHead>
</ListHeader>;

const Row = ({obj: rq}) => <div className="row co-resource-list__item">
  <div className="col-md-5 col-xs-6">
    <ResourceLink kind={quotaKind(rq)} name={rq.metadata.name} namespace={rq.metadata.namespace} className="co-resource-link__resource-name" />
  </div>
  <div className="col-md-7 col-xs-6 co-break-word">
    {rq.metadata.namespace ? <ResourceLink kind="Namespace" name={rq.metadata.namespace} title={rq.metadata.namespace} /> : 'None'}
  </div>
  <div className="dropdown-kebab-pf">
    <ResourceKebab actions={menuActions} kind={quotaKind(rq)} resource={rq} />
  </div>
</div>;

const UsageIcon = ({percent}) => {
  let usageIconClass = 'pficon pficon-unknown';
  if (percent === 0) {
    usageIconClass = 'fa fa-circle-thin co-resource-quota-empty';
  } else if (percent > 0 && percent < 50) {
    usageIconClass = 'pficon pficon-resources-almost-empty';
  } else if (percent >= 50 && percent < 100){
    usageIconClass = 'pficon pficon-resources-almost-full';
  } else if (percent === 100) {
    usageIconClass = 'pficon pficon-resources-full';
  } else if (percent > 100) {
    usageIconClass = 'pficon pficon-warning-triangle-o';
  }
  return <i className={usageIconClass} aria-hidden="true" />;
};

const ResourceUsageRow = ({quota, resourceType}) => {
  const { used, max, percent } = getResourceUsage(quota, resourceType);
  return <div className="row co-m-row">
    <div className="col-sm-4 col-xs-6 co-break-word">{resourceType}</div>
    <div className="col-sm-2 hidden-xs co-resource-quota-icon"><UsageIcon percent={percent} /></div>
    <div className="col-sm-3 col-xs-3">{used}</div>
    <div className="col-sm-3 col-xs-3">{max}</div>
  </div>;
};

export const QuotaGaugeCharts = ({quota, resourceTypes}) => {
  const resourceTypesSet = new Set(resourceTypes);
  return <div className="co-resource-quota-chart-row">
    {(resourceTypesSet.has('requests.cpu') || resourceTypesSet.has('cpu')) ?
      <div className="co-resource-quota-gauge-chart">
        <Gauge title="CPU Request" thresholds={gaugeChartThresholds}
          percent={getResourceUsage(quota, resourceTypesSet.has('requests.cpu') ? 'requests.cpu' : 'cpu').percent} />
      </div>
      :
      <div className="co-resource-quota-gauge-chart">
        <Gauge title="CPU Request" thresholds={gaugeChartNoThresholds} centerText="No Request" />
      </div>
    }
    {resourceTypesSet.has('limits.cpu') ?
      <div className="co-resource-quota-gauge-chart">
        <Gauge title="CPU Limit" thresholds={gaugeChartThresholds}
          percent={getResourceUsage(quota, 'limits.cpu').percent} />
      </div>
      :
      <div className="co-resource-quota-gauge-chart">
        <Gauge title="CPU Limit" thresholds={gaugeChartNoThresholds} centerText="No Limit" />
      </div>
    }
    {(resourceTypesSet.has('requests.memory') || resourceTypesSet.has('memory')) ?
      <div className="co-resource-quota-gauge-chart">
        <Gauge title="Memory Request" thresholds={gaugeChartThresholds}
          percent={getResourceUsage(quota, resourceTypesSet.has('requests.memory') ? 'requests.memory' : 'memory').percent} />
      </div>
      :
      <div className="co-resource-quota-gauge-chart">
        <Gauge title="Memory Request" thresholds={gaugeChartNoThresholds} centerText="No Request" />
      </div>
    }
    {resourceTypesSet.has('limits.memory') ?
      <div className="co-resource-quota-gauge-chart">
        <Gauge title="Memory Limit" thresholds={gaugeChartThresholds}
          percent={getResourceUsage(quota, 'limits.memory').percent} />
      </div>
      :
      <div className="co-resource-quota-gauge-chart">
        <Gauge title="Memory Limit" thresholds={gaugeChartNoThresholds} centerText="No Limit" />
      </div>
    }
  </div>;
};

export const QuotaScopesInline = ({scopes, className}) => {
  return <span className={classNames(className)}>(
    {scopes.map(scope => {
      const scopeObj = _.get(quotaScopes, scope);
      return scopeObj ? scopeObj.label : scope;
    }).join(',')})
  </span>;
};

export const QuotaScopesList = ({scopes}) => {
  return scopes.map(scope => {
    const scopeObj = _.get(quotaScopes, scope);
    return scopeObj ?
      <dd key={scope}>
        <div className="co-resource-quota-scope__label">{scopeObj.label}</div>
        <div className="co-resource-quota-scope__description">{scopeObj.description}</div>
      </dd>
      : <dd key={scope} className="co-resource-quota-scope__label">{scope}</dd>;
  });
};

export const hasComputeResources = resourceTypes => {
  const chartResourceTypes = ['requests.cpu', 'cpu', 'limits.cpu', 'requests.memory', 'memory', 'limits.memory'];
  return _.intersection(resourceTypes, chartResourceTypes).length > 0;
};

const Details = ({obj: rq}) => {
  const resourceTypes = getQuotaResourceTypes(rq);
  const showChartRow = hasComputeResources(resourceTypes);
  const scopes = _.get(rq, ['spec', 'scopes']);
  return <React.Fragment>
    <div className="co-m-pane__body">
      <SectionHeading text="Resource Quota Overview" />
      {showChartRow && <QuotaGaugeCharts quota={rq} resourceTypes={resourceTypes} />}
      <div className="row">
        <div className="col-sm-6">
          <ResourceSummary resource={rq} showPodSelector={false} showNodeSelector={false} />
        </div>
        {scopes && <div className="col-sm-6">
          <dl className="co-m-pane__details">
            <dt>Scopes</dt>
            <QuotaScopesList scopes={scopes} />
          </dl>
        </div>}
      </div>
    </div>
    <div className="co-m-pane__body">
      <SectionHeading text="Resource Quota Details" style={{display: 'block', marginBottom: '20px'}}>
        <FieldLevelHelp content={
          <div>
            <p>Requests are the amount of resources you expect to use. These are used when establishing if the cluster can fulfill your Request.</p>
            <p>Limits are a maximum amount of a resource you can consume. Applications consuming more than the Limit may be terminated.</p>
            <p>A cluster administrator can establish limits on both the amount you can Request and your Limits with a Resource Quota.</p>
          </div>
        } />
      </SectionHeading>
      <div className="co-m-table-grid co-m-table-grid--bordered">
        <div className="row co-m-table-grid__head">
          <div className="col-sm-4 col-xs-6">Resource Type</div>
          <div className="col-sm-2 hidden-xs">Capacity</div>
          <div className="col-sm-3 col-xs-3">Used</div>
          <div className="col-sm-3 col-xs-3">Max</div>
        </div>
        <div className="co-m-table-grid__body">
          {resourceTypes.map(type => <ResourceUsageRow key={type} quota={rq} resourceType={type} />)}
        </div>
      </div>
    </div>
  </React.Fragment>;
};

export const ResourceQuotasList = props => <List {...props} Header={Header} Row={Row} />;

export const quotaType = quota => {
  if (!quota) {
    return undefined;
  }
  return quota.metadata.namespace ? 'namespace' : 'cluster';
};

// Split each resource quota into one row per subject
export const flatten = resources => _.flatMap(resources, resource => _.compact(resource.data));

export const ResourceQuotasPage = connectToFlags(FLAGS.OPENSHIFT)(({namespace, flags}) => {

  const resources = [{kind: 'ResourceQuota', namespaced: true}];
  let rowFilters = null;

  if (flagPending(flags[FLAGS.OPENSHIFT])) {
    return <LoadingBox />;
  }
  if (flags[FLAGS.OPENSHIFT]) {
    resources.push({kind: 'ClusterResourceQuota', namespaced: false, optional: true});
    rowFilters = [{
      type: 'role-kind',
      selected: ['cluster', 'namespace'],
      reducer: quotaType,
      items: [
        {id: 'cluster', title: 'Cluster-wide Resource Quotas'},
        {id: 'namespace', title: 'Namespace Resource Quotas'},
      ],
    }];
  }
  return <MultiListPage
    canCreate={true}
    createButtonText="Create Resource Quota"
    createProps={{to: `/k8s/ns/${namespace || 'default'}/resourcequotas/new`}}
    ListComponent={ResourceQuotasList}
    resources={resources}
    filterLabel="Resource Quotas by name"
    label="Resource Quotas"
    namespace={namespace}
    flatten={flatten}
    title="Resource Quotas"
    rowFilters={rowFilters}
  />;
});

export const ResourceQuotasDetailsPage = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  pages={[navFactory.details(Details), navFactory.editYaml()]}
/>;
