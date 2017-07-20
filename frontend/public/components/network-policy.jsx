import _ from 'lodash';
import React from 'react';
import { Link } from 'react-router';

import {ColHead, DetailsPage, List, ListHeader, ListPage} from './factory';
import {Cog, navFactory, ResourceCog, Heading, ResourceLink, ResourceSummary, Selector} from './utils';
import { registerTemplate } from '../yaml-templates';

registerTemplate('v1.NetworkPolicy', `apiVersion: networking.k8s.io/v1
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
export const NetworkPoliciesPage = props => <ListPage {...props} ListComponent={NetworkPoliciesList} kind={kind} canCreate={true} />;

const IngressHeader = () => <div className="row co-m-table-grid__head">
  <div className="col-xs-6">From</div>
  <div className="col-xs-6">Ports</div>
</div>;

const FromNamespaceSelector = ({selector, namespace}) => <div>
  <span className="text-muted">Namespace Selector</span> <Selector selector={selector} kind={namespace} style={{display: 'inline-block'}}/>
</div>;

const FromPodSelector = ({selector, namespace}) => <div>
  <span className="text-muted">Pod Selector</span> <Selector selector={selector} namespace={namespace} style={{display: 'inline-block'}} />
</div>;

const From = ({ingressFrom, namespace}) => ingressFrom.namespaceSelector ?
  <FromNamespaceSelector selector={ingressFrom.namespaceSelector.matchLabels} namespace={namespace} /> :
  <FromPodSelector selector={ingressFrom.podSelector.matchLabels} namespace={namespace} />;

const IngressRow = ({ingress, namespace}) => <div className="row co-resource-list__item">
  <div className="col-xs-6">
    <div>
      {
        _.map(ingress.from, (ingressFrom, i) => <p><From key={i} ingressFrom={ingressFrom} namespace={namespace} /></p>)
      }
    </div>
  </div>
  <div className="col-xs-6">
    <div>
      {
       _.map(ingress.ports, (port, i) => <p key={i}>{port.protocol}/{port.port}</p>)
      }
    </div>
  </div>
</div>;

const Details = (np) => <div>
  <Heading text="Namespace Overview" />
  <div className="co-m-pane__body">
    <div className="row">
      <div className="col-sm-6 col-xs-12">
        <ResourceSummary resource={np} podSelector={'spec.podSelector'} showNodeSelector={false} />
      </div>
    </div>
  </div>
  <Heading text="Ingress Rules" />
  <div className="co-m-pane__body">
    <div className="row co-m-form-row">
      <div className="col-md-12 text-muted">
        Pods accept all traffic by default, although they can be isolated via Network Policies which specify a whitelist of ingress rules.
        As soon as a Pod is selected by any Network Policy (in that Policy's namespace), it will reject all traffic not explicitly allowed via a Network Policy.
        See more details in <a target="_blank" href="https://kubernetes.io/docs/concepts/services-networking/network-policies/">Network Policies Documentation</a>.
      </div>
    </div>
    <div className="row">
      <div className="col-md-12">
        {
          _.isEmpty(np.spec.ingress[0]) ?
            `All Traffic is allowed to Pods in ${np.metadata.namespace}.` :
            <div className="co-m-table-grid co-m-table-grid--bordered">
              <IngressHeader />
              <div className="co-m-table-grid__body">
                {
                 _.map(np.spec.ingress, (ingress, i) => <IngressRow key={i} ingress={ingress} namespace={np.metadata.namespace} />)
                }
              </div>
            </div>
        }
      </div>
    </div>
  </div>

</div>;

export const NetworkPoliciesDetailsPage = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  pages={[navFactory.details(Details), navFactory.editYaml()]}
/>;
