import * as k8s from '@console/internal/module/k8s';
import * as utils from '../resource-utils';
import { EventListenerModel, TriggerModel, TriggerTemplateModel } from '../../../../../models';
import { PipelineExampleNames, pipelineTestData } from '../../../../../test-data/pipeline-data';
import { formValues } from '../../../../../test-data/trigger-data';
import * as operatorUtils from '../../../utils/pipeline-operator';
import { submitTrigger } from '../submit-utils';

const pipelineData = pipelineTestData[PipelineExampleNames.WORKSPACE_PIPELINE];

describe('submitTrigger', () => {
  beforeAll(() => {
    jest.spyOn(k8s, 'k8sCreate').mockImplementation((model, data) => Promise.resolve(data));
    jest.spyOn(operatorUtils, 'getPipelineOperatorVersion').mockReturnValue({ version: '1.3.1' });
  });
  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('expect to run the new flow when trigger resource dry run results in success', async () => {
    jest.spyOn(utils, 'dryRunTriggerResource').mockReturnValue(true);
    try {
      const resources = await submitTrigger(pipelineData.pipeline, formValues);
      expect(resources).toHaveLength(3);
      expect(resources.find((r) => r.kind === TriggerModel.kind)).toBeDefined();
      expect(resources.find((r) => r.kind === TriggerTemplateModel.kind)).toBeDefined();
      expect(resources.find((r) => r.kind === EventListenerModel.kind)).toBeDefined();
    } catch (e) {
      fail(e);
    }
  });

  it('expect to the eventlistener to contain triggerRef', async () => {
    jest.spyOn(utils, 'dryRunTriggerResource').mockReturnValue(true);
    try {
      const resources = await submitTrigger(pipelineData.pipeline, formValues);
      const el = resources.find((r) => r.kind === EventListenerModel.kind);
      expect(el.spec.triggers[0].triggerRef).toBeDefined();
    } catch (e) {
      fail(e);
    }
  });

  it('expect to fallback to the old flow when trigger resource dry run results in not found', async () => {
    jest.spyOn(utils, 'dryRunTriggerResource').mockReturnValue(false);
    try {
      const resources = await submitTrigger(pipelineData.pipeline, formValues);
      expect(resources).toHaveLength(2);
      expect(resources.find((r) => r.kind === TriggerTemplateModel.kind)).toBeDefined();
      expect(resources.find((r) => r.kind === EventListenerModel.kind)).toBeDefined();
    } catch (e) {
      fail(e);
    }
  });
});
