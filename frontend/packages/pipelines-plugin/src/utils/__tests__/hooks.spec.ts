import { PIPELINE_GA_VERSION } from '../../components/pipelines/const';
import * as operatorUtils from '../../components/pipelines/utils/pipeline-operator';
import { testHook } from '../../test-data/test-utils';
import { usePipelineTechPreviewBadge } from '../hooks';

describe('usePipelineTechPreviewBadge:', () => {
  it('should return the badge if pipeline GA opertaor is installed', () => {
    jest.spyOn(operatorUtils, 'usePipelineOperatorVersion').mockReturnValue({ version: '1.3.1' });
    testHook(() => {
      const badge = usePipelineTechPreviewBadge('test-ns');
      expect(badge).toBeDefined();
    });
  });

  it('should return not return badge if pipelien GA opertaor is installed', () => {
    jest
      .spyOn(operatorUtils, 'usePipelineOperatorVersion')
      .mockReturnValue({ version: PIPELINE_GA_VERSION });
    testHook(() => {
      const badge = usePipelineTechPreviewBadge('test-ns');
      expect(badge).toBeNull();
    });
  });
});
