import * as React from 'react';
import { configure, render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';
import store from '@console/internal/redux';
import {
  DataState,
  PipelineExampleNames,
  pipelineTestData,
} from '../../../test-data/pipeline-data';
import PipelineRunCustomDetails from '../detail-page-tabs/PipelineRunCustomDetails';

configure({ testIdAttribute: 'data-test' });

type PipelineRunCustomDetailsProps = React.ComponentProps<typeof PipelineRunCustomDetails>;

const Wrapper: React.FC = ({ children }) => (
  <MemoryRouter>
    <Provider store={store}>{children}</Provider>
  </MemoryRouter>
);
const pipelineData = pipelineTestData[PipelineExampleNames.SIMPLE_PIPELINE];
const pipelineRun = pipelineData.pipelineRuns[DataState.PIPELINE_RUN_CANCELLED];
describe('PipelineRunCustomDetails', () => {
  let pipelineRunCustomDetailsProps: PipelineRunCustomDetailsProps;

  it('should render PipelineRunCustomDetails component with right status and attributes', () => {
    pipelineRunCustomDetailsProps = {
      pipelineRun,
    };
    const renderResult = render(
      <Wrapper>
        <PipelineRunCustomDetails {...pipelineRunCustomDetailsProps} />
      </Wrapper>,
    );

    // Status
    renderResult.getAllByText('Status');
    renderResult.getAllByText('Cancelling');

    // Pipeline
    renderResult.getAllByText('Pipeline');
    renderResult.getAllByText('simple-pipeline');

    // Start time
    renderResult.getAllByText('Start time');
    renderResult.getAllByText('Mar 27, 2023, 6:08 PM');

    // Completion time
    renderResult.getAllByText('Completion time');
    renderResult.getAllByText('Mar 27, 2023, 6:09 PM');

    // Duration
    renderResult.getAllByText('Duration');
    renderResult.getAllByText('52 second');
  });
});
