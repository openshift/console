import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { ManagedByOperatorLink } from '@console/internal/components/utils/managed-by';
import TopologySideBarTabSection from '@console/topology/src/components/side-bar/TopologySideBarTabSection';
import { TYPE_WORKLOAD } from '@console/topology/src/const';
import { getResource } from '@console/topology/src/utils';

export const getManagedByOperatorLinkSideBarTabSection = (element: GraphElement) => {
  if (element.getType() !== TYPE_WORKLOAD && !element.getData()?.data?.isKnativeResource)
    return undefined;
  const resource = getResource(element);
  return (
    <TopologySideBarTabSection>
      <ManagedByOperatorLink obj={resource} />
    </TopologySideBarTabSection>
  );
};
