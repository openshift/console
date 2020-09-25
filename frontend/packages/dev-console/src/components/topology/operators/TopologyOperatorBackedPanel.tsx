import * as React from 'react';
import { SimpleTabNav, ResourceSummary, SectionHeading } from '@console/internal/components/utils';
import TopologyOperatorBackedResources from './TopologyOperatorBackedResources';
import { TopologyDataObject } from '../topology-types';
import { OperatorGroupData } from './operator-topology-types';
import { ManagedByOperatorResourceLink } from '@console/internal/components/utils/managed-by';

export type TopologyOperatorBackedPanelProps = {
  item: TopologyDataObject<OperatorGroupData>;
};

const TopologyOperatorBackedPanel: React.FC<TopologyOperatorBackedPanelProps> = ({ item }) => {
  const { name, resource } = item;
  const csvName = resource.metadata.selfLink.split('/').pop();
  const ResourcesSection = () => <TopologyOperatorBackedResources item={item} />;
  const DetailsSection = () => (
    <div className="overview__sidebar-pane-body">
      <SectionHeading text="Operator Details" />
      <ResourceSummary resource={resource} />
    </div>
  );

  return (
    <div className="overview__sidebar-pane resource-overview">
      <div className="overview__sidebar-pane-head resource-overview__heading">
        <h1 className="co-m-pane__heading">
          <div className="co-m-pane__name co-resource-item">
            <ManagedByOperatorResourceLink
              csvName={csvName}
              namespace={resource.metadata.namespace}
              owner={{
                name,
                kind: resource.kind,
                uid: resource.metadata.uid,
                apiVersion: resource.apiVersion,
              }}
            />
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

export default TopologyOperatorBackedPanel;
