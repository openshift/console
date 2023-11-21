import * as React from 'react';
import { EmptyState } from '@patternfly/react-core';
import { Table as TableDeprecated } from '@patternfly/react-table/deprecated';
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
    expect(resultsListWrapper.find(TableDeprecated).exists()).toBe(true);
    expect(resultsListWrapper.find(EmptyState).exists()).toBe(false);
  });
  it('Should render an EmptyState instead', () => {
    resultsListProps = {
      status: ComputedStatus.Failed,
      resourceName: 'TaskRun',
      results: taskRunWithResults.status.taskResults,
    };
    resultsListWrapper = shallow(<ResultsList {...resultsListProps} />);
    expect(resultsListWrapper.find(TableDeprecated).exists()).toBe(false);
    expect(resultsListWrapper.find(EmptyState).exists()).toBe(true);
  });
});
