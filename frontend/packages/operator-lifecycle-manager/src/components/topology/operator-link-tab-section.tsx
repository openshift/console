import * as React from 'react';
import { GraphElement, Node } from '@patternfly/react-topology';
import { ManagedByOperatorLink } from '@console/internal/components/utils/managed-by';
import { SideBarTabSection } from '@console/shared';
import { TYPE_WORKLOAD } from '@console/topology/src/const';
import { getResource } from '@console/topology/src/utils';

export const getManagedByOperatorLinkSideBarTabSection = (element: GraphElement) => {
  if (element.getType() !== TYPE_WORKLOAD) return undefined;
  const resource = getResource(element as Node);
  return (
    <SideBarTabSection>
      <ManagedByOperatorLink obj={resource} />
    </SideBarTabSection>
  );
};
