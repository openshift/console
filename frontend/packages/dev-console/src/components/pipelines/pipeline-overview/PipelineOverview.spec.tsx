import * as React from 'react';
import { shallow } from 'enzyme';
import PipelineOverview from './PipelineOverview';
import PipelineStartButton from './PipelineStartButton';
import TriggerLastRunButton from './TriggerLastRunButton';

describe('Pipeline sidebar overview', () => {
  let props: React.ComponentProps<typeof PipelineOverview>;

  beforeEach(() => {
    props = {
      item: {
        obj: {},
        routes: [],
        services: [],
        pipelines: [{ metadata: { name: 'pipeline', namespace: 'test' }, spec: { tasks: [] } }],
        pipelineRuns: [],
      },
    };
  });

  it('should show view all link if there are more than MAX_VISIBLE pipelineruns', () => {
    props.item.pipelineRuns = ['pr0', 'pr1', 'pr2', 'pr3'].map((pr) => ({
      metadata: { name: pr, namespace: 'test' },
    }));
    const wrapper = shallow(<PipelineOverview {...props} />);
    expect(wrapper.find('Link').text()).toBe('View all (4)');
  });

  it('should show not view all link if there exactly MAX_VISIBLE pipelineruns', () => {
    props.item.pipelineRuns = ['pr0', 'pr1', 'pr2'].map((pr) => ({
      metadata: { name: pr, namespace: 'test' },
    }));
    const wrapper = shallow(<PipelineOverview {...props} />);
    expect(wrapper.find('Link')).toHaveLength(0);
  });

  it('should show Start button when no pipelineruns are available', () => {
    const wrapper = shallow(<PipelineOverview {...props} />);
    expect(wrapper.find(PipelineStartButton)).toHaveLength(1);
  });

  it('should show Start last run button when pipelineruns are available', () => {
    props.item.pipelineRuns = [{ metadata: { name: 'pipelinerun', namespace: 'test' } }];
    const wrapper = shallow(<PipelineOverview {...props} />);
    expect(wrapper.find(TriggerLastRunButton)).toHaveLength(1);
  });
});
