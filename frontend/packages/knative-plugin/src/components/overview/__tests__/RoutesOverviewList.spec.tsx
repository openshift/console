import * as React from 'react';
import { shallow } from 'enzyme';
import * as utils from '@console/internal/components/utils';
import RoutesOverviewList from '../RoutesOverviewList';
import RoutesOverviewListItem from '../RoutesOverviewListItem';
import { mockRevisionsData, mockRoutesData } from '../__mocks__/overview-knative-mock';

describe('RoutesOverviewList', () => {
  it('should component exists', () => {
    const wrapper = shallow(<RoutesOverviewList ksroutes={[]} resource={mockRevisionsData[0]} />);
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should have title Routes', () => {
    const wrapper = shallow(
      <RoutesOverviewList ksroutes={mockRoutesData} resource={mockRevisionsData[0]} />,
    );
    expect(wrapper.find(utils.SidebarSectionHeading)).toHaveLength(1);
    expect(
      wrapper
        .find(utils.SidebarSectionHeading)
        .at(0)
        .props().text,
    ).toEqual('Routes');
  });

  it('should show info if no Routes present', () => {
    const spyUseAccessReview = jest.spyOn(utils, 'useAccessReview');
    spyUseAccessReview.mockReturnValue(true);
    const wrapper = shallow(<RoutesOverviewList ksroutes={[]} resource={mockRevisionsData[0]} />);
    expect(wrapper.find('span')).toHaveLength(1);
    expect(
      wrapper
        .find('span')
        .at(0)
        .props().className,
    ).toEqual('text-muted');
    expect(
      wrapper
        .find('span')
        .at(0)
        .props().children,
    ).toEqual('No Routes found for this resource.');
  });

  it('should render RoutesOverviewListItem', () => {
    const wrapper = shallow(
      <RoutesOverviewList ksroutes={mockRoutesData} resource={mockRevisionsData[0]} />,
    );
    expect(wrapper.find(RoutesOverviewListItem)).toHaveLength(1);
  });
});
