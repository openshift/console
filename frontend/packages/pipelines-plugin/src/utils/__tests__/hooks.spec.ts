import { TechPreviewBadge } from '@console/shared';
import { PIPELINE_GA_VERSION, TRIGGERS_GA_VERSION } from '../../components/pipelines/const';
import * as operatorUtils from '../../components/pipelines/utils/pipeline-operator';
import { testHook } from '../../test-data/test-utils';
import { usePipelineTechPreviewBadge, useTriggersTechPreviewBadge } from '../hooks';

describe('usePipelineTechPreviewBadge:', () => {
  it('should return the badge if pipeline GA opertaor is installed', () => {
    jest
      .spyOn(operatorUtils, 'usePipelineOperatorVersion')
      .mockReturnValue({ version: '1.3.1' } as any);
    testHook(() => {
      const badge = usePipelineTechPreviewBadge('test-ns');
      expect(badge).toBeDefined();
    });
  });

  it('should return not return badge if pipelien GA opertaor is installed', () => {
    jest
      .spyOn(operatorUtils, 'usePipelineOperatorVersion')
      .mockReturnValue({ version: PIPELINE_GA_VERSION } as any);
    testHook(() => {
      const badge = usePipelineTechPreviewBadge('test-ns');
      expect(badge).toBeNull();
    });
  });
});

describe('useTriggersTechPreviewBadge:', () => {
  it('should return the badge if triggers GA operator is not installed', () => {
    jest
      .spyOn(operatorUtils, 'usePipelineOperatorVersion')
      .mockReturnValue({ version: '1.5.2' } as any);
    testHook(() => {
      const badge = useTriggersTechPreviewBadge('test-ns');
      expect(badge.type).toEqual(TechPreviewBadge);
    });
  });

  it('should not return the badge if triggers GA operator is installed', () => {
    jest
      .spyOn(operatorUtils, 'usePipelineOperatorVersion')
      .mockReturnValue({ version: TRIGGERS_GA_VERSION } as any);
    testHook(() => {
      const badge = usePipelineTechPreviewBadge('test-ns');
      expect(badge).toBeNull();
    });
  });
});
