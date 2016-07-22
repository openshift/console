import React from 'react';

import {angulars} from './react-wrapper';

import withPodList from './withPodList';
import createListComponent from './list-factory';
import createPageComponent from './page-factory';

import {Cog, LabelList, ResourceIcon, Selector} from './utils'

const ServiceIPLink = ({s}) => {
  const children = _.map(s.spec.ports, (portObj, i) => {
    return <span key={i}><a target="_blank" href={`http://${s.spec.clusterIP}:${portObj.port}`}>
      {s.spec.clusterIP}:{portObj.port}
    </a>&nbsp;&nbsp;</span>
  });

  return <p>{children}</p>;
};

const ServiceCog = ({s}) => {
  const {factory: {ModifyPodSelector, ModifyLabels, Delete}} = Cog;

  const ServicePorts = (kind, s) => ({
    label: 'Modify Service Ports...',
    weight: 200,
    callback: angulars.modal('service-ports', {kind, resource: () => s}),
  });

  const options = [ModifyPodSelector, ServicePorts, ModifyLabels, Delete].map(f => f(angulars.kinds.SERVICE, s));
  return <Cog options={options} size="small" anchor="left"></Cog>;
}

const ServiceHeader = () => <div className="row co-m-table-grid__head">
  <div className="col-lg-3 col-md-2 col-sm-4 col-xs-6">Service Name</div>
  <div className="col-lg-3 col-md-4 col-sm-4 col-xs-6">Service Labels</div>
  <div className="col-lg-3 col-md-4 col-sm-4 hidden-xs">Pod Selector</div>
  <div className="col-lg-3 col-md-2 hidden-sm hidden-xs">Service Location</div>
</div>

const ServiceRow = (s) => <div className="row co-resource-list__item">
  <div className="col-lg-3 col-md-2 col-sm-4 col-xs-6">
    <ServiceCog s={s}></ServiceCog>
    <ResourceIcon kind="service"></ResourceIcon>
    <a href={`ns/${s.metadata.namespace}/services/${s.metadata.name}`}>{s.metadata.name}</a>
  </div>
  <div className="col-lg-3 col-md-4 col-sm-4 col-xs-6">
    <LabelList kind="service" labels={s.metadata.labels}></LabelList>
  </div>
  <div className="col-lg-3 col-md-4 col-sm-4 hidden-xs">
     <Selector selector={s.spec.selector}></Selector>
  </div>
  <div className="col-lg-3 col-md-2 hidden-sm hidden-xs">
    <ServiceIPLink s={s}></ServiceIPLink>
  </div>
</div>

const Services = createListComponent('Services', 'SERVICE', ServiceHeader, withPodList(ServiceRow));
const ServicesPage = createPageComponent('ServicesPage', 'SERVICE', Services);

export {Services, ServicesPage};

