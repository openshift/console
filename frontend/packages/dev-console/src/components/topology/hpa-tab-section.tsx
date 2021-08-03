import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import TopologySideBarTabSection from '@console/topology/src/components/side-bar/TopologySideBarTabSection';
import { TYPE_WORKLOAD } from '@console/topology/src/const';
import { HPAOverview } from '../hpa/HpaOverview';

export const getHpaTabSectionForTopologySideBar = (element: GraphElement) => {
  if (element.getType() !== TYPE_WORKLOAD) return undefined;
  const data = element.getData();
  const { hpas } = data?.resources ?? {};
  return hpas ? (
    <TopologySideBarTabSection>
      <HPAOverview hpas={hpas} />
    </TopologySideBarTabSection>
  ) : (
    undefined
  );
};
