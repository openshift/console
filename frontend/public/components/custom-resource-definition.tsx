import * as _ from 'lodash-es';
import * as React from 'react';

import { ColHead, DetailsPage, List, ListHeader, ListPage } from './factory';
import { Kebab, navFactory, ResourceKebab, ResourceLink, ResourceSummary, SectionHeading } from './utils';
import { referenceForCRD } from '../module/k8s';

const { common } = Kebab.factory;

const crdInstancesPath = crd => _.get(crd, 'spec.scope') === 'Namespaced'
  ? `/k8s/all-namespaces/${referenceForCRD(crd)}`
  : `/k8s/cluster/${referenceForCRD(crd)}`;

const instances = (kind, obj) => ({
  label: 'View Instances',
  href: crdInstancesPath(obj),
});

const menuActions = [instances, ...common];

const CRDHeader = props => <ListHeader>
  <ColHead {...props} className="col-lg-3 col-md-4 col-sm-4 col-xs-6" sortField="spec.names.kind">Name</ColHead>
  <ColHead {...props} className="col-lg-3 col-md-4 col-sm-4 col-xs-6" sortField="spec.group">Group</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-2 col-sm-4 hidden-xs" sortField="spec.version">Version</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-2 hidden-sm hidden-xs" sortField="spec.scope">Namespaced</ColHead>
  <ColHead {...props} className="col-lg-2 hidden-md hidden-sm hidden-xs">Established</ColHead>
</ListHeader>;

const isEstablished = conditions => {
  const condition = _.find(conditions, c => c.type === 'Established');
  return condition && condition.status === 'True';
};

const namespaced = crd => crd.spec.scope === 'Namespaced';

const CRDRow = ({obj: crd}) => <div className="row co-resource-list__item">
  <div className="col-lg-3 col-md-4 col-sm-4 col-xs-6">
    <span className="co-resource-item">
      <ResourceLink kind="CustomResourceDefinition" name={crd.metadata.name} namespace={crd.metadata.namespace} displayName={_.get(crd, 'spec.names.kind')} />
    </span>
  </div>
  <div className="col-lg-3 col-md-4 col-sm-4 col-xs-6 co-break-word">
    { crd.spec.group }
  </div>
  <div className="col-lg-2 col-md-2 col-sm-4 hidden-xs">
    { crd.spec.version }
  </div>
  <div className="col-lg-2 col-md-2 hidden-sm hidden-xs">
    { namespaced(crd) ? 'Yes' : 'No' }
  </div>
  <div className="col-lg-2 hidden-md hidden-sm hidden-xs">
    {
      isEstablished(crd.status.conditions)
        ? <span><i className="pficon pficon-ok" aria-hidden="true"></i></span>
        : <span><i className="fa fa-ban" aria-hidden="true"></i></span>
    }
  </div>
  <div className="dropdown-kebab-pf">
    <ResourceKebab actions={menuActions} kind="CustomResourceDefinition" resource={crd} />
  </div>
</div>;

const Details = ({obj: crd}) => {
  return <div className="co-m-pane__body">
    <SectionHeading text="Custom Resource Definition Overview" />
    <ResourceSummary showPodSelector={false} showNodeSelector={false} resource={crd} />
  </div>;
};

export const CustomResourceDefinitionsList: React.SFC<CustomResourceDefinitionsListProps> = props => <List {...props} Header={CRDHeader} Row={CRDRow} />;
export const CustomResourceDefinitionsPage: React.SFC<CustomResourceDefinitionsPageProps> = props => <ListPage {...props} ListComponent={CustomResourceDefinitionsList} kind="CustomResourceDefinition" canCreate={true} />;
export const CustomResourceDefinitionsDetailsPage = props => <DetailsPage {...props} menuActions={menuActions} pages={[navFactory.details(Details), navFactory.editYaml()]} />;

export type CustomResourceDefinitionsListProps = {

};

export type CustomResourceDefinitionsPageProps = {

};

CustomResourceDefinitionsList.displayName = 'CustomResourceDefinitionsList';
CustomResourceDefinitionsPage.displayName = 'CustomResourceDefinitionsPage';
