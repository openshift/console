import * as React from 'react';
import { Link } from 'react-router-dom';

import { ColHead, List, ListHeader, ListPage } from './factory';
import { ResourceIcon } from './utils';
import { registerTemplate } from '../yaml-templates';
import { referenceForCRD } from '../module/k8s';

const CRD = `apiVersion: apiextensions.k8s.io/v1beta1
kind: CustomResourceDefinition
metadata:
  # name must match the spec fields below, and be in the form: <plural>.<group>
  name: crontabs.stable.example.com
spec:
  # group name to use for REST API: /apis/<group>/<version>
  group: stable.example.com
  # version name to use for REST API: /apis/<group>/<version>
  version: v1
  # either Namespaced or Cluster
  scope: Namespaced
  names:
    # plural name to be used in the URL: /apis/<group>/<version>/<plural>
    plural: crontabs
    # singular name to be used as an alias on the CLI and for display
    singular: crontab
    # kind is normally the CamelCased singular type. Your resource manifests use this.
    kind: CronTab
    # shortNames allow shorter string to match your resource on the CLI
    shortNames:
    - ct`;

registerTemplate('v1beta1.CustomResourceDefinition', CRD);

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
    <ResourceIcon kind={referenceForCRD(crd)} /> <Link to={`/k8s/${crd.spec.scope === 'Namespaced' ? 'all-namespaces' : 'cluster'}/${crd.spec.names.plural}`} title={crd.spec.names.kind}>{crd.spec.names.kind}</Link>
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
export const CustomResourceDefinitionsPage = props => <ListPage {...props} ListComponent={CustomResourceDefinitionsList} kind="CustomResourceDefinition" canCreate={true} />;
