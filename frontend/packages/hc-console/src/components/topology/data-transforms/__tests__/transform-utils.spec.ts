import { Group } from '../../topology-types';
import { mergeGroup } from '../transform-utils';

describe('transform-utils', () => {
  describe('mergeGroup-util', () => {
    let mockgroupData: Group[];
    beforeEach(() => {
      mockgroupData = [
        { id: '0001', name: 'gryffindor', type: 'hogwarts', nodes: ['011', '012', '013'] },
      ];
    });
    it('should create a new group if newGroup doesnt already exists', () => {
      const newGroup: Group = {
        id: '0002',
        name: 'slytherin',
        type: 'hogwarts',
        nodes: ['021', '022', '023'],
      };
      const expectedResult = [...mockgroupData, newGroup];
      mergeGroup(newGroup, mockgroupData);
      expect(mockgroupData).toHaveLength(2);
      expect(mockgroupData).toEqual(expectedResult);
    });

    it('should add the data to an existing group if new group already exists', () => {
      const newGroup = {
        id: '0001',
        name: 'gryffindor',
        type: 'hogwarts',
        nodes: ['011', '015', '016'],
      };
      const expectedResult = [{ ...mockgroupData[0], nodes: ['011', '012', '013', '015', '016'] }];
      mergeGroup(newGroup, mockgroupData);
      expect(mockgroupData).toHaveLength(1);
      expect(mockgroupData).toEqual(expectedResult);
    });
  });
});
