import {
  ClusterConfigurationTabGroup,
  ResolvedClusterConfigurationGroup,
  ResolvedClusterConfigurationItem,
} from './types';

export const getClusterConfigurationGroups = (
  clusterConfigurationGroups: ResolvedClusterConfigurationGroup[],
  clusterConfigurationItems: ResolvedClusterConfigurationItem[],
): ClusterConfigurationTabGroup[] => {
  if (!clusterConfigurationItems?.length || !clusterConfigurationGroups?.length) {
    return [];
  }
  const initialClusterConfigurationGroup: ClusterConfigurationTabGroup[] = clusterConfigurationGroups.map(
    (clusterConfigurationGroup) => ({
      ...clusterConfigurationGroup,
      items: [],
    }),
  );
  const populatedClusterConfigurationGroup: ClusterConfigurationTabGroup[] = clusterConfigurationItems
    .filter((clusterConfigurationItem) =>
      clusterConfigurationGroups.find(
        (clusterConfigurationGroup) =>
          clusterConfigurationGroup.id === clusterConfigurationItem.groupId,
      ),
    )
    .reduce(
      (
        clusterConfigurationGroup: typeof initialClusterConfigurationGroup,
        currClusterConfigurationItem,
      ) => {
        const clusterConfigurationGroupForCurrentItem = clusterConfigurationGroup.find(
          (group) => currClusterConfigurationItem.groupId === group.id,
        );
        if (clusterConfigurationGroupForCurrentItem) {
          clusterConfigurationGroupForCurrentItem.items.push(currClusterConfigurationItem);
        } else {
          clusterConfigurationGroup.push({
            id: currClusterConfigurationItem.id,
            label: currClusterConfigurationItem.label,
            items: [currClusterConfigurationItem],
          });
        }
        return clusterConfigurationGroup;
      },
      initialClusterConfigurationGroup,
    );
  return populatedClusterConfigurationGroup.filter((group) => group.items.length);
};
