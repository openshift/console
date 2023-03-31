import * as React from 'react';
import { render, configure } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';
import store from '@console/internal/redux';
import TaskRunDetailsStatus from '../TaskRunDetailsStatus';
import { failedTaskRun, taskRunWithResults } from './taskrun-test-data';

configure({ testIdAttribute: 'data-test' });

type TaskRunDetailsStatusProps = React.ComponentProps<typeof TaskRunDetailsStatus>;

const Wrapper: React.FC = ({ children }) => (
  <MemoryRouter>
    <Provider store={store}>{children}</Provider>
  </MemoryRouter>
);

describe('TaskRunDetailsStatus', () => {
  let taskRunDetailsStatusProps: TaskRunDetailsStatusProps;

  it('should render TaskRunDetautlsStatus component with right status and attributes', () => {
    taskRunDetailsStatusProps = {
      taskRun: taskRunWithResults,
    };
    const renderResult = render(
      <Wrapper>
        <TaskRunDetailsStatus {...taskRunDetailsStatusProps} />
      </Wrapper>,
    );

    // Status
    renderResult.getAllByText('Status');
    renderResult.getAllByText('Succeeded');

    // Started
    renderResult.getAllByText('Started');
    renderResult.getAllByText('Mar 27, 2023, 6:08 PM');

    // Duration
    renderResult.getAllByText('Duration');
    renderResult.getAllByText('52 second');

    // PipelineRun
    renderResult.getAllByText('PipelineRun');
    renderResult.getAllByText('sum-three-pipeline-run-second-add-xyxy');

    // Pod
    renderResult.getAllByText('Pod');
    renderResult.getAllByText('sum-three-pipeline-run-second-add-al6kxl-deploy-pod');
  });

  it('should render TaskRunDetautlsStatus component without Pod and PipelineRun', () => {
    taskRunDetailsStatusProps = {
      taskRun: failedTaskRun,
    };
    const renderResult = render(
      <Wrapper>
        <TaskRunDetailsStatus {...taskRunDetailsStatusProps} />
      </Wrapper>,
    );

    // PipelineRun
    expect(renderResult.queryByTestId('pipelineRun')).toBeNull();

    // Pod
    expect(renderResult.queryByTestId('pod')).toBeNull();
  });
});
