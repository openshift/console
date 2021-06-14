import * as React from 'react';
import { EmptyState } from '@patternfly/react-core';
import { TableComposable } from '@patternfly/react-table';
import { ShallowWrapper, shallow } from 'enzyme';
import { runStatus } from '../../../../utils/pipeline-augment';
import { taskRunWithResults } from '../../../taskruns/__tests__/taskrun-test-data';
import ResultsList, { ResultsListProps } from '../ResultsList';

describe('ResultsList', () => {
  let resultsListWrapper: ShallowWrapper<ResultsListProps>;
  let resultsListProps: ResultsListProps;

  beforeEach(() => {
    resultsListProps = {
      status: runStatus.Succeeded,
      resourceName: 'TaskRun',
      results: taskRunWithResults.status.taskResults,
    };
    resultsListWrapper = shallow(<ResultsList {...resultsListProps} />);
  });

  it('Should render Results Table', () => {
    expect(resultsListWrapper.find(TableComposable).exists()).toBe(true);
    expect(resultsListWrapper.find(EmptyState).exists()).toBe(false);
  });
  it('Should render an EmptyState instead', () => {
    resultsListProps = {
      status: runStatus.Failed,
      resourceName: 'TaskRun',
      results: taskRunWithResults.status.taskResults,
    };
    resultsListWrapper = shallow(<ResultsList {...resultsListProps} />);
    expect(resultsListWrapper.find(TableComposable).exists()).toBe(false);
    expect(resultsListWrapper.find(EmptyState).exists()).toBe(true);
  });
});
