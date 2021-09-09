import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { getResource } from '@console/topology/src/utils';
import { KafkaConnection } from '../../utils/rhoas-types';
import { TYPE_MANAGED_KAFKA_CONNECTION } from '../components/const';
import { DetailsComponent } from '../components/DetailsComponent';
import { ResourcesComponent } from '../components/ResourceComponent';

export const getDetailsTabSectionForTopologySideBar = (element: GraphElement) => {
  if (element.getType() !== TYPE_MANAGED_KAFKA_CONNECTION) return undefined;
  const resource = getResource<KafkaConnection>(element);
  return <DetailsComponent obj={resource} />;
};

export const getResourceTabSectionForTopologySideBar = (element: GraphElement) => {
  if (element.getType() !== TYPE_MANAGED_KAFKA_CONNECTION) return undefined;
  const resource = getResource<KafkaConnection>(element);
  return <ResourcesComponent obj={resource} />;
};
