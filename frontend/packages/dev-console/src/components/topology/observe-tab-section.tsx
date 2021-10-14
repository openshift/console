import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import {
  DaemonSetModel,
  DeploymentConfigModel,
  DeploymentModel,
  StatefulSetModel,
} from '@console/internal/models';
import { getResource } from '@console/topology/src/utils';
import MonitoringTab from '../monitoring/overview/MonitoringTab';

export const getObserveSideBarTabSection = (element: GraphElement) => {
  const resource = getResource(element);
  if (
    !resource ||
    ![
      DeploymentConfigModel.kind,
      DeploymentModel.kind,
      StatefulSetModel.kind,
      DaemonSetModel.kind,
    ].includes(resource?.kind)
  )
    return undefined;
  const { resources } = element.getData();
  return resources ? <MonitoringTab item={resources} /> : undefined;
};
