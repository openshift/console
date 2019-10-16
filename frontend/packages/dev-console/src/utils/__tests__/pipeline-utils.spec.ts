import {
  LOG_SOURCE_RESTARTING,
  LOG_SOURCE_WAITING,
  LOG_SOURCE_RUNNING,
  LOG_SOURCE_TERMINATED,
} from '@console/internal/components/utils';
import { getPipelineTasks, containerToLogSourceStatus } from '../pipeline-utils';
import { mockPipelinesJSON } from './pipeline-test-data';

describe('pipeline-utils ', () => {
  it('For first pipeline there should be 1 stages of length 2', () => {
    const stages = getPipelineTasks(mockPipelinesJSON[0]);
    expect(stages).toHaveLength(1);
    expect(stages[0]).toHaveLength(2);
  });
  it('should transform pipelines', () => {
    const stages = getPipelineTasks(mockPipelinesJSON[1]);
    expect(stages).toHaveLength(4);
    expect(stages[0]).toHaveLength(1);
    expect(stages[1]).toHaveLength(2);
    expect(stages[2]).toHaveLength(2);
    expect(stages[3]).toHaveLength(1);
  });
  it('should return correct Container Status', () => {
    let status = containerToLogSourceStatus({ state: { waiting: {} } });
    expect(status).toBe(LOG_SOURCE_WAITING);
    status = containerToLogSourceStatus({ state: { waiting: {} }, lastState: LOG_SOURCE_WAITING });
    expect(status).toBe(LOG_SOURCE_RESTARTING);
    status = containerToLogSourceStatus({ state: { running: {} } });
    expect(status).toBe(LOG_SOURCE_RUNNING);
    status = containerToLogSourceStatus({ state: { terminated: {} } });
    expect(status).toBe(LOG_SOURCE_TERMINATED);
  });
});
