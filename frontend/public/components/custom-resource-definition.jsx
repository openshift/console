import * as React from 'react';
import { Link } from 'react-router-dom';

import { ColHead, List, ListHeader, ListPage } from './factory';
import { ResourceIcon } from './utils';

const CRDHeader = props => <ListHeader>
  <ColHead {...props} className="col-xs-3" sortField="spec.names.kind">Name</ColHead>
  <ColHead {...props} className="col-xs-3" sortField="spec.version">Version</ColHead>
  <ColHead {...props} className="col-xs-3" sortField="spec.group">Group</ColHead>
  <ColHead {...props} className="col-xs-3">Established</ColHead>
</ListHeader>;

const isEstablished = conditions => {
  const condition = _.find(conditions, c => c.type === 'Established');
  return condition ? condition.status : 'False';
};

const CRDRow = ({obj: crd}) => <div className="row co-resource-list__item">
  <div className="col-xs-3">
    <ResourceIcon kind={crd.spec.names.kind} /> <Link to={`/all-namespaces/${crd.spec.names.plural}`} title={crd.spec.names.kind}>{crd.spec.names.kind}</Link>
  </div>
  <div className="col-xs-3">
    { crd.spec.version }
  </div>
  <div className="col-xs-3">
    { crd.spec.group }
  </div>
  <div className="col-xs-3">
    { isEstablished(crd.status.conditions) }
  </div>
</div>;

export const CustomResourceDefinitionsList = props => <List {...props} Header={CRDHeader} Row={CRDRow} />;
export const CustomResourceDefinitionsPage = props => <ListPage {...props} ListComponent={CustomResourceDefinitionsList} kind="CustomResourceDefinition" />;
