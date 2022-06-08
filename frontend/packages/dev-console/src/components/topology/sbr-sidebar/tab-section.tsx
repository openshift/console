import * as React from 'react';
import { Edge, GraphElement } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import { DetailsTabSectionExtensionHook } from '@console/dynamic-plugin-sdk/src/extensions/topology-details';
import { ResourceSummary, SectionHeading } from '@console/internal/components/utils';
import ServiceBindingSummary from '@console/service-binding-plugin/src/components/service-binding-details/ServiceBindingSummary';
import { ServiceBinding } from '@console/service-binding-plugin/src/types';
import TopologyEdgeResourcesPanel from '@console/topology/src/components/side-bar/TopologyEdgeResourcesPanel';
import { TYPE_SERVICE_BINDING } from '@console/topology/src/const';
import { getResource } from '@console/topology/src/utils';

const DetailsSection: React.FC<{ resource: ServiceBinding }> = ({ resource }) => {
  const { t } = useTranslation();
  return (
    <div className="overview__sidebar-pane-body">
      <SectionHeading text={t('devconsole~Details')} />
      <div className="resource-overview__body">
        <div className="resource-overview__summary">
          <ResourceSummary resource={resource} />
        </div>
        <div className="resource-overview__details">
          <ServiceBindingSummary serviceBinding={resource} />
        </div>
      </div>
    </div>
  );
};

export const useSbrPanelDetailsSection: DetailsTabSectionExtensionHook = (
  element: GraphElement,
) => {
  if (element.getType() !== TYPE_SERVICE_BINDING) {
    return [undefined, true, undefined];
  }
  const resource = getResource<ServiceBinding>(element);
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
