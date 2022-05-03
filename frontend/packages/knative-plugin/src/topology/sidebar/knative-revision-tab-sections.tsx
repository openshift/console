import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { DetailsTabSectionExtensionHook } from '@console/dynamic-plugin-sdk/src/extensions/topology-details';
import TopologySideBarTabSection from '@console/topology/src/components/side-bar/TopologySideBarTabSection';
import { getResource } from '@console/topology/src/utils';
import ConfigurationsOverviewList from '../../components/overview/ConfigurationsOverviewList';
import DeploymentOverviewList from '../../components/overview/DeploymentOverviewList';
import { NodeType } from '../topology-types';

export const useKnativeSidepanelDeploymentSection: DetailsTabSectionExtensionHook = (
  element: GraphElement,
) => {
  if (element.getType() !== NodeType.Revision) {
    return [undefined, true, undefined];
  }
  const resource = getResource(element);
  const section = (
    <TopologySideBarTabSection>
      <DeploymentOverviewList resource={resource} />
    </TopologySideBarTabSection>
  );
  return [section, true, undefined];
};

export const useKnativeSidepanelConfigurationsSection: DetailsTabSectionExtensionHook = (
  element: GraphElement,
) => {
  if (element.getType() !== NodeType.Revision) {
    return [undefined, true, undefined];
  }
  const knObj = element.getData().resources;
  const section = (
    <TopologySideBarTabSection>
      <ConfigurationsOverviewList configurations={knObj.configurations} />
    </TopologySideBarTabSection>
  );
  return [section, true, undefined];
};
