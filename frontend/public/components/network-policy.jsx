import _ from 'lodash';
import React from 'react';
import { Link } from 'react-router';

import {ColHead, DetailsPage, List, ListHeader, ListPage} from './factory';
import {Cog, navFactory, ResourceCog, Heading, ResourceLink, ResourceSummary, Selector} from './utils';
import { registerTemplate } from '../yaml-templates';

registerTemplate('v1.NetworkPolicy', `apiVersion: extensions/v1beta1
kind: NetworkPolicy
metadata:
  name: test-network-policy
  namespace: default
spec:
  podSelector:
    matchLabels:
      role: db
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          project: myproject
    - podSelector:
        matchLabels:
          role: somerole
    ports:
    - protocol: TCP
      port: 6379
`);


const menuActions = [Cog.factory.ModifyLabels, Cog.factory.ModifyAnnotations, Cog.factory.Edit, Cog.factory.Delete];

const Header = props => <ListHeader>
  <ColHead {...props} className="col-xs-4" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-xs-3" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-xs-5" sortField="spec.podSelector">Pod Selector</ColHead>
</ListHeader>;

const kind = 'NetworkPolicy';
const Row = ({obj: np}) => <div className="row co-resource-list__item">
  <div className="col-xs-4">
    <ResourceCog actions={menuActions} kind={kind} resource={np} />
    <ResourceLink kind={kind} name={np.metadata.name} namespace={np.metadata.namespace} title={np.metadata.name} />
  </div>
  <div className="col-xs-3">
    <ResourceLink kind={'Namespace'} name={np.metadata.namespace} title={np.metadata.namespace} />
  </div>

  <div className="col-xs-5">
    {
      _.isEmpty(np.spec.podSelector) ?
      <Link to={`ns/${np.metadata.namespace}/search?kind=Pod`}>{`All pods within ${np.metadata.namespace}`}</Link> :
      <Selector selector={np.spec.podSelector} namespace={np.metadata.namespace} />
    }
  </div>
</div>;

export const NetworkPoliciesList = props => <List {...props} Header={Header} Row={Row} />;
// createHandler={createNamespaceModal}
export const NetworkPoliciesPage = props => <ListPage {...props} ListComponent={NetworkPoliciesList} kind={kind} canCreate={true} />;

const Details = (ns) => <div>
  <Heading text="Namespace Overview" />
  <div className="co-m-pane__body">
    <div className="row">
      <div className="col-sm-6 col-xs-12">
        <ResourceSummary resource={ns} podSelector={'spec.podSelector'} showNodeSelector={false} />
      </div>
    </div>
  </div>
</div>;

export const NetworkPoliciesDetailsPage = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  pages={[navFactory.details(Details), navFactory.editYaml()]}
/>;
