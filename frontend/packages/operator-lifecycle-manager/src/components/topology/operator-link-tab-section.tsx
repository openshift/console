import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { DetailsTabSectionExtensionHook } from '@console/dynamic-plugin-sdk/src/extensions/topology-details';
import { ManagedByOperatorLink } from '@console/internal/components/utils/managed-by';
import TopologySideBarTabSection from '@console/topology/src/components/side-bar/TopologySideBarTabSection';
import { TYPE_WORKLOAD } from '@console/topology/src/const';
import { getResource } from '@console/topology/src/utils';

export const useManagedByOperatorLinkSideBarTabSection: DetailsTabSectionExtensionHook = (
  element: GraphElement,
) => {
  if (element.getType() !== TYPE_WORKLOAD && !element.getData()?.data?.isKnativeResource) {
    return [undefined, true, undefined];
  }
  const resource = getResource(element);
  if (!resource) {
    return [undefined, true, undefined];
  }
  const section = (
    <TopologySideBarTabSection>
      <ManagedByOperatorLink obj={resource} />
    </TopologySideBarTabSection>
  );
  return [section, true, undefined];
};
