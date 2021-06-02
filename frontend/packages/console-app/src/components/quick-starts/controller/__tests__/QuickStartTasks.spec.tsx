import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import QuickStartMarkdownView from '../../QuickStartMarkdownView';
import { QuickStartTaskStatus } from '../../utils/quick-start-types';
import { getQuickStartByName } from '../../utils/quick-start-utils';
import TaskHeader from '../QuickStartTaskHeader';
import QuickStartTaskReview from '../QuickStartTaskReview';
import QuickStartTask from '../QuickStartTasks';

type QuickStartTaskProps = React.ComponentProps<typeof QuickStartTask>;
let wrapper: ShallowWrapper<QuickStartTaskProps>;
const props: QuickStartTaskProps = {
  tasks: getQuickStartByName('monitor-sampleapp').spec.tasks,
  allTaskStatuses: [
    QuickStartTaskStatus.SUCCESS,
    QuickStartTaskStatus.INIT,
    QuickStartTaskStatus.INIT,
  ],
  taskNumber: 1,
  onTaskReview: jest.fn(),
  onTaskSelect: jest.fn(),
};

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key: string) => key }),
  };
});

describe('QuickStartTasks', () => {
  beforeEach(() => {
    wrapper = shallow(<QuickStartTask {...props} />);
  });

  it('should render correct number of tasks based on currentTaskIndex', () => {
    expect(wrapper.find(TaskHeader).length).toBe(1);
  });

  it('should render SyncMarkdownView with description if a task is active', () => {
    wrapper = shallow(
      <QuickStartTask
        {...props}
        allTaskStatuses={[
          QuickStartTaskStatus.SUCCESS,
          QuickStartTaskStatus.FAILED,
          QuickStartTaskStatus.VISITED,
        ]}
        taskNumber={2}
      />,
    );
    expect(
      wrapper
        .find(QuickStartMarkdownView)
        .at(0)
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
