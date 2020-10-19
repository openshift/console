import * as React from 'react';
import { K8sResourceKind, modelFor, referenceFor } from '@console/internal/module/k8s';
import { SidebarSectionHeading } from '@console/internal/components/utils';
import TopologyGroupResourceList from './TopologyGroupResourceList';

type TopologyGroupResourcesPanelProps = {
  manifestResources: K8sResourceKind[];
  releaseNamespace: string;
  linkForResource?: (obj: K8sResourceKind) => React.ReactElement;
};

const TopologyGroupResourcesPanel: React.SFC<TopologyGroupResourcesPanelProps> = ({
  manifestResources,
  releaseNamespace,
  linkForResource,
}) => {
  const kinds = manifestResources
    .reduce((resourceKinds, resource) => {
      const kind = referenceFor(resource);
      if (!resourceKinds.includes(kind)) {
        resourceKinds.push(kind);
      }
      return resourceKinds;
    }, [])
    .sort((a, b) => a.localeCompare(b));

  return kinds.reduce((lists, kind) => {
    const model = modelFor(kind);
    const resources = manifestResources.filter((resource) => resource.kind === model.kind);
    if (resources.length) {
      lists.push(
        <div key={model.kind}>
          <SidebarSectionHeading text={model.labelPlural} />
          <TopologyGroupResourceList
            resources={resources}
            releaseNamespace={releaseNamespace}
            linkForResource={linkForResource}
          />
        </div>,
      );
    }
    return lists;
  }, []);
};

export default TopologyGroupResourcesPanel;
