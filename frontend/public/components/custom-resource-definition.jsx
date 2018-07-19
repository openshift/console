import * as _ from 'lodash-es';
import * as React from 'react';

import { ColHead, List, ListHeader, ListPage } from './factory';
import { Cog, ResourceCog, ResourceLink } from './utils';
import { registerTemplate } from '../yaml-templates';
import { referenceForCRD } from '../module/k8s';

const menuActions = [Cog.factory.ModifyLabels, Cog.factory.ModifyAnnotations, Cog.factory.Edit, Cog.factory.Delete];

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

registerTemplate('apiextensions.k8s.io/v1beta1.CustomResourceDefinition', CRD);

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
  <div className="col-lg-4 col-md-4 col-sm-4 col-xs-6 co-resource-link-wrapper">
    <ResourceCog actions={menuActions} kind="CustomResourceDefinition" resource={crd} />
    <ResourceLink kind={referenceForCRD(crd)} displayName={_.get(crd, 'spec.names.kind', crd.metadata.name)} namespace={crd.metadata.namespace} title={crd.metadata.name} />
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
</div>;

export const CustomResourceDefinitionsList = props => <List {...props} Header={CRDHeader} Row={CRDRow} />;
export const CustomResourceDefinitionsPage = props => <ListPage {...props} ListComponent={CustomResourceDefinitionsList} kind="CustomResourceDefinition" canCreate={true} />;
