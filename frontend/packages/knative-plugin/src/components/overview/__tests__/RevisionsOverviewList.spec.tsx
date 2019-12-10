import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { Button } from '@patternfly/react-core';
import * as utils from '@console/internal/components/utils';
import { MockKnativeResources } from '@console/dev-console/src/components/topology/__tests__/topology-knative-test-data';
import * as modal from '../../modals';
import RevisionsOverviewList, { RevisionsOverviewListProps } from '../RevisionsOverviewList';
import RevisionsOverviewListItem from '../RevisionsOverviewListItem';

describe('RevisionsOverviewList', () => {
  let wrapper: ShallowWrapper<RevisionsOverviewListProps>;
  beforeEach(() => {
    wrapper = shallow(
      <RevisionsOverviewList
        revisions={MockKnativeResources.revisions.data}
        service={MockKnativeResources.ksservices.data[0]}
      />,
    );
  });

  it('should have title Revisions', () => {
    expect(wrapper.find(utils.SidebarSectionHeading)).toHaveLength(1);
    expect(
      wrapper
        .find(utils.SidebarSectionHeading)
        .at(0)
        .props().text,
    ).toEqual('Revisions');
  });

  it('should show info if no Revisions present and traffic split sshould button should be disabled', () => {
    const spyUseAccessReview = jest.spyOn(utils, 'useAccessReview');
    spyUseAccessReview.mockReturnValue(true);
    wrapper = shallow(
      <RevisionsOverviewList revisions={[]} service={MockKnativeResources.revisions.data[0]} />,
    );
    expect(wrapper.find('span')).toHaveLength(1);
    expect(wrapper.text().includes('No Revisions found for this resource.')).toBe(true);
    expect(
      wrapper
        .find(Button)
        .at(0)
        .props().isDisabled,
    ).toBe(true);
  });

  it('should have button for traffic distribution and enabled', () => {
    const spyUseAccessReview = jest.spyOn(utils, 'useAccessReview');
    spyUseAccessReview.mockReturnValue(true);
    expect(wrapper.find(Button)).toHaveLength(1);
    expect(
      wrapper
        .find(Button)
        .at(0)
        .props().children,
    ).toEqual('Set Traffic Distribution');
    expect(
      wrapper
        .find(Button)
        .at(0)
        .props().isDisabled,
    ).toBe(false);
  });

  it('should call setTrafficDistributionModal on click', () => {
    const spySetTrafficDistributionModal = jest.spyOn(modal, 'setTrafficDistributionModal');
    expect(wrapper.find(Button)).toHaveLength(1);
    wrapper.find(Button).simulate('click');
    expect(spySetTrafficDistributionModal).toHaveBeenCalled();
  });

  it('should not show button for traffic distribution if access is not there', () => {
    const spyUseAccessReview = jest.spyOn(utils, 'useAccessReview');
    spyUseAccessReview.mockReturnValue(false);
    wrapper = shallow(
      <RevisionsOverviewList
        revisions={MockKnativeResources.revisions.data}
        service={MockKnativeResources.revisions.data[0]}
      />,
    );
    expect(wrapper.find(Button).exists()).toBe(false);
  });

  it('should render RevisionsOverviewListItem', () => {
    expect(wrapper.find(RevisionsOverviewListItem)).toHaveLength(1);
  });
});
