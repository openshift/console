import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import TopologySideBarTabSection from '@console/topology/src/components/side-bar/TopologySideBarTabSection';
import { getResource } from '@console/topology/src/utils';
import ConfigurationsOverviewList from '../../components/overview/ConfigurationsOverviewList';
import DeploymentOverviewList from '../../components/overview/DeploymentOverviewList';
import { NodeType } from '../topology-types';

export const getKnativeSidepanelDeploymentSection = (element: GraphElement) => {
  if (element.getType() !== NodeType.Revision) return undefined;
  const resource = getResource(element);
  return (
    <TopologySideBarTabSection>
      <DeploymentOverviewList resource={resource} />
    </TopologySideBarTabSection>
  );
};

export const getKnativeSidepanelConfigurationsSection = (element: GraphElement) => {
  if (element.getType() !== NodeType.Revision) return undefined;
  const knObj = element.getData().resources;
  return (
    <TopologySideBarTabSection>
      <ConfigurationsOverviewList configurations={knObj.configurations} />
    </TopologySideBarTabSection>
  );
};
