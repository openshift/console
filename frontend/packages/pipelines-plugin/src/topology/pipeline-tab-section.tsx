import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { DetailsTabSectionExtensionHook } from '@console/dynamic-plugin-sdk/src/extensions/topology-details';
import TopologySideBarTabSection from '@console/topology/src/components/side-bar/TopologySideBarTabSection';
import PipelinesOverview from '../components/pipelines/pipeline-overview/PipelineOverview';

export const usePipelinesSideBarTabSection: DetailsTabSectionExtensionHook = (
  element: GraphElement,
) => {
  const data = element.getData();
  const resources = data?.resources;
  // This check is based on the properties added through getPipelinesDataModelReconciler
  if (!resources?.pipelines) {
    return [undefined, true, undefined];
  }
  const section = (
    <TopologySideBarTabSection>
      <PipelinesOverview item={resources} />
    </TopologySideBarTabSection>
  );
  return [section, true, undefined];
};
