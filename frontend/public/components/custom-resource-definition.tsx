import * as _ from 'lodash-es';
import * as React from 'react';
import { Link } from 'react-router-dom';

import { ColHead, List, ListHeader, ListPage } from './factory';
import { Kebab, ResourceKebab, ResourceIcon } from './utils';
import { referenceForCRD } from '../module/k8s';

const { common } = Kebab.factory;
const menuActions = [...common];

const CRDHeader = props => <ListHeader>
  <ColHead {...props} className="col-lg-4 col-md-4 col-sm-4 col-xs-6" sortField="spec.names.kind">Name</ColHead>
  <ColHead {...props} className="col-lg-3 col-md-4 col-sm-4 col-xs-6" sortField="spec.group">Group</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-2 col-sm-4 hidden-xs" sortField="spec.version">Version</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-2 hidden-sm hidden-xs" sortField="spec.scope">Namespaced</ColHead>
  <ColHead {...props} className="col-lg-1 hidden-md hidden-sm hidden-xs">Established</ColHead>
</ListHeader>;

const isEstablished = conditions => {
  const condition = _.find(conditions, c => c.type === 'Established');
  return condition && condition.status === 'True';
};

const namespaced = crd => crd.spec.scope === 'Namespaced';

const CRDRow = ({obj: crd}) => <div className="row co-resource-list__item">
  <div className="col-lg-4 col-md-4 col-sm-4 col-xs-6">
    <span className="co-resource-link">
      <ResourceIcon kind="CustomResourceDefinition" />
      <Link className="co-resource-link__resource-name" to={`/k8s/all-namespaces/${referenceForCRD(crd)}`}>{_.get(crd, 'spec.names.kind', crd.metadata.name)}</Link>
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
  <div className="col-lg-1 hidden-md hidden-sm hidden-xs">
    {
      isEstablished(crd.status.conditions)
        ? <span className="node-ready"><i className="fa fa-check-circle"></i></span>
        : <span className="node-not-ready"><i className="fa fa-minus-circle"></i></span>
    }
  </div>
  <div className="dropdown-kebab-pf">
    <ResourceKebab actions={menuActions} kind="CustomResourceDefinition" resource={crd} />
  </div>
</div>;

export const CustomResourceDefinitionsList: React.SFC<CustomResourceDefinitionsListProps> = props => <List {...props} Header={CRDHeader} Row={CRDRow} />;
export const CustomResourceDefinitionsPage: React.SFC<CustomResourceDefinitionsPageProps> = props => <ListPage {...props} ListComponent={CustomResourceDefinitionsList} kind="CustomResourceDefinition" canCreate={true} filterLabel="CRDs by name" />;

export type CustomResourceDefinitionsListProps = {

};

export type CustomResourceDefinitionsPageProps = {

};

CustomResourceDefinitionsList.displayName = 'CustomResourceDefinitionsList';
CustomResourceDefinitionsPage.displayName = 'CustomResourceDefinitionsPage';
