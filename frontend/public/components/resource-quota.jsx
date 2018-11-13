import * as _ from 'lodash-es';
import * as React from 'react';

import { ColHead, DetailsPage, List, ListHeader, MultiListPage } from './factory';
import { Kebab, SectionHeading, navFactory, ResourceKebab, ResourceLink, ResourceSummary, convertToBaseValue } from './utils';
import { FLAGS, connectToFlags, flagPending } from '../features';
import { LoadingBox } from './utils/status-box';
import { referenceForModel } from '../module/k8s';
import { ResourceQuotaModel, ClusterResourceQuotaModel } from '../models';

const { common } = Kebab.factory;
const menuActions = [...common];

const quotaKind = quota => quota.metadata.namespace ? referenceForModel(ResourceQuotaModel) : referenceForModel(ClusterResourceQuotaModel);

const compareResourceType = (left, right) => {
  const regex = /\.|\//; //find object types delimited by '.' or '/'. Ex: '.cpu', '.memory', or '/persistentvolumeclaims'
  left = left.match(regex) ? left.split(regex).reverse().join('') : left;
  right = right.match(regex) ? right.split(regex).reverse().join('') : right;
  return left.localeCompare(right, 'en', {sensitivity: 'base'});
};

const getResourceTypes = (quota) => {
  const specHard = _.get(quota, 'spec.hard');
  return _.keys(specHard).sort(compareResourceType);
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
    {rq.metadata.namespace ? <ResourceLink kind="Namespace" name={rq.metadata.namespace} title={rq.metadata.namespace} /> : 'all'}
  </div>
  <div className="dropdown-kebab-pf">
    <ResourceKebab actions={menuActions} kind={quotaKind(rq)} resource={rq} />
  </div>
</div>;

const UsageIcon = ({capacity}) => {
  let capacityIconClass = 'pficon pficon-unknown';
  if (capacity === 0) {
    capacityIconClass = 'fa fa-circle-thin co-resource-quota-empty';
  } else if (capacity > 0 && capacity < .5) {
    capacityIconClass = 'pficon pficon-resources-almost-empty';
  } else if (capacity >= .5 && capacity < 1){
    capacityIconClass = 'pficon pficon-resources-almost-full';
  } else if (capacity === 1) {
    capacityIconClass = 'pficon pficon-resources-full';
  } else if (capacity > 1) {
    capacityIconClass = 'pficon pficon-warning-triangle-o';
  }
  return <i className={capacityIconClass} aria-hidden="true" />;
};

const getDecimalUsage = (used, max) => {
  let capacity = 0;
  if (max && used) {
    const usedNum = convertToBaseValue(used);
    const maxNum = convertToBaseValue(max);
    capacity = usedNum / maxNum;
  }
  return capacity;
};

const ResourceUsageRow = ({quota, resourceType}) => {
  const max = _.get(quota, ['status', 'hard', resourceType]) || _.get(quota, ['spec', 'hard', resourceType]);
  const used = _.get(quota, ['status', 'used', resourceType]);
  const capacity = getDecimalUsage(used, max);
  return <div className="row">
    <div className="col-xs-4">{resourceType}</div>
    <div className="col-xs-2 co-resource-quota-icon"><UsageIcon capacity={capacity} /></div>
    <div className="col-xs-3">{used}</div>
    <div className="col-xs-3">{max}</div>
  </div>;
};

const Details = ({obj: rq}) => <React.Fragment>
  <div className="co-m-pane__body">
    <SectionHeading text="Resource Quota Overview" />
    <ResourceSummary resource={rq} podSelector="spec.podSelector" showNodeSelector={false} />
  </div>
  <div className="co-m-pane__body">
    <SectionHeading text="Resource Usage" />
    <div className="row">
      <div className="co-m-table-grid co-m-table-grid--bordered">
        <div className="row co-m-table-grid__head">
          <div className="col-xs-4">Resource Type</div>
          <div className="col-xs-2">Capacity</div>
          <div className="col-xs-3">Used</div>
          <div className="col-xs-3">Max</div>
        </div>
        <div className="co-m-table-grid__body">
          {getResourceTypes(rq).map(type => <ResourceUsageRow key={type} quota={rq} resourceType={type} />)}
        </div>
      </div>
    </div>
  </div>
</React.Fragment>;

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
