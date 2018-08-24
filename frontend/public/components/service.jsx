import * as _ from 'lodash-es';
import * as React from 'react';

import { ColHead, DetailsPage, List, ListHeader, ListPage, ResourceRow } from './factory';
import { Cog, navFactory, LabelList, ResourceCog, SectionHeading, ResourceIcon, ResourceLink, ResourceSummary, Selector } from './utils';

const menuActions = [Cog.factory.ModifyPodSelector, ...Cog.factory.common];

const ServiceIP = ({s}) => {
  const children = _.map(s.spec.ports, (portObj, i) => {
    const clusterIP = s.spec.clusterIP === 'None' ? 'None' : `${s.spec.clusterIP}:${portObj.port}`;
    return <div key={i}>{clusterIP}</div>;
  });

  return children;
};

const ServiceHeader = props => <ListHeader>
  <ColHead {...props} className="col-lg-3 col-md-3 col-sm-4 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-3 col-sm-4 col-xs-6" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-lg-3 col-md-3 col-sm-4 hidden-xs" sortField="metadata.labels">Labels</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-3 hidden-sm hidden-xs" sortField="spec.selector">Pod Selector</ColHead>
  <ColHead {...props} className="col-lg-2 hidden-md hidden-sm hidden-xs" sortField="spec.clusterIP">Location</ColHead>
</ListHeader>;

const ServiceRow = ({obj: s}) => <ResourceRow obj={s}>
  <div className="col-lg-3 col-md-3 col-sm-4 col-xs-6 co-resource-link-wrapper">
    <ResourceCog actions={menuActions} kind="Service" resource={s} />
    <ResourceLink kind="Service" name={s.metadata.name} namespace={s.metadata.namespace} title={s.metadata.uid} />
  </div>
  <div className="col-lg-2 col-md-3 col-sm-4 col-xs-6 co-break-word">
    <ResourceLink kind="Namespace" name={s.metadata.namespace} title={s.metadata.namespace} />
  </div>
  <div className="col-lg-3 col-md-3 col-sm-4 hidden-xs">
    <LabelList kind="Service" labels={s.metadata.labels} />
  </div>
  <div className="col-lg-2 col-md-3 hidden-sm hidden-xs">
    <Selector selector={s.spec.selector} namespace={s.metadata.namespace} />
  </div>
  <div className="col-lg-2 hidden-md hidden-sm hidden-xs">
    <ServiceIP s={s} />
  </div>
</ResourceRow>;

const ServiceAddress = ({s}) => {
  const ServiceIPsRow = (name, desc, ips, note = null) => <div className="co-ip-row">
    <div className="row">
      <div className="col-xs-6">
        <p className="ip-name">{name}</p>
        <p className="ip-desc">{desc}</p>
      </div>
      <div className="col-xs-6">{note && <span className="text-muted">{note}</span>}{ips.join(', ')}</div>
    </div>
  </div>;

  const ServiceType = (type) => {
    switch (type) {
      case 'NodePort':
        return ServiceIPsRow('Node Port', 'Accessible outside the cluster', _.map(s.spec.ports, 'nodePort'), '(all nodes): ');
      case 'LoadBalancer':
        return ServiceIPsRow('External Load Balancer', 'Ingress point(s) of load balancer', _.map(s.status.loadBalancer.ingress, i => i.hostname || i.ip || '-'));
      case 'ExternalName':
        return ServiceIPsRow('External Service Name', 'Location of the resource that backs the service', [s.spec.externalName]);
      default:
        return ServiceIPsRow('Cluster IP', 'Accessible within the cluster only', [s.spec.clusterIP]);
    }
  };

  return <div>
    <div className="row co-ip-header">
      <div className="col-xs-6">Type</div>
      <div className="col-xs-6">Location</div>
    </div>
    <div className="rows">
      {ServiceType(s.spec.type)}
      {s.spec.externalIPs && ServiceIPsRow('External IP', 'IP Address(es) accepting traffic for service', s.spec.externalIPs)}
    </div>
  </div>;
};

const ServicePortMapping = ({ports}) => <div>
  <div className="row co-ip-header">
    <div className="col-xs-3">Name</div>
    <div className="col-xs-3">Port</div>
    <div className="col-xs-3">Protocol</div>
    <div className="col-xs-3">Pod Port or Name</div>
  </div>
  <div className="rows">
    {ports.map((portObj, i) => {
      return <div className="co-ip-row" key={i}>
        <div className="row">
          <div className="col-xs-3 co-text-service">
            <p>{portObj.name || '-'}</p>
            {portObj.nodePort && <p className="co-text-node">Node Port</p>}
          </div>
          <div className="col-xs-3 co-text-service">
            <p><ResourceIcon kind="Service" /><span>{portObj.port}</span></p>
            {portObj.nodePort && <p className="co-text-node"><ResourceIcon kind="Node" /><span>{portObj.nodePort}</span></p>}
          </div>
          <div className="col-xs-3">
            <p>{portObj.protocol}</p>
          </div>
          <div className="col-xs-3 co-text-pod">
            <p><ResourceIcon kind="Pod" /><span>{portObj.targetPort}</span></p>
          </div>
        </div>
      </div>;
    })}
  </div>
</div>;

const Details = ({obj: s}) => <div className="co-m-pane__body">
  <div className="row">
    <div className="col-sm-6">
      <SectionHeading text="Service Overview" />
      <ResourceSummary resource={s} showNodeSelector={false}>
        <dt>Session Affinity</dt>
        <dd>{s.spec.sessionAffinity || '-'}</dd>
      </ResourceSummary>
    </div>
    <div className="col-sm-6">
      <SectionHeading text="Service Routing" />
      <dl>
        <dt>Service Address</dt>
        <dd className="service-ips">
          <ServiceAddress s={s} />
        </dd>
        <dt>Service Port Mapping</dt>
        <dd className="service-ips">
          {s.spec.ports ? <ServicePortMapping ports={s.spec.ports} /> : '-'}
        </dd>
      </dl>
    </div>
  </div>
</div>;

const {details, pods, editYaml} = navFactory;
const ServicesDetailsPage = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  pages={[details(Details), editYaml(), pods()]}
/>;

const ServicesList = props => <List {...props} Header={ServiceHeader} Row={ServiceRow} />;
const ServicesPage = props => <ListPage canCreate={true} ListComponent={ServicesList} {...props} />;

export {ServicesList, ServicesPage, ServicesDetailsPage};
