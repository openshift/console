import * as React from 'react';
import {
  useResolvedExtensions,
  NodeStatus,
  isNodeStatus,
  WatchK8sResource,
  WatchK8sResults,
  NodeKind,
} from '@console/dynamic-plugin-sdk';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';

type PopoverContent = {
  content: React.ReactNode;
  uid: string;
};

export type GetNodeStatusExtensions = (
  node: NodeKind,
) => {
  popoverContent: PopoverContent[];
  secondaryStatuses: string[];
};

export const useNodeStatusExtensions = () => {
  const [nodeStatusExtensions] = useResolvedExtensions<NodeStatus>(isNodeStatus);

  const pluginResources = React.useMemo(() => {
    const resources: { [key: string]: WatchK8sResource } = {};

    nodeStatusExtensions.forEach(({ properties, uid }) => {
      if (properties.resources) {
        Object.keys(properties.resources).forEach((key) => {
          resources[`${uid}-${key}`] = properties.resources[key];
        });
      }
    });
    return resources;
  }, [nodeStatusExtensions]);

  const extraResources = useK8sWatchResources(pluginResources);

  return React.useCallback<GetNodeStatusExtensions>(
    (node: NodeKind) => {
      const content: PopoverContent[] = [];
      const statuses: string[] = [];
      nodeStatusExtensions.forEach(
        ({ properties: { PopoverContent, title, isActive, resources }, uid, pluginID, type }) => {
          const pResources: WatchK8sResults<any> = {};
          if (resources) {
            Object.keys(resources).forEach((key) => {
              pResources[key] = extraResources[`${uid}-${key}`];
            });
          }
          try {
            if (isActive(node, pResources)) {
              content.push({
                content: <PopoverContent node={node} resources={pResources} />,
                uid,
              });
              statuses.push(title);
            }
          } catch (err) {
            // eslint-disable-next-line no-console
            console.error(`Extension ${pluginID}, ${type} failed:`, err);
          }
        },
      );
      return { popoverContent: content, secondaryStatuses: statuses };
    },
    [extraResources, nodeStatusExtensions],
  );
};
