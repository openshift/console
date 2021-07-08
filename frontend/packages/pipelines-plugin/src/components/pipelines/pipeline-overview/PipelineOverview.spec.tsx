import * as React from 'react';
import { shallow } from 'enzyme';
import { setPipelineNotStarted } from './pipeline-overview-utils';
import PipelineOverview from './PipelineOverview';
import PipelineOverviewAlert from './PipelineOverviewAlert';
import PipelineStartButton from './PipelineStartButton';
import TriggerLastRunButton from './TriggerLastRunButton';

jest.mock('@console/internal/module/k8s/k8s-models', () => {
  const dependency = require.requireActual('@console/internal/module/k8s/k8s-models');
  return {
    ...dependency,
    modelFor: () => ({}),
  };
});

describe('Pipeline sidebar overview', () => {
  let props: React.ComponentProps<typeof PipelineOverview>;

  beforeEach(() => {
    props = {
      item: {
        obj: {},
        pipelines: [{ metadata: { name: 'pipeline', namespace: 'test' }, spec: { tasks: [] } }],
        pipelineRuns: [],
      },
    };
  });

  it('should show view all link if there are more than MAX_VISIBLE pipelineruns', () => {
    props.item.pipelineRuns = ['pr0', 'pr1', 'pr2', 'pr3'].map((pr) => ({
      metadata: { name: pr, namespace: 'test', uid: pr },
      spec: {},
    }));
    const wrapper = shallow(<PipelineOverview {...props} />);
    expect(wrapper.find('Link').text()).toBe('View all {{pipelineRunsLength}}');
  });

  it('should show not view all link if there exactly MAX_VISIBLE pipelineruns', () => {
    props.item.pipelineRuns = ['pr0', 'pr1', 'pr2'].map((pr) => ({
      metadata: { name: pr, namespace: 'test', uid: pr },
      spec: {},
    }));
    const wrapper = shallow(<PipelineOverview {...props} />);
    expect(wrapper.find('Link')).toHaveLength(0);
  });

  it('should show Start button when no pipelineruns are available', () => {
    const wrapper = shallow(<PipelineOverview {...props} />);
    expect(wrapper.find(PipelineStartButton)).toHaveLength(1);
  });

  it('should show Start last run button when pipelineruns are available', () => {
    props.item.pipelineRuns = [
      { metadata: { name: 'pipelinerun', namespace: 'test', uid: 'test' }, spec: {} },
    ];
    const wrapper = shallow(<PipelineOverview {...props} />);
    expect(wrapper.find(TriggerLastRunButton)).toHaveLength(1);
  });

  it('should show the pipeline not started Alert', () => {
    const { name, namespace } = props.item.pipelines[0].metadata;
    setPipelineNotStarted(name, namespace);
    const wrapper = shallow(<PipelineOverview {...props} />);
    expect(wrapper.find(PipelineOverviewAlert)).toHaveLength(1);
    sessionStorage.clear();
  });

  it('should not show the pipeline not started Alert', () => {
    sessionStorage.clear();
    const wrapper = shallow(<PipelineOverview {...props} />);
    expect(wrapper.find(PipelineOverviewAlert)).toHaveLength(0);
  });
});
