import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { SyncMarkdownView } from '@console/internal/components/markdown-view';
import { getQuickStart } from '../../utils/quick-start-utils';
import { QuickStartTaskStatus } from '../../utils/quick-start-types';
import QuickStartTask from '../QuickStartTasks';
import TaskHeader from '../QuickStartTaskHeader';
import QuickStartTaskReview from '../QuickStartTaskReview';

type QuickStartTaskProps = React.ComponentProps<typeof QuickStartTask>;
let wrapper: ShallowWrapper<QuickStartTaskProps>;
const props: QuickStartTaskProps = {
  tasks: getQuickStart('serverless-explore').tasks,
  allTaskStatuses: [
    QuickStartTaskStatus.SUCCESS,
    QuickStartTaskStatus.INIT,
    QuickStartTaskStatus.INIT,
  ],
  taskNumber: 1,
  onTaskReview: jest.fn(),
  onTaskSelect: jest.fn(),
};

describe('QuickStartTasks', () => {
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
        allTaskStatuses={[
          QuickStartTaskStatus.SUCCESS,
          QuickStartTaskStatus.FAILED,
          QuickStartTaskStatus.INIT,
        ]}
        taskNumber={2}
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

  it('should render review when task is active and in Review state', () => {
    wrapper = shallow(
      <QuickStartTask
        {...props}
        allTaskStatuses={[
          QuickStartTaskStatus.SUCCESS,
          QuickStartTaskStatus.REVIEW,
          QuickStartTaskStatus.INIT,
        ]}
      />,
    );
    expect(wrapper.find(QuickStartTaskReview).exists()).toBe(true);
  });
});
