import * as _ from 'lodash-es';
import * as React from 'react';

import { ColHead, DetailsPage, List, ListHeader, MultiListPage } from './factory';
import { Cog, SectionHeading, navFactory, ResourceCog, ResourceLink, ResourceSummary } from './utils';
import { FLAGS, connectToFlags, flagPending } from '../features';
import { LoadingBox } from './utils/status-box';
import { referenceForModel } from '../module/k8s';
import { ResourceQuotaModel, ClusterResourceQuotaModel } from '../models';

const { common } = Cog.factory;
const menuActions = [...common];

const quotaKind = quota => quota.metadata.namespace ? referenceForModel(ResourceQuotaModel) : referenceForModel(ClusterResourceQuotaModel);

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
  <div className="co-resource-kebab">
    <ResourceCog actions={menuActions} kind={quotaKind(rq)} resource={rq} />
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
export const flatten = resources => _.flatMap(resources, resource => _.compact(resource.data));

export const ResourceQuotasPage = connectToFlags(FLAGS.OPENSHIFT)(({namespace, flags}) => {

  let resources = [{kind: 'ResourceQuota', namespaced: true}];
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
      ]
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
