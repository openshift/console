import type { NodeKind } from '@console/dynamic-plugin-sdk/src';

export const GROUP_ANNOTATION = 'node.openshift.io/group';
export const GROUP_SEPARATOR = ',';

export type GroupNameMap = Record<string, string[]>;

export const getGroupsFromGroupAnnotation = (groupAnnotation?: string): string[] => [
  ...new Set(
    groupAnnotation
      ?.split(GROUP_SEPARATOR)
      .map((g) => g.trim())
      .filter((g) => g.length > 0) ?? [],
  ),
];

export const getNodeGroupAnnotationFromGroups = (groups: string[]): string =>
  groups.join(GROUP_SEPARATOR);

export const getNodeGroups = (node: NodeKind): string[] =>
  getGroupsFromGroupAnnotation(node.metadata.annotations?.[GROUP_ANNOTATION]);

export const getExistingGroups = (nodes: NodeKind[]): string[] => {
  const uniqueGroups = new Set<string>();
  nodes.forEach((node) => {
    getNodeGroups(node).forEach((group) => {
      uniqueGroups.add(group);
    });
  });
  return Array.from(uniqueGroups).sort((a, b) => a.localeCompare(b));
};

export const getGroupsByNameFromNodes = (nodes: NodeKind[]): GroupNameMap => {
  const updatedGroupsByName: GroupNameMap = {};

  nodes.forEach((node) => {
    const groupNames = getNodeGroups(node);
    groupNames.forEach((groupName) => {
      const existingGroup = updatedGroupsByName[groupName] ?? [];
      updatedGroupsByName[groupName] = [...existingGroup, node.metadata.name];
    });
  });
  return updatedGroupsByName;
};

export const getNodeGroupAnnotationFromGroupNameMap = (
  nodeName: string,
  groupsByName: GroupNameMap,
): string | undefined => {
  const groups = Object.keys(groupsByName).filter((key) => groupsByName[key].includes(nodeName));
  return groups.length ? getNodeGroupAnnotationFromGroups(groups) : undefined;
};
