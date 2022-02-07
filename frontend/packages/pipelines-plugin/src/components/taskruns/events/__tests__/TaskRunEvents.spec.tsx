import * as React from 'react';
import { shallow } from 'enzyme';
import { ResourcesEventStream } from '@console/internal/components/events';
import { referenceForModel } from '@console/internal/module/k8s';
import { TaskRunModel } from '../../../../models';
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
      match: {
        isExact: true,
        path: `/k8s/ns/:ns/${referenceForModel(TaskRunModel)}/events`,
        url: `k8s/ns/rhd-test/${referenceForModel(TaskRunModel)}/events`,
        params: {
          ns: 'rhd-test',
        },
      },
    };
    spyUseTaskRunRelatedResources.mockReturnValue({
      pods: { data: pods, loaded: true },
    } as any);
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
