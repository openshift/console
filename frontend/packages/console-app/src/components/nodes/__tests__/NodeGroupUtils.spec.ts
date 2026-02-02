import type { NodeKind } from '@console/dynamic-plugin-sdk/src';
import type { GroupNameMap } from '../NodeGroupUtils';
import {
  GROUP_ANNOTATION,
  getGroupsFromGroupAnnotation,
  getNodeGroupAnnotationFromGroups,
  getNodeGroups,
  getExistingGroups,
  getGroupsByNameFromNodes,
  getNodeGroupAnnotationFromGroupNameMap,
} from '../NodeGroupUtils';

describe('NodeGroupUtils', () => {
  describe('getGroupsFromGroupAnnotation', () => {
    it('should split comma-separated groups', () => {
      const result = getGroupsFromGroupAnnotation('group1,group2,group3');
      expect(result).toEqual(['group1', 'group2', 'group3']);
    });

    it('should trim whitespace from groups', () => {
      const result = getGroupsFromGroupAnnotation(' group1 , group2 , group3 ');
      expect(result).toEqual(['group1', 'group2', 'group3']);
    });

    it('should filter out empty strings', () => {
      const result = getGroupsFromGroupAnnotation('group1,,group2,,,group3');
      expect(result).toEqual(['group1', 'group2', 'group3']);
    });

    it('should handle whitespace-only segments', () => {
      const result = getGroupsFromGroupAnnotation('group1,  ,group2,   ,group3');
      expect(result).toEqual(['group1', 'group2', 'group3']);
    });

    it('should return empty array for undefined input', () => {
      const result = getGroupsFromGroupAnnotation(undefined);
      expect(result).toEqual([]);
    });

    it('should return empty array for empty string', () => {
      const result = getGroupsFromGroupAnnotation('');
      expect(result).toEqual([]);
    });

    it('should return empty array for whitespace-only string', () => {
      const result = getGroupsFromGroupAnnotation('   ');
      expect(result).toEqual([]);
    });

    it('should handle single group', () => {
      const result = getGroupsFromGroupAnnotation('single-group');
      expect(result).toEqual(['single-group']);
    });

    it('should handle groups with special characters', () => {
      const result = getGroupsFromGroupAnnotation('prod-us-east-1,dev-eu-west-2');
      expect(result).toEqual(['prod-us-east-1', 'dev-eu-west-2']);
    });
  });

  describe('getNodeGroupAnnotationFromGroups', () => {
    it('should join groups with comma separator', () => {
      const result = getNodeGroupAnnotationFromGroups(['group1', 'group2', 'group3']);
      expect(result).toBe('group1,group2,group3');
    });

    it('should handle single group', () => {
      const result = getNodeGroupAnnotationFromGroups(['single-group']);
      expect(result).toBe('single-group');
    });

    it('should handle empty array', () => {
      const result = getNodeGroupAnnotationFromGroups([]);
      expect(result).toBe('');
    });

    it('should preserve group order', () => {
      const result = getNodeGroupAnnotationFromGroups(['z-group', 'a-group', 'm-group']);
      expect(result).toBe('z-group,a-group,m-group');
    });
  });

  describe('getNodeGroups', () => {
    it('should extract groups from node annotation', () => {
      const node: Partial<NodeKind> = {
        metadata: {
          name: 'node1',
          annotations: {
            [GROUP_ANNOTATION]: 'group1,group2,group3',
          },
        },
      };

      const result = getNodeGroups(node as NodeKind);
      expect(result).toEqual(['group1', 'group2', 'group3']);
    });

    it('should return empty array when annotation is missing', () => {
      const node: NodeKind = {
        metadata: {
          name: 'node1',
        },
      } as NodeKind;

      const result = getNodeGroups(node);
      expect(result).toEqual([]);
    });

    it('should return empty array when annotations object is missing', () => {
      const node: Partial<NodeKind> = {
        metadata: {
          name: 'node1',
          annotations: {},
        },
      } as NodeKind;

      const result = getNodeGroups(node as NodeKind);
      expect(result).toEqual([]);
    });

    it('should handle empty annotation value', () => {
      const node: Partial<NodeKind> = {
        metadata: {
          name: 'node1',
          annotations: {
            [GROUP_ANNOTATION]: '',
          },
        },
      };

      const result = getNodeGroups(node as NodeKind);
      expect(result).toEqual([]);
    });

    it('should trim whitespace from groups in annotation', () => {
      const node: Partial<NodeKind> = {
        metadata: {
          name: 'node1',
          annotations: {
            [GROUP_ANNOTATION]: ' group1 , group2 , group3 ',
          },
        },
      };

      const result = getNodeGroups(node as NodeKind);
      expect(result).toEqual(['group1', 'group2', 'group3']);
    });
  });

  describe('getExistingGroups', () => {
    it('should return unique groups from all nodes sorted alphabetically', () => {
      const nodes: Partial<NodeKind>[] = [
        {
          metadata: {
            name: 'node1',
            annotations: { [GROUP_ANNOTATION]: 'group-c,group-a' },
          },
        },
        {
          metadata: {
            name: 'node2',
            annotations: { [GROUP_ANNOTATION]: 'group-b,group-a' },
          },
        },
        {
          metadata: {
            name: 'node3',
            annotations: { [GROUP_ANNOTATION]: 'group-c,group-d' },
          },
        },
      ];

      const result = getExistingGroups(nodes as NodeKind[]);
      expect(result).toEqual(['group-a', 'group-b', 'group-c', 'group-d']);
    });

    it('should handle nodes without annotations', () => {
      const nodes: Partial<NodeKind>[] = [
        {
          metadata: {
            name: 'node1',
            annotations: { [GROUP_ANNOTATION]: 'group-a' },
          },
        },
        {
          metadata: { name: 'node2' },
        },
        {
          metadata: {
            name: 'node3',
            annotations: { [GROUP_ANNOTATION]: 'group-b' },
          },
        },
      ];

      const result = getExistingGroups(nodes as NodeKind[]);
      expect(result).toEqual(['group-a', 'group-b']);
    });

    it('should return empty array for empty nodes array', () => {
      const result = getExistingGroups([]);
      expect(result).toEqual([]);
    });

    it('should return empty array when no nodes have groups', () => {
      const nodes: NodeKind[] = [
        { metadata: { name: 'node1' } } as NodeKind,
        { metadata: { name: 'node2' } } as NodeKind,
      ];

      const result = getExistingGroups(nodes);
      expect(result).toEqual([]);
    });

    it('should handle duplicate groups across nodes', () => {
      const nodes: Partial<NodeKind>[] = [
        {
          metadata: {
            name: 'node1',
            annotations: { [GROUP_ANNOTATION]: 'prod,staging' },
          },
        },
        {
          metadata: {
            name: 'node2',
            annotations: { [GROUP_ANNOTATION]: 'prod,dev' },
          },
        },
        {
          metadata: {
            name: 'node3',
            annotations: { [GROUP_ANNOTATION]: 'staging,dev' },
          },
        },
      ];

      const result = getExistingGroups(nodes as NodeKind[]);
      expect(result).toEqual(['dev', 'prod', 'staging']);
    });
  });

  describe('getGroupsByNameFromNodes', () => {
    it('should create map of group names to node names', () => {
      const nodes: Partial<NodeKind>[] = [
        {
          metadata: {
            name: 'node1',
            annotations: { [GROUP_ANNOTATION]: 'prod,us-east' },
          },
        },
        {
          metadata: {
            name: 'node2',
            annotations: { [GROUP_ANNOTATION]: 'prod,eu-west' },
          },
        },
        {
          metadata: {
            name: 'node3',
            annotations: { [GROUP_ANNOTATION]: 'dev,us-east' },
          },
        },
      ];

      const result = getGroupsByNameFromNodes(nodes as NodeKind[]);

      expect(result).toEqual({
        prod: ['node1', 'node2'],
        'us-east': ['node1', 'node3'],
        'eu-west': ['node2'],
        dev: ['node3'],
      });
    });

    it('should handle nodes without groups', () => {
      const nodes: Partial<NodeKind>[] = [
        {
          metadata: {
            name: 'node1',
            annotations: { [GROUP_ANNOTATION]: 'prod' },
          },
        },
        { metadata: { name: 'node2' } },
        {
          metadata: {
            name: 'node3',
            annotations: { [GROUP_ANNOTATION]: 'dev' },
          },
        },
      ];

      const result = getGroupsByNameFromNodes(nodes as NodeKind[]);

      expect(result).toEqual({
        prod: ['node1'],
        dev: ['node3'],
      });
    });

    it('should return empty object for empty nodes array', () => {
      const result = getGroupsByNameFromNodes([]);
      expect(result).toEqual({});
    });

    it('should return empty object when no nodes have groups', () => {
      const nodes: NodeKind[] = [
        { metadata: { name: 'node1' } } as NodeKind,
        { metadata: { name: 'node2' } } as NodeKind,
      ];

      const result = getGroupsByNameFromNodes(nodes);
      expect(result).toEqual({});
    });

    it('should handle single node with multiple groups', () => {
      const nodes: Partial<NodeKind>[] = [
        {
          metadata: {
            name: 'node1',
            annotations: { [GROUP_ANNOTATION]: 'group-a,group-b,group-c' },
          },
        },
      ];

      const result = getGroupsByNameFromNodes(nodes as NodeKind[]);

      expect(result).toEqual({
        'group-a': ['node1'],
        'group-b': ['node1'],
        'group-c': ['node1'],
      });
    });
  });

  describe('getNodeGroupAnnotationFromGroupNameMap', () => {
    it('should return comma-separated groups for a node', () => {
      const groupsByName: GroupNameMap = {
        prod: ['node1', 'node2'],
        staging: ['node1', 'node3'],
        dev: ['node3'],
      };

      const result = getNodeGroupAnnotationFromGroupNameMap('node1', groupsByName);
      expect(result).toBe('prod,staging');
    });

    it('should return undefined when node is not in any group', () => {
      const groupsByName: GroupNameMap = {
        prod: ['node1', 'node2'],
        dev: ['node3'],
      };

      const result = getNodeGroupAnnotationFromGroupNameMap('node4', groupsByName);
      expect(result).toBeUndefined();
    });

    it('should return single group for node in one group', () => {
      const groupsByName: GroupNameMap = {
        prod: ['node1', 'node2'],
        dev: ['node3'],
      };

      const result = getNodeGroupAnnotationFromGroupNameMap('node3', groupsByName);
      expect(result).toBe('dev');
    });

    it('should handle empty groupsByName', () => {
      const result = getNodeGroupAnnotationFromGroupNameMap('node1', {});
      expect(result).toBeUndefined();
    });

    it('should include all groups that contain the node', () => {
      const groupsByName: GroupNameMap = {
        'group-a': ['node1'],
        'group-b': ['node1', 'node2'],
        'group-c': ['node1', 'node2', 'node3'],
        'group-d': ['node2'],
      };

      const result = getNodeGroupAnnotationFromGroupNameMap('node1', groupsByName);
      expect(result).toBe('group-a,group-b,group-c');
    });

    it('should not include groups that do not contain the node', () => {
      const groupsByName: GroupNameMap = {
        'group-a': ['node1', 'node2'],
        'group-b': ['node3', 'node4'],
        'group-c': ['node1', 'node3'],
      };

      const result = getNodeGroupAnnotationFromGroupNameMap('node1', groupsByName);
      expect(result).toBe('group-a,group-c');
    });
  });

  describe('edge cases and integration', () => {
    it('should handle round-trip: node → groups → annotation → groups', () => {
      const node: Partial<NodeKind> = {
        metadata: {
          name: 'test-node',
          annotations: {
            [GROUP_ANNOTATION]: ' prod , staging , us-east ',
          },
        },
      };

      const groups = getNodeGroups(node as NodeKind);
      expect(groups).toEqual(['prod', 'staging', 'us-east']);

      const annotation = getNodeGroupAnnotationFromGroups(groups);
      expect(annotation).toBe('prod,staging,us-east');

      const groupsAgain = getGroupsFromGroupAnnotation(annotation);
      expect(groupsAgain).toEqual(['prod', 'staging', 'us-east']);
    });

    it('should handle complex multi-node scenario', () => {
      const nodes: Partial<NodeKind>[] = [
        {
          metadata: {
            name: 'node1',
            annotations: { [GROUP_ANNOTATION]: 'prod,us-east' },
          },
        },
        {
          metadata: {
            name: 'node2',
            annotations: { [GROUP_ANNOTATION]: 'prod,eu-west' },
          },
        },
        {
          metadata: {
            name: 'node3',
            annotations: { [GROUP_ANNOTATION]: 'staging,us-east' },
          },
        },
      ];

      // Get all unique groups
      const allGroups = getExistingGroups(nodes as NodeKind[]);
      expect(allGroups).toEqual(['eu-west', 'prod', 'staging', 'us-east']);

      // Get groups by name
      const groupsByName = getGroupsByNameFromNodes(nodes as NodeKind[]);
      expect(groupsByName).toEqual({
        prod: ['node1', 'node2'],
        'us-east': ['node1', 'node3'],
        'eu-west': ['node2'],
        staging: ['node3'],
      });

      // Get annotation for specific node
      const node1Annotation = getNodeGroupAnnotationFromGroupNameMap('node1', groupsByName);
      expect(node1Annotation).toBe('prod,us-east');
    });

    it('should handle nodes with inconsistent whitespace in annotations', () => {
      const nodes: Partial<NodeKind>[] = [
        {
          metadata: {
            name: 'node1',
            annotations: { [GROUP_ANNOTATION]: 'prod,staging' },
          },
        },
        {
          metadata: {
            name: 'node2',
            annotations: { [GROUP_ANNOTATION]: ' prod , staging ' },
          },
        },
        {
          metadata: {
            name: 'node3',
            annotations: { [GROUP_ANNOTATION]: '  prod  ,  staging  ' },
          },
        },
      ];

      const groupsByName = getGroupsByNameFromNodes(nodes as NodeKind[]);
      expect(groupsByName).toEqual({
        prod: ['node1', 'node2', 'node3'],
        staging: ['node1', 'node2', 'node3'],
      });
    });
  });
});
