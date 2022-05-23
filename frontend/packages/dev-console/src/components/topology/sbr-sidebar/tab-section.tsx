import * as React from 'react';
import { Edge, GraphElement } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import { K8sResourceCommon } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { DetailsTabSectionExtensionHook } from '@console/dynamic-plugin-sdk/src/extensions/topology-details';
import { ResourceSummary, SectionHeading } from '@console/internal/components/utils';
import TopologyEdgeResourcesPanel from '@console/topology/src/components/side-bar/TopologyEdgeResourcesPanel';
import { TYPE_SERVICE_BINDING } from '@console/topology/src/const';
import { getResource } from '@console/topology/src/utils';

const DetailsSection: React.FC<{ resource: K8sResourceCommon }> = ({ resource }) => {
  const { t } = useTranslation();
  return (
    <div className="overview__sidebar-pane-body">
      <SectionHeading text={t('devconsole~Details')} />
      <ResourceSummary resource={resource} />
    </div>
  );
};

export const useSbrPanelDetailsSection: DetailsTabSectionExtensionHook = (
  element: GraphElement,
) => {
  if (element.getType() !== TYPE_SERVICE_BINDING) {
    return [undefined, true, undefined];
  }
  const resource = getResource(element);
  const section = <DetailsSection resource={resource} />;
  return [section, true, undefined];
};

export const useSbrPanelResourceSection: DetailsTabSectionExtensionHook = (element: Edge) => {
  if (element.getType() !== TYPE_SERVICE_BINDING) {
    return [undefined, true, undefined];
  }
  const section = <TopologyEdgeResourcesPanel edge={element} />;
  return [section, true, undefined];
};
