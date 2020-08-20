import * as React from 'react';
import {
  ResourceIcon,
  ResourceLink,
  SimpleTabNav,
  ResourceSummary,
  SectionHeading,
  Kebab,
  ActionsMenu,
} from '@console/internal/components/utils';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import { OdcBaseEdge } from '../elements';
import TopologyEdgeResourcesPanel from '../TopologyEdgeResourcesPanel';

export type TopologyServiceBindingRequestPanelProps = {
  edge: OdcBaseEdge;
};

const TopologyServiceBindingRequestPanel: React.FC<TopologyServiceBindingRequestPanelProps> = ({
  edge,
}) => {
  const sbr = edge.getResource();
  const ResourcesSection = () => <TopologyEdgeResourcesPanel edge={edge} />;
  const DetailsSection = () => (
    <div className="overview__sidebar-pane-body">
      <SectionHeading text="Details" />
      <ResourceSummary resource={sbr} />
    </div>
  );
  const { common } = Kebab.factory;
  const menuActions = [
    ...Kebab.getExtensionsActionsForKind(modelFor(referenceFor(sbr))),
    ...common,
  ];
  const actions = menuActions.map((a) => a(modelFor(referenceFor(sbr)), sbr));

  return (
    <div className="overview__sidebar-pane resource-overview">
      <div className="overview__sidebar-pane-head resource-overview__heading">
        <h1 className="co-m-pane__heading">
          <div className="co-m-pane__name co-resource-item">
            <ResourceIcon kind={sbr.kind} />
            <ResourceLink
              kind={referenceFor(sbr)}
              name={sbr.metadata.name}
              namespace={sbr.metadata.namespace}
              hideIcon
            />
          </div>
          <div className="co-actions">
            <ActionsMenu actions={actions} />
          </div>
        </h1>
      </div>
      <SimpleTabNav
        tabs={[
          { name: 'Details', component: DetailsSection },
          { name: 'Resources', component: ResourcesSection },
        ]}
        tabProps={null}
        additionalClassNames="co-m-horizontal-nav__menu--within-sidebar co-m-horizontal-nav__menu--within-overview-sidebar"
      />
    </div>
  );
};

export default TopologyServiceBindingRequestPanel;
