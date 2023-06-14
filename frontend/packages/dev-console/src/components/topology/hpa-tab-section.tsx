import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { DetailsTabSectionExtensionHook } from '@console/dynamic-plugin-sdk/src/extensions/topology-details';
import TopologySideBarTabSection from '@console/topology/src/components/side-bar/TopologySideBarTabSection';
import { TYPE_WORKLOAD } from '@console/topology/src/const';
import { HPAOverview } from '../hpa/HpaOverview';

export const useHpaTabSectionForTopologySideBar: DetailsTabSectionExtensionHook = (
  element: GraphElement,
) => {
  if (element.getType() !== TYPE_WORKLOAD) {
    return [undefined, true, undefined];
  }
  const data = element.getData();
  const { hpas } = data?.resources ?? {};
  const section = hpas ? (
    <TopologySideBarTabSection>
      <HPAOverview hpas={hpas} />
    </TopologySideBarTabSection>
  ) : undefined;
  return [section, true, undefined];
};
