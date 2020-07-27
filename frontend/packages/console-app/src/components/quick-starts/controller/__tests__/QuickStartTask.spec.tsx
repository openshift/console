import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { SyncMarkdownView } from '@console/internal/components/markdown-view';
import { Alert } from '@patternfly/react-core';
import { getQuickStart } from '../../utils/quick-start-utils';
import { QuickStartTaskStatus } from '../../utils/quick-start-types';
import QuickStartTask from '../QuickStartTasks';
import TaskHeader from '../QuickStartTaskHeader';

type QuickStartTaskProps = React.ComponentProps<typeof QuickStartTask>;
let wrapper: ShallowWrapper<QuickStartTaskProps>;
const props: QuickStartTaskProps = {
  tasks: getQuickStart('serverless-explore').tasks,
  taskStatus: [QuickStartTaskStatus.SUCCESS, QuickStartTaskStatus.INIT, QuickStartTaskStatus.INIT],
  activeTaskIndex: 1,
  reviewCallback: jest.fn(),
  onTaskSelect: jest.fn(),
};

describe('QuickStartTask', () => {
  beforeEach(() => {
    wrapper = shallow(<QuickStartTask {...props} />);
  });
  it('should render correct number of tasks based on currentTaskIndex', () => {
    expect(wrapper.find(TaskHeader).length).toBe(2);
  });

  it('should render SyncMarkdownView with description or recapitulation according to task status', () => {
    wrapper = shallow(
      <QuickStartTask
        {...props}
        taskStatus={[
          QuickStartTaskStatus.SUCCESS,
          QuickStartTaskStatus.FAILED,
          QuickStartTaskStatus.INIT,
        ]}
        activeTaskIndex={2}
      />,
    );

    expect(
      wrapper
        .find(SyncMarkdownView)
        .at(0)
        .props().content,
    ).toEqual(props.tasks[0].recapitulation.success);

    expect(
      wrapper
        .find(SyncMarkdownView)
        .at(1)
        .props().content,
    ).toEqual(props.tasks[1].recapitulation.failed);

    expect(
      wrapper
        .find(SyncMarkdownView)
        .at(2)
        .props().content,
    ).toEqual(props.tasks[2].description);
  });

  it('should render review Alert in variant info when task is active and in Review state', () => {
    wrapper = shallow(
      <QuickStartTask
        {...props}
        taskStatus={[
          QuickStartTaskStatus.SUCCESS,
          QuickStartTaskStatus.REVIEW,
          QuickStartTaskStatus.INIT,
        ]}
      />,
    );
    expect(
      wrapper
        .find(Alert)
        .at(0)
        .props().variant,
    ).toEqual('info');
  });

  it('should render review Alert in variant success when task is active and in Success state', () => {
    wrapper = shallow(
      <QuickStartTask
        {...props}
        taskStatus={[
          QuickStartTaskStatus.SUCCESS,
          QuickStartTaskStatus.SUCCESS,
          QuickStartTaskStatus.INIT,
        ]}
      />,
    );
    expect(
      wrapper
        .find(Alert)
        .at(0)
        .props().variant,
    ).toEqual('success');
  });

  it('should render review Alert in variant danger when task is active and in Failed state', () => {
    wrapper = shallow(
      <QuickStartTask
        {...props}
        taskStatus={[
          QuickStartTaskStatus.SUCCESS,
          QuickStartTaskStatus.FAILED,
          QuickStartTaskStatus.INIT,
        ]}
      />,
    );
    expect(
      wrapper
        .find(Alert)
        .at(0)
        .props().variant,
    ).toEqual('danger');
  });
});
