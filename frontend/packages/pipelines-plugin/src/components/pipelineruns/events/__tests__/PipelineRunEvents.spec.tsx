import * as React from 'react';
import { shallow } from 'enzyme';
import * as Router from 'react-router-dom-v5-compat';
import { ResourcesEventStream } from '@console/internal/components/events';
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

jest.mock('react-router-dom-v5-compat', () => ({
  ...require.requireActual('react-router-dom-v5-compat'),
  useParams: jest.fn(),
}));

describe('PipelineRunEvents:', () => {
  let pipelineRunEventsProps: PipelineRunEventsProps;
  beforeEach(() => {
    jest.spyOn(Router, 'useParams').mockReturnValue({
      ns: 'rhd-test',
    });
    pipelineRunEventsProps = {
      obj: pipelineRun,
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
