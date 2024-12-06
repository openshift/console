import * as React from 'react';
import { EmptyState } from '@patternfly/react-core';
import { Table } from '@patternfly/react-table';
import { ShallowWrapper, shallow } from 'enzyme';
import { ComputedStatus } from '../../../../types';
import { taskRunWithResults } from '../../../taskruns/__tests__/taskrun-test-data';
import ResultsList, { ResultsListProps } from '../ResultsList';

describe('ResultsList', () => {
  let resultsListWrapper: ShallowWrapper<ResultsListProps>;
  let resultsListProps: ResultsListProps;

  beforeEach(() => {
    resultsListProps = {
      status: ComputedStatus.Succeeded,
      resourceName: 'TaskRun',
      results: taskRunWithResults.status.taskResults,
    };
    resultsListWrapper = shallow(<ResultsList {...resultsListProps} />);
  });

  it('Should render Results Table', () => {
    expect(resultsListWrapper.find(Table).exists()).toBe(true);
    expect(resultsListWrapper.find(EmptyState).exists()).toBe(false);
  });
  it('Should still render Results Table even if failed', () => {
    resultsListProps = {
      status: ComputedStatus.Failed,
      resourceName: 'TaskRun',
      results: taskRunWithResults.status.taskResults,
    };
    resultsListWrapper = shallow(<ResultsList {...resultsListProps} />);
    expect(resultsListWrapper.find(Table).exists()).toBe(true);
    expect(resultsListWrapper.find(EmptyState).exists()).toBe(false);
  });
});
