import * as _ from 'lodash-es';
import * as React from 'react';
import { Link } from 'react-router-dom';

import { FLAGS, connectToFlags } from '../features';
import { ColHead, DetailsPage, List, ListHeader, ListPage } from './factory';
import { Kebab, navFactory, ResourceKebab, SectionHeading, ResourceLink, ResourceSummary, Selector, ExternalLink } from './utils';

const { common } = Kebab.factory;
const menuActions = [...common];

const Header = props => <ListHeader>
  <ColHead {...props} className="col-sm-4 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-sm-4 col-xs-6" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-sm-4 hidden-xs" sortField="spec.podSelector">Pod Selector</ColHead>
</ListHeader>;

const kind = 'NetworkPolicy';
const Row = ({obj: np}) => <div className="row co-resource-list__item">
  <div className="col-sm-4 col-xs-6">
    <ResourceLink kind={kind} name={np.metadata.name} namespace={np.metadata.namespace} title={np.metadata.name} />
  </div>
  <div className="col-sm-4 col-xs-6 co-break-word">
    <ResourceLink kind={'Namespace'} name={np.metadata.namespace} title={np.metadata.namespace} />
  </div>

  <div className="col-sm-4 hidden-xs co-break-word">
    {
      _.isEmpty(np.spec.podSelector) ?
        <Link to={`/search/ns/${np.metadata.namespace}?kind=Pod`}>{`All pods within ${np.metadata.namespace}`}</Link> :
        <Selector selector={np.spec.podSelector} namespace={np.metadata.namespace} />
    }
  </div>
  <div className="dropdown-kebab-pf">
    <ResourceKebab actions={menuActions} kind={kind} resource={np} />
  </div>
</div>;

const NetworkPoliciesList = props => <List {...props} Header={Header} Row={Row} />;
export const NetworkPoliciesPage = props => <ListPage {...props} ListComponent={NetworkPoliciesList} kind={kind} canCreate={true} />;


const IngressHeader = () => <div className="row co-m-table-grid__head">
  <div className="col-xs-4">target pods</div>
  <div className="col-xs-5">from</div>
  <div className="col-xs-3">to ports</div>
</div>;

const IngressRow = ({ingress, namespace, podSelector}) => {
  const podSelectors = [];
  const nsSelectors = [];
  let i = 0;

  const style = {margin: '5px 0'};
  _.each(ingress.from, ({namespaceSelector, podSelector: ps}) => {
    if (namespaceSelector) {
      nsSelectors.push(<div key={i++} style={style}><Selector selector={namespaceSelector} kind="Namespace" /></div>);
    } else {
      podSelectors.push(<div key={i++} style={style}><Selector selector={ps} namespace={namespace} /></div>);
    }
  });
  return <div className="row co-resource-list__item">
    <div className="col-xs-4">
      <div>
        <span className="text-muted">Pod Selector:</span>
      </div>
      <div style={style}>
        <Selector selector={podSelector} namespace={namespace} />
      </div>
    </div>
    <div className="col-xs-5">
      <div>
        { !podSelectors.length ? null :
          <div>
            <span className="text-muted">Pod Selector:</span>
            {podSelectors}
          </div>
        }
        { !nsSelectors.length ? null :
          <div style={{paddingTop: podSelectors.length ? 10 : 0}}>
            <span className="text-muted">NS Selector:</span>
            {nsSelectors}
          </div>
        }
      </div>
    </div>
    <div className="col-xs-3">
      {
        _.map(ingress.ports, (port, k) => <p key={k}>{port.protocol}/{port.port}</p>)
      }
    </div>
  </div>;
};

const Details_ = ({obj: np}) => {
  const networkPolicyDocs = 'https://kubernetes.io/docs/concepts/services-networking/network-policies/';
  return <React.Fragment>
    <div className="co-m-pane__body">
      <SectionHeading text="Namespace Overview" />
      <ResourceSummary resource={np} podSelector={'spec.podSelector'} showNodeSelector={false} showPodSelector={true} />
    </div>
    <div className="co-m-pane__body">
      <SectionHeading text="Ingress Rules" />
      <p className="co-m-pane__explanation">
        Pods accept all traffic by default.
        They can be isolated via Network Policies which specify a whitelist of ingress rules.
        When a Pod is selected by a Network Policy, it will reject all traffic not explicitly allowed via a Network Policy.
        See more details in <ExternalLink href={networkPolicyDocs} text="Network Policies Documentation" />.
      </p>
      {
        _.isEmpty(_.get(np, 'spec.ingress[0]', [])) ?
          `All traffic is allowed to Pods in ${np.metadata.namespace}.` :
          <div className="co-m-table-grid co-m-table-grid--bordered">
            <IngressHeader />
            <div className="co-m-table-grid__body">
              { _.map(np.spec.ingress, (ingress, i) => <IngressRow key={i} ingress={ingress} podSelector={np.spec.podSelector} namespace={np.metadata.namespace} />) }
            </div>
          </div>
      }
    </div>
  </React.Fragment>;
};

const Details = connectToFlags(FLAGS.OPENSHIFT)(Details_);

export const NetworkPoliciesDetailsPage = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  pages={[navFactory.details(Details), navFactory.editYaml()]}
/>;
