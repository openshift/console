import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { shallow, ShallowWrapper } from 'enzyme';
import * as _ from 'lodash';
import { Link } from 'react-router-dom';
import * as utils from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { RevisionModel } from '../../../models';
import { MockKnativeResources } from '../../../topology/__tests__/topology-knative-test-data';
import {
  mockRevisions,
  mockTrafficData,
} from '../../../utils/__mocks__/traffic-splitting-utils-mock';
import * as modal from '../../modals';
import RevisionsOverviewList, { RevisionsOverviewListProps } from '../RevisionsOverviewList';
import RevisionsOverviewListItem from '../RevisionsOverviewListItem';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

const i18nNS = 'knative-plugin';

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
    ).toEqual(`${i18nNS}~Revisions`);
  });

  it('should show info if no Revisions present, link for all revisions should not be shown and traffic split button should be disabled', () => {
    const spyUseAccessReview = jest.spyOn(utils, 'useAccessReview');
    spyUseAccessReview.mockReturnValue(true);
    wrapper = shallow(
      <RevisionsOverviewList revisions={[]} service={MockKnativeResources.revisions.data[0]} />,
    );
    expect(wrapper.find(Link)).toHaveLength(0);
    expect(wrapper.text().includes('No Revisions found for this resource.')).toBe(true);
    expect(
      wrapper
        .find(Button)
        .at(0)
        .props().isDisabled,
    ).toBe(true);
  });

  it('should show Resource Link if number of revisions is more than MAX_REVISIONS', () => {
    wrapper = shallow(
      <RevisionsOverviewList
        revisions={mockRevisions}
        service={MockKnativeResources.ksservices.data[0]}
      />,
    );
    expect(wrapper.find(Link)).toHaveLength(1);
    const url = `/search/ns/${MockKnativeResources.ksservices.data[0].metadata?.namespace}`;
    const params = new URLSearchParams();
    params.append('kind', referenceForModel(RevisionModel));
    params.append(
      'q',
      `serving.knative.dev/service=${MockKnativeResources.ksservices.data[0].metadata?.name}`,
    );
    expect(
      wrapper
        .find(Link)
        .at(0)
        .props().to,
    ).toEqual(`${url}?${params.toString()}`);
    expect(
      wrapper
        .find(Link)
        .at(0)
        .props().children,
    ).toEqual(`${i18nNS}~View all ({{revLength}})`);
  });

  it('should not show Resource Link if number of revisions is less than MAX_REVISIONS', () => {
    expect(wrapper.find(Link)).toHaveLength(0);
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
    ).toEqual(`${i18nNS}~Set traffic distribution`);
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

  it('should render RevisionsOverviewListItem for revisions as many as MAX_REVISION if number of revisions receiving traffic is less than MAX_REVISION', () => {
    wrapper = shallow(
      <RevisionsOverviewList
        revisions={mockRevisions}
        service={MockKnativeResources.ksservices.data[0]}
      />,
    );
    expect(wrapper.find(RevisionsOverviewListItem)).toHaveLength(3);
  });

  it('should render RevisionsOverviewListItem for all revisions receiving traffic', () => {
    const serviceWithTraffic = _.set(
      _.cloneDeep(MockKnativeResources.ksservices.data[0]),
      'status.traffic',
      mockTrafficData,
    );
    wrapper = shallow(
      <RevisionsOverviewList revisions={mockRevisions} service={serviceWithTraffic} />,
    );
    expect(wrapper.find(RevisionsOverviewListItem)).toHaveLength(4);
  });
});
