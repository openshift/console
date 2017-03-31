import React from 'react';

import {DetailsPage, ListPage, makeList} from './factory';
import {Cog, navFactory, LabelList, ResourceCog, Heading, ResourceIcon, ResourceLink, ResourceSummary, Selector} from './utils';

const menuActions = [Cog.factory.ModifyPodSelector, ...Cog.factory.common];

const ServiceIPLink = ({s}) => {
  const children = _.map(s.spec.ports, (portObj, i) => {
    return <span key={i}><a target="_blank" href={`http://${s.spec.clusterIP}:${portObj.port}`}>
      {s.spec.clusterIP}:{portObj.port}
    </a>&nbsp;&nbsp;</span>;
  });

  return <p>{children}</p>;
};

const ServiceHeader = () => <div className="row co-m-table-grid__head">
  <div className="col-lg-3 col-md-2 col-sm-4 col-xs-6">Service Name</div>
  <div className="col-lg-3 col-md-4 col-sm-4 col-xs-6">Service Labels</div>
  <div className="col-lg-3 col-md-4 col-sm-4 hidden-xs">Pod Selector</div>
  <div className="col-lg-3 col-md-2 hidden-sm hidden-xs">Service Location</div>
</div>;

const ServiceRow = ({obj: s}) => <div className="row co-resource-list__item">
  <div className="col-lg-3 col-md-2 col-sm-4 col-xs-6">
    <ResourceCog actions={menuActions} kind="service" resource={s} />
    <ResourceLink kind="service" name={s.metadata.name} namespace={s.metadata.namespace} title={s.metadata.uid} />
  </div>
  <div className="col-lg-3 col-md-4 col-sm-4 col-xs-6">
    <LabelList kind="service" labels={s.metadata.labels} />
  </div>
  <div className="col-lg-3 col-md-4 col-sm-4 hidden-xs">
    <Selector selector={s.spec.selector} />
  </div>
  <div className="col-lg-3 col-md-2 hidden-sm hidden-xs">
    <ServiceIPLink s={s} />
  </div>
</div>;

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

  return <div>
    <div className="row co-ip-header">
      <div className="col-xs-6">Type</div>
      <div className="col-xs-6">Location</div>
    </div>
    <div className="rows">
      {ServiceIPsRow('Cluster IP', 'Accessible within the cluster only', [s.spec.clusterIP])}
      {s.spec.type === 'NodePort' && ServiceIPsRow('Node Port', 'Accessible outside the cluster', _.map(s.spec.ports, 'nodePort'), '(all nodes): ')}
      {s.spec.type === 'LoadBalancer' && ServiceIPsRow('External Load Balancer', 'Ingress point(s) of load balancer', _.map(s.status.loadBalancer.ingress, i => i.hostname || i.ip || '-'))}
      {s.spec.externalIPs && ServiceIPsRow('External IP', 'IP Address(es) accepting traffic for service', s.spec.externalIPs)}
    </div>
  </div>;
};

const ServicePortMapping = ({s}) => <div>
  <div className="row co-ip-header">
    <div className="col-xs-3">Name</div>
    <div className="col-xs-3">Port</div>
    <div className="col-xs-3">Protocol</div>
    <div className="col-xs-3">Pod Port or Name</div>
  </div>
  <div className="rows">
    {s.spec.ports.map((portObj, i) => {
      return <div className="co-ip-row" key={i}>
        <div className="row">
          <div className="col-xs-3 co-text-service">
            <p>{portObj.name || '-'}</p>
            {portObj.nodePort && <p className="co-text-node">Node Port</p>}
          </div>
          <div className="col-xs-3 co-text-service">
            <p><ResourceIcon kind="service" /><span>{portObj.port}</span></p>
            {portObj.nodePort && <p className="co-text-node"><ResourceIcon kind="node" /><span>{portObj.nodePort}</span></p>}
          </div>
          <div className="col-xs-3">
            <p>{portObj.protocol}</p>
          </div>
          <div className="col-xs-3 co-text-pod">
            <p><ResourceIcon kind="pod" /><span>{portObj.targetPort}</span></p>
          </div>
        </div>
      </div>;
    })}
  </div>
</div>;

const Details = (s) => <div className="row no-gutter">
  <div className="col-sm-6">
    <Heading text="Service Overview" />
    <div className="co-m-pane__body-group">
      <div className="co-m-pane__body-section--bordered">
        <ResourceSummary resource={s} showNodeSelector={false}>
          <dt>Session Affinity</dt>
          <dd>{s.spec.sessionAffinity || '-'}</dd>
        </ResourceSummary>
      </div>
    </div>
  </div>
  <div className="col-sm-6">
    <Heading text="Service Routing" />
    <div className="co-m-pane__body-group">
      <div className="co-m-pane__body-section--bordered">
        <dl>
          <dt>Service Address</dt>
          <dd className="service-ips">
            <ServiceAddress s={s} />
          </dd>
          <dt>Service Port Mapping</dt>
          <dd className="service-ips">
            <ServicePortMapping s={s} />
          </dd>
        </dl>
      </div>
    </div>
  </div>
</div>;

const {details, pods, editYaml} = navFactory;
const pages = [details(Details), editYaml(), pods()];
const ServicesDetailsPage = props => <DetailsPage pages={pages} menuActions={menuActions} {...props} />;

const ServicesList = makeList('Services', 'service', ServiceHeader, ServiceRow);
const ServicesPage = props => <ListPage canCreate={true} ListComponent={ServicesList} {...props} />;

export {ServicesList, ServicesPage, ServicesDetailsPage};
