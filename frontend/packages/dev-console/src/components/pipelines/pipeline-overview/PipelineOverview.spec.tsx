import * as React from 'react';
import { shallow } from 'enzyme';
import PipelineOverview from './PipelineOverview';
import PipelineStartButton from './PipelineStartButton';
import TriggerLastRunButton from './TriggerLastRunButton';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

describe('Pipeline sidebar overview', () => {
  let props: React.ComponentProps<typeof PipelineOverview>;

  beforeEach(() => {
    props = {
      item: {
        buildConfigs: [],
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
    expect(wrapper.find('Link').text()).toBe('devconsole~View all {{pipelineRunsLength}}');
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
