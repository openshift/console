import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { DetailsTabSectionExtensionHook } from '@console/dynamic-plugin-sdk/src/extensions/topology-details';
import TopologySideBarTabSection from '@console/topology/src/components/side-bar/TopologySideBarTabSection';
import BuildsOverview from './BuildOverview';

export const useBuildSideBarTabSection: DetailsTabSectionExtensionHook = (
  element: GraphElement,
) => {
  const data = element.getData();
  const resources = data?.resources;

  // This check is based on the properties added through getShipwrightDataModelReconciler
  if (!resources?.builds) {
    return [undefined, true, undefined];
  }

  const section = (
    <TopologySideBarTabSection>
      <BuildsOverview item={resources} />
    </TopologySideBarTabSection>
  );
  return [section, true, undefined];
};
