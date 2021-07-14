import * as k8s from '@console/internal/module/k8s';
import { EventListenerModel, TriggerTemplateModel } from '../../../../../models';
import {
  EventlistenerTestData,
  EventlistenerTypes,
  TriggerTestData,
  TriggerTypes,
} from '../../../../../test-data/event-listener-data';
import { PipelineExampleNames, pipelineTestData } from '../../../../../test-data/pipeline-data';
import { EventListenerKind } from '../../../resource-types';
import { removeTrigger } from '../remove-utils';

const pipelineData = pipelineTestData[PipelineExampleNames.WORKSPACE_PIPELINE];

describe('removeTrigger', () => {
  const values = {
    selectedTrigger: 'pipeline-template',
  };

  beforeEach(() => {
    jest.spyOn(k8s, 'k8sKill').mockImplementation((model, data) => Promise.resolve(data));
    jest.spyOn(k8s, 'k8sPatch').mockImplementation((model, data) => Promise.resolve(data));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
  // setup mock API calls
  const setupJestMocks = (eventListener: EventListenerKind[]) =>
    jest.spyOn(k8s, 'k8sList').mockImplementation((model) => {
      if (model.kind === EventListenerModel.kind) {
        return Promise.resolve(eventListener);
      }
      return Promise.resolve([]);
    });
  // assertion helper for the remove trigger resources
  const expectAndDeleteElResources = (eventListener: EventListenerKind) => {
    expect(jest.spyOn(k8s, 'k8sKill')).toHaveBeenCalledWith(TriggerTemplateModel, {
      metadata: {
        name: values.selectedTrigger,
        namespace: pipelineData.pipeline.metadata.namespace,
      },
    });
    expect(jest.spyOn(k8s, 'k8sKill')).toHaveBeenCalledWith(EventListenerModel, eventListener);
  };

  it('expect to remove the TT and EL resources when template.name is used in Eventlistener', async () => {
    try {
      setupJestMocks([EventlistenerTestData[EventlistenerTypes.BINDINGS_TEMPLATE_NAME]]);
      await removeTrigger(values, pipelineData.pipeline);
      expect(jest.spyOn(k8s, 'k8sKill')).toHaveBeenCalledTimes(2);
      expectAndDeleteElResources(EventlistenerTestData[EventlistenerTypes.BINDINGS_TEMPLATE_NAME]);
    } catch (e) {
      fail(e);
    }
  });

  it('expect to remove the TT and EL resources when template.ref is used in Eventlistener', async () => {
    try {
      setupJestMocks([EventlistenerTestData[EventlistenerTypes.BINDINGS_TEMPLATE_REF]]);
      await removeTrigger(values, pipelineData.pipeline);
      expect(jest.spyOn(k8s, 'k8sKill')).toHaveBeenCalledTimes(2);
      expectAndDeleteElResources(EventlistenerTestData[EventlistenerTypes.BINDINGS_TEMPLATE_REF]);
    } catch (e) {
      fail(e);
    }
  });

  it('expect to remove only TT and update EL resources when multiple triggers are used', async () => {
    try {
      const elWithOneTrigger = EventlistenerTestData[EventlistenerTypes.BINDINGS_TEMPLATE_REF];
      const elWithMultipleTrigger = {
        ...elWithOneTrigger,
        spec: {
          ...elWithOneTrigger.spec,
          triggers: [
            ...elWithOneTrigger.spec.triggers,
            {
              ...TriggerTestData[TriggerTypes.BINDING_TEMPLATE_NAME],
              template: { name: 'old-trigger-template' },
            },
          ],
        },
      };
      setupJestMocks([elWithMultipleTrigger]);
      await removeTrigger(values, pipelineData.pipeline);
      expect(jest.spyOn(k8s, 'k8sKill')).toHaveBeenCalledTimes(1);
      expect(jest.spyOn(k8s, 'k8sPatch')).toHaveBeenCalledTimes(1);
      expect(jest.spyOn(k8s, 'k8sPatch')).toHaveBeenLastCalledWith(
        EventListenerModel,
        elWithMultipleTrigger,
        [
          {
            op: 'replace',
            path: '/spec/triggers',
            value: [TriggerTestData[TriggerTypes.BINDING_TEMPLATE_REF]],
          },
        ],
      );
    } catch (e) {
      fail(e);
    }
  });

  it('expect to remove TT from all the associated Eventlisteners', async () => {
    try {
      setupJestMocks([
        EventlistenerTestData[EventlistenerTypes.BINDINGS_TEMPLATE_REF],
        EventlistenerTestData[EventlistenerTypes.BINDINGS_TEMPLATE_NAME],
      ]);
      await removeTrigger(values, pipelineData.pipeline);
      expect(jest.spyOn(k8s, 'k8sKill')).toHaveBeenCalledTimes(3);
    } catch (e) {
      fail(e);
    }
  });
});
