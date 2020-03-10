import * as React from 'react';
import { K8sResourceKind, modelFor } from '@console/internal/module/k8s';
import { SidebarSectionHeading } from '@console/internal/components/utils';
import TopologyHelmReleaseResourceList from './TopologyHelmReleaseResourceList';

type TopologyHelmReleaseResourcesPanelProps = {
  manifestResources: K8sResourceKind[];
};

const TopologyHelmReleaseResourcesPanel: React.SFC<TopologyHelmReleaseResourcesPanelProps> = ({
  manifestResources,
}) => {
  const kinds = manifestResources
    .reduce((resourceKinds, resource) => {
      if (!resourceKinds.includes(resource.kind)) {
        resourceKinds.push(resource.kind);
      }
      return resourceKinds;
    }, [])
    .sort((a, b) => a.localeCompare(b));

  const resourceLists = kinds.reduce((lists, kind) => {
    const model = modelFor(kind);
    const resources = manifestResources.filter((resource) => resource.kind === model.kind);
    if (resources.length) {
      lists.push(
        <div key={model.kind}>
          <SidebarSectionHeading text={model.labelPlural} />
          <TopologyHelmReleaseResourceList resources={resources} />
        </div>,
      );
    }
    return lists;
  }, []);

  return <div className="overview__sidebar-pane-body">{resourceLists}</div>;
};

export default TopologyHelmReleaseResourcesPanel;
