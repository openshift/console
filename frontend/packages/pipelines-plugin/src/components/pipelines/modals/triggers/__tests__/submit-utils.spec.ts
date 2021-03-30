import * as k8s from '@console/internal/module/k8s';
import { EventListenerModel, TriggerTemplateModel } from '../../../../../models';
import { PipelineExampleNames, pipelineTestData } from '../../../../../test-data/pipeline-data';
import { formValues } from '../../../../../test-data/trigger-data';
import { PIPELINE_GA_VERSION } from '../../../const';
import * as operatorUtils from '../../../utils/pipeline-operator';
import * as submitUtils from '../submit-utils';

const pipelineData = pipelineTestData[PipelineExampleNames.WORKSPACE_PIPELINE];

describe('submitTrigger', () => {
  beforeAll(() => {
    jest.spyOn(k8s, 'k8sCreate').mockImplementation((model, data) => Promise.resolve(data));
    jest.spyOn(submitUtils, 'exposeRoute').mockImplementation(() => Promise.resolve());
  });
  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('expect to use template.name when pipeline GA operator is not installed', async () => {
    jest.spyOn(operatorUtils, 'getPipelineOperatorVersion').mockReturnValue({ version: '1.3.1' });
    try {
      const resources = await submitUtils.submitTrigger(pipelineData.pipeline, formValues);
      expect(resources).toHaveLength(2);
      const eventListener = resources.find((r) => r.kind === EventListenerModel.kind);
      expect(resources.find((r) => r.kind === TriggerTemplateModel.kind)).toBeDefined();
      expect(eventListener).toBeDefined();
      expect(eventListener.spec.triggers[0].template.ref).toBeUndefined();
      expect(eventListener.spec.triggers[0].template.name).toBeTruthy();
    } catch (e) {
      fail(e);
    }
  });

  it('expect to use template.ref when pipeline GA operator is installed', async () => {
    jest
      .spyOn(operatorUtils, 'getPipelineOperatorVersion')
      .mockReturnValue({ version: PIPELINE_GA_VERSION });
    try {
      const resources = await submitUtils.submitTrigger(pipelineData.pipeline, formValues);
      expect(resources).toHaveLength(2);
      const eventListener = resources.find((r) => r.kind === EventListenerModel.kind);
      expect(resources.find((r) => r.kind === TriggerTemplateModel.kind)).toBeDefined();
      expect(eventListener).toBeDefined();
      expect(eventListener.spec.triggers[0].template.ref).toBeTruthy();
      expect(eventListener.spec.triggers[0].template.name).toBeUndefined();
    } catch (e) {
      fail(e);
    }
  });
});
