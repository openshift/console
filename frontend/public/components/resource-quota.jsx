import * as _ from 'lodash-es';
import * as React from 'react';

import { referenceForModel } from '../module/k8s';
import { ResourceQuotaModel, ClusterResourceQuotaModel } from '../models';
import { ColHead, DetailsPage, List, ListHeader, MultiListPage } from './factory';
import { Cog, SectionHeading, navFactory, ResourceCog, ResourceLink, ResourceSummary } from './utils';

const menuActions = [Cog.factory.ModifyLabels, Cog.factory.ModifyAnnotations, Cog.factory.Edit, Cog.factory.Delete];

const quotaKind = quota => quota.metadata.namespace ? referenceForModel(ResourceQuotaModel) : referenceForModel(ClusterResourceQuotaModel);

const Header = props => <ListHeader>
  <ColHead {...props} className="col-md-5 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-md-7 col-xs-6" sortField="metadata.namespace">Namespace</ColHead>
</ListHeader>;

const Row = ({obj: rq}) => <div className="row co-resource-list__item">
  <div className="col-md-5 col-xs-6 co-resource-link-wrapper">
    <ResourceCog actions={menuActions} kind={quotaKind(rq)} resource={rq} />
    <ResourceLink kind={quotaKind(rq)} name={rq.metadata.name} namespace={rq.metadata.namespace} className="co-resource-link__resource-name" />
  </div>
  <div className="col-md-7 col-xs-6 co-break-word">
    {rq.metadata.namespace ? <ResourceLink kind="Namespace" name={rq.metadata.namespace} title={rq.metadata.namespace} /> : 'all'}
  </div>
</div>;

const Details = ({obj: rq}) => <React.Fragment>
  <div className="co-m-pane__body">
    <SectionHeading text="Resource Quota Overview" />
    <ResourceSummary resource={rq} podSelector="spec.podSelector" showNodeSelector={false} />
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
export const flatten = resources => _.flatMap(resources, resource => {
  const rows = [];

  _.each(resource.data, quota => {
    if (!quota) {
      return undefined;
    }
    rows.push(quota);
  });

  return rows;
});

export const ResourceQuotasPage = props => {
  const {match: {params: {name, ns}}} = props;
  let resources = [{kind: 'ResourceQuota', namespaced: true}, {kind: 'ClusterResourceQuota', namespaced: false, optional: true}];
  return <MultiListPage
    canCreate={true}
    createButtonText="Create Resource Quota"
    createProps={{to: '/k8s/ns/tectonic-system/resourcequotas/new'}}
    ListComponent={ResourceQuotasList}
    staticFilters={[{'resource-quota-roleRef': name}]}
    resources={resources}
    filterLabel="Resource Quotas by name"
    label="Resource Quotas"
    namespace={ns}
    flatten={flatten}
    title="Resource Quotas"
    rowFilters={[{
      type: 'role-kind',
      selected: ['cluster', 'namespace'],
      reducer: quotaType,
      items: [
        {id: 'cluster', title: 'Cluster-wide Resource Quotas'},
        {id: 'namespace', title: 'Namespace Resource Quotas'},
      ],
    }]}
  />;
};

export const ResourceQuotasDetailsPage = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  pages={[navFactory.details(Details), navFactory.editYaml()]}
/>;
