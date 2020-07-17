import * as React from 'react';
import {
  ResourceIcon,
  ResourceLink,
  SimpleTabNav,
  ResourceSummary,
  SectionHeading,
} from '@console/internal/components/utils';
import { referenceFor } from '@console/internal/module/k8s';
import TopologyOperatorBackedResources from './TopologyOperatorBackedResources';
import { TopologyDataObject } from '../topology-types';

export type TopologyOperatorBackedPanelProps = {
  item: TopologyDataObject<string>;
};

const TopologyOperatorBackedPanel: React.FC<TopologyOperatorBackedPanelProps> = ({ item }) => {
  const {
    name,
    resources: { obj },
  } = item;

  const ResourcesSection = () => <TopologyOperatorBackedResources item={item} />;
  const DetailsSection = () => (
    <div className="overview__sidebar-pane-body">
      <SectionHeading text="Operator Details" />
      <ResourceSummary resource={obj} />
    </div>
  );

  return (
    <div className="overview__sidebar-pane resource-overview">
      <div className="overview__sidebar-pane-head resource-overview__heading">
        <h1 className="co-m-pane__heading">
          <div className="co-m-pane__name co-resource-item">
            <ResourceIcon kind="Operator" />
            <ResourceLink
              kind={referenceFor(obj)}
              name={name}
              namespace={obj.metadata.namespace}
              hideIcon
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
