import * as React from 'react';
import { EmptyStateIcon, Title } from '@patternfly/react-core';
import { ExclamationCircleIcon, LockIcon } from '@patternfly/react-icons';
import { shallow, ShallowWrapper } from 'enzyme';
import AddCardSectionEmptyState from '../AddCardSectionEmptyState';

describe('AddCardSectionEmptyState', () => {
  type AddCardSectionEmptyStateProps = React.ComponentProps<typeof AddCardSectionEmptyState>;
  let wrapper: ShallowWrapper<AddCardSectionEmptyStateProps>;

  it('should render Empty state for access error if accessError prop is true', () => {
    wrapper = shallow(<AddCardSectionEmptyState accessCheckFailed />);
    expect(
      wrapper
        .find(Title)
        .children()
        .text(),
    ).toEqual('Access permissions needed');

    expect(
      wrapper
        .find(EmptyStateIcon)
        .dive()
        .find(LockIcon)
        .exists(),
    ).toBe(true);
  });

  it('should render Empty state for loading error if accessError prop is not truthy', () => {
    wrapper = shallow(<AddCardSectionEmptyState />);
    expect(
      wrapper
        .find(Title)
        .children()
        .text(),
    ).toEqual('Unable to load');

    expect(
      wrapper
        .find(EmptyStateIcon)
        .dive()
        .find(ExclamationCircleIcon)
        .exists(),
    ).toBe(true);
  });
});
