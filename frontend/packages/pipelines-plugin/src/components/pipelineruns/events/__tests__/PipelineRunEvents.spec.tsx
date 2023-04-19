import * as React from 'react';
import { shallow } from 'enzyme';
import { ResourcesEventStream } from '@console/internal/components/events';
import { referenceForModel } from '@console/internal/module/k8s';
import { PipelineRunModel } from '../../../../models';
import {
  DataState,
  PipelineExampleNames,
  pipelineTestData,
} from '../../../../test-data/pipeline-data';
import * as utils from '../event-utils';
import PipelineRunEvents from '../PipelineRunEvents';

const pipeline = pipelineTestData[PipelineExampleNames.WORKSPACE_PIPELINE];
const pipelineRun = pipeline.pipelineRuns[DataState.SUCCESS];
const { taskRuns, pods } = pipeline;

const spyUsePipelineRunRelatedResources = jest.spyOn(utils, 'usePipelineRunRelatedResources');
type PipelineRunEventsProps = React.ComponentProps<typeof PipelineRunEvents>;

describe('PipelineRunEvents:', () => {
  let pipelineRunEventsProps: PipelineRunEventsProps;
  beforeEach(() => {
    pipelineRunEventsProps = {
      obj: pipelineRun,
      match: {
        isExact: true,
        path: `/k8s/ns/:ns/${referenceForModel(PipelineRunModel)}/events`,
        url: `k8s/ns/rhd-test/${referenceForModel(PipelineRunModel)}/events`,
        params: {
          ns: 'rhd-test',
        },
      },
    };
    spyUsePipelineRunRelatedResources.mockReturnValue({
      taskruns: { data: taskRuns, loaded: true },
      pods: { data: pods, loaded: true },
    });
  });

  it('Should render a ResourcesEventStream', () => {
    const pipelineRunEventsWrapper = shallow(<PipelineRunEvents {...pipelineRunEventsProps} />);
    expect(pipelineRunEventsWrapper.find(ResourcesEventStream).exists()).toBe(true);
  });

  it('Should pass three filters in the props to the ResourcesEventStream', () => {
    const pipelineRunEventsWrapper = shallow(<PipelineRunEvents {...pipelineRunEventsProps} />);
    expect(pipelineRunEventsWrapper.find(ResourcesEventStream).props().filters).toHaveLength(3);
  });
});
