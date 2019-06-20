import { getPipelineTasks } from '../pipeline-utils';
import { mockPipelinesJSON } from './pipeline-test-data';

describe('pipeline-utils ', () => {
  it('For first pipeline there should be 2 stages of length [0:[1],1:[2]]', () => {
    const stages = getPipelineTasks(mockPipelinesJSON[0]);
    expect(stages).toHaveLength(2);
    expect(stages[0]).toHaveLength(1);
    expect(stages[1]).toHaveLength(1);
  });
  it('should transform pipelines', () => {
    const stages = getPipelineTasks(mockPipelinesJSON[1]);
    expect(stages).toHaveLength(4);
    expect(stages[0]).toHaveLength(1);
    expect(stages[1]).toHaveLength(2);
    expect(stages[2]).toHaveLength(2);
    expect(stages[3]).toHaveLength(1);
  });
});
