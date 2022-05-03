import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { DetailsTabSectionExtensionHook } from '@console/dynamic-plugin-sdk/src/extensions/topology-details';
import { getResource } from '@console/topology/src/utils';
import { KafkaConnection } from '../../utils/rhoas-types';
import { TYPE_MANAGED_KAFKA_CONNECTION } from '../components/const';
import { DetailsComponent } from '../components/DetailsComponent';
import { ResourcesComponent } from '../components/ResourceComponent';

export const useDetailsTabSectionForTopologySideBar: DetailsTabSectionExtensionHook = (
  element: GraphElement,
) => {
  if (element.getType() !== TYPE_MANAGED_KAFKA_CONNECTION) {
    return [undefined, true, undefined];
  }
  const resource = getResource<KafkaConnection>(element);
  const section = <DetailsComponent obj={resource} />;
  return [section, true, undefined];
};

export const useResourceTabSectionForTopologySideBar: DetailsTabSectionExtensionHook = (
  element: GraphElement,
) => {
  if (element.getType() !== TYPE_MANAGED_KAFKA_CONNECTION) {
    return [undefined, true, undefined];
  }
  const resource = getResource<KafkaConnection>(element);
  const section = <ResourcesComponent obj={resource} />;
  return [section, true, undefined];
};
