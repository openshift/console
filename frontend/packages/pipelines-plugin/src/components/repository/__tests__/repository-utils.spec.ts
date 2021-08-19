import { getLatestRepositoryPLRName } from '../repository-utils';
import { mockRepository } from './repository-mock';

describe('repository-util', () => {
  it('should return latest pipelineRun name', () => {
    const pipelineRunName = getLatestRepositoryPLRName(mockRepository);
    expect(pipelineRunName).toBe('pipeline-as-code-on-pull-request-zpgx7');
  });
});
