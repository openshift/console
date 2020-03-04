import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  navFactory,
  ResourceIcon,
  SimpleTabNav,
  StatusBox,
} from '@console/internal/components/utils';
import { Node } from '@console/topology';
import HelmReleaseOverview from '../helm/HelmReleaseOverview';

export type TopologyHelmReleasePanelProps = {
  helmRelease: Node;
};

const TopologyHelmReleasePanel: React.FC<TopologyHelmReleasePanelProps> = ({ helmRelease }) => {
  const secret = helmRelease.getData().resources.obj;
  const { namespace, labels } = secret?.metadata || {};

  if (!secret || !labels) {
    return (
      <StatusBox
        loaded
        loadError={{ message: `Unable to find resource for ${helmRelease.getLabel()}` }}
      />
    );
  }

  return (
    <div className="overview__sidebar-pane resource-overview">
      <div className="overview__sidebar-pane-head resource-overview__heading">
        <h1 className="co-m-pane__heading">
          <div className="co-m-pane__name co-resource-item">
            <ResourceIcon className="co-m-resource-icon--lg" kind="HelmRelease" />
            <Link
              to={`/helm-releases/ns/${namespace}/release/${labels.name}`}
              className="co-resource-item__resource-name"
            >
              {labels.name}
            </Link>
          </div>
        </h1>
      </div>
      <SimpleTabNav
        selectedTab={'Details'}
        tabs={[{ name: 'Details', component: navFactory.details(HelmReleaseOverview).component }]}
        tabProps={{ obj: secret }}
        additionalClassNames="co-m-horizontal-nav__menu--within-sidebar co-m-horizontal-nav__menu--within-overview-sidebar"
      />
    </div>
  );
};

export default TopologyHelmReleasePanel;
