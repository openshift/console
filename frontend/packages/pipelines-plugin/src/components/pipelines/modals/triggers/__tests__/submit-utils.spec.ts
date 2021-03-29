import { SemVer } from 'semver';
import * as k8s from '@console/internal/module/k8s';
import { EventListenerModel } from '../../../../../models';
import { PipelineExampleNames, pipelineTestData } from '../../../../../test-data/pipeline-data';
import { formValues } from './trigger-data';
import * as operatorUtils from '../../../utils/pipeline-operator';
import { submitTrigger } from '../submit-utils';

const pipelineData = pipelineTestData[PipelineExampleNames.WORKSPACE_PIPELINE];

describe('submitTrigger', () => {
  beforeAll(() => {
    jest.spyOn(k8s, 'k8sCreate').mockImplementation((model, data) => Promise.resolve(data));
    jest.spyOn(k8s, 'k8sGet').mockImplementation(() => Promise.resolve());
  });
  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('expect the eventlistener to contain template.name if the operator is below GA version (1.4.0)', async () => {
    jest.spyOn(operatorUtils, 'getPipelineOperatorVersion').mockReturnValue(new SemVer('1.3.0'));
    try {
      const resources = await submitTrigger(pipelineData.pipeline, formValues);
      const el = resources.find((r) => r.kind === EventListenerModel.kind);
      expect(el.spec.triggers[0].template.name).toBeDefined();
    } catch (e) {
      fail(e);
    }
  });

  it('expect the eventlistener to contain template.ref if the operator is GA version (1.4.0)', async () => {
    jest.spyOn(operatorUtils, 'getPipelineOperatorVersion').mockReturnValue(new SemVer('1.4.0'));
    try {
      const resources = await submitTrigger(pipelineData.pipeline, formValues);
      const el = resources.find((r) => r.kind === EventListenerModel.kind);
      expect(el.spec.triggers[0].template.ref).toBeDefined();
    } catch (e) {
      fail(e);
    }
  });
});
