import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { SideBarTabSection } from '@console/shared';
import { TYPE_WORKLOAD } from '@console/topology/src/const';
import { HPAOverview } from '../hpa/HpaOverview';

export const getHpaTabSectionForTopologySideBar = (element: GraphElement) => {
  if (element.getType() !== TYPE_WORKLOAD) return undefined;
  const data = element.getData();
  const { hpas } = data?.resources ?? {};
  return hpas ? (
    <SideBarTabSection>
      <HPAOverview hpas={hpas} />
    </SideBarTabSection>
  ) : (
    undefined
  );
};
