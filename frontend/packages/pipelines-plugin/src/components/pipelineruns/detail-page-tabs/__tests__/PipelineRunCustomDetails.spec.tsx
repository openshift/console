import * as React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import store from '@console/internal/redux';
import {
  DataState,
  PipelineExampleNames,
  PipelineRunWithSBOM,
  pipelineTestData,
} from '../../../../test-data/pipeline-data';
import {
  taskRunWithResults,
  taskRunWithSBOMResult,
} from '../../../taskruns/__tests__/taskrun-test-data';
import { useTaskRuns } from '../../../taskruns/useTaskRuns';
import PipelineRunCustomDetails from '../PipelineRunCustomDetails';

const pipelineData = pipelineTestData[PipelineExampleNames.COMPLEX_PIPELINE];
const pipelineRun = pipelineData.pipelineRuns[DataState.SUCCESS];

jest.mock('../../../taskruns/useTaskRuns', () => ({
  useTaskRuns: jest.fn(),
}));

const useTaskRunsMock = useTaskRuns as jest.Mock;
const Wrapper: React.FC = ({ children }) => <Provider store={store}>{children}</Provider>;

describe('PipelineRunCustomDetails', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should not render SBOM section', () => {
    useTaskRunsMock.mockReturnValue([[], true]);
    const wrapper = render(
      <Wrapper>
        <PipelineRunCustomDetails pipelineRun={pipelineRun} />
      </Wrapper>,
      {
        wrapper: BrowserRouter,
      },
    );

    expect(wrapper.queryByText('Download SBOM')).toBeFalsy();
    expect(wrapper.queryByText('View SBOM')).toBeFalsy();
  });

  it('should not render SBOM section if the taskrun does not contain tekton results', () => {
    useTaskRunsMock.mockReturnValue([[taskRunWithResults], true]);
    const wrapper = render(
      <Wrapper>
        <PipelineRunCustomDetails pipelineRun={pipelineRun} />
      </Wrapper>,
      {
        wrapper: BrowserRouter,
      },
    );

    expect(wrapper.queryByText('Download SBOM')).toBeFalsy();
    expect(wrapper.queryByText('View SBOM')).toBeFalsy();
  });

  it('should render SBOM section if the taskrun results contains LINK_TO_SBOM', () => {
    useTaskRunsMock.mockReturnValue([[taskRunWithSBOMResult], true]);
    const wrapper = render(
      <Wrapper>
        <PipelineRunCustomDetails pipelineRun={PipelineRunWithSBOM} />
      </Wrapper>,
      {
        wrapper: BrowserRouter,
      },
    );

    expect(wrapper.queryByText('Download SBOM')).toBeTruthy();
    expect(wrapper.queryByText('View SBOM')).toBeTruthy();
  });
});
