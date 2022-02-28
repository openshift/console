import * as React from 'react';
import {
  QueryBrowserPage,
  QueryCreationWrapper,
} from '@console/internal/components/monitoring/metrics';
import { shallow, ShallowWrapper } from 'enzyme';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useSelector } from 'react-redux';

jest.mock('react-redux', () => {
  const ActualReactRedux = require.requireActual('react-redux');
  return {
    ...ActualReactRedux,
    useSelector: jest.fn(),
    useDispatch: jest.fn(),
  };
});

describe(QueryBrowserPage.displayName, () => {
  let queryCreationWrapper: ShallowWrapper;

  it('should not render the `QueriesControls` and the `QueriesList`, when the hideTable state is set to true', () => {
    // Mocks the hideTable state
    useSelector.mockReturnValue(true);
    queryCreationWrapper = shallow(<QueryCreationWrapper />);

    expect(queryCreationWrapper.isEmptyRender()).toBe(true);
  });

  it('should render the `QueriesControls` and the `QueriesList`, when the hideTable state is set to false', () => {
    // Mocks the hideTable state
    useSelector.mockReturnValue(false);
    queryCreationWrapper = shallow(<QueryCreationWrapper />);

    expect(queryCreationWrapper.isEmptyRender()).toBe(false);
  });
});
