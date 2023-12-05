import * as React from 'react';
import { shallow } from 'enzyme';
import { ResourcesEventStream } from '@console/internal/components/events';
import { PipelineExampleNames, pipelineTestData } from '../../../../test-data/pipeline-data';
import * as utils from '../../../pipelineruns/events/event-utils';
import TaskRunEvents from '../TaskRunEvents';

const pipeline = pipelineTestData[PipelineExampleNames.WORKSPACE_PIPELINE];
const { pods } = pipeline;

const spyUseTaskRunRelatedResources = jest.spyOn(utils, 'useTaskRunRelatedResources');
type TaskRunEventsProps = React.ComponentProps<typeof TaskRunEvents>;

describe('TaskRunEvents:', () => {
  let taskRunEventsProps: TaskRunEventsProps;
  beforeEach(() => {
    taskRunEventsProps = {
      obj: pipeline.taskRuns[0],
    };
    spyUseTaskRunRelatedResources.mockReturnValue({
      pods: { data: pods, loaded: true },
    });
  });

  it('Should render a ResourcesEventStream', () => {
    const taskRunEventsWrapper = shallow(<TaskRunEvents {...taskRunEventsProps} />);
    expect(taskRunEventsWrapper.find(ResourcesEventStream).exists()).toBe(true);
  });

  it('Should pass two filters in the props to the ResourcesEventStream', () => {
    const taskRunEventsWrapper = shallow(<TaskRunEvents {...taskRunEventsProps} />);
    expect(taskRunEventsWrapper.props().filters).toHaveLength(2);
  });
});
