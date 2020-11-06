import * as React from 'react';
import { shallow } from 'enzyme';
import { StatusBox } from '@console/internal/components/utils/status-box';
import LogsWrapperComponent from '../../pipelineruns/logs/LogsWrapperComponent';
import TaskRunLog from '../TaskRunLog';
import { failedTaskRun } from './taskrun-test-data';

type Component = typeof TaskRunLog;
type Props = React.ComponentProps<Component>;
const TaskRunLogProps: Props = {
  obj: failedTaskRun,
};

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

describe('TaskRunLog Page', () => {
  it('Renders a StatusBox', () => {
    const taskRunLogWrapper = shallow(<TaskRunLog {...TaskRunLogProps} />);
    expect(taskRunLogWrapper.find(StatusBox).exists());
  });
  it('Renders a PodLog', () => {
    TaskRunLogProps.obj.status.podName = 'test';
    const taskRunLogWrapper = shallow(<TaskRunLog {...TaskRunLogProps} />);
    expect(taskRunLogWrapper.find(LogsWrapperComponent).exists());
  });
});
