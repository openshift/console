import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { ResourceLink } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { referenceForModel } from '@console/internal/module/k8s';
import { PodStatus } from '@console/shared';
import { RevisionModel } from '../../../models';
import { MockKnativeResources } from '../../../topology/__tests__/topology-knative-test-data';
import { usePodsForRevisions } from '../../../utils/usePodsForRevisions';
import RevisionsOverviewListItem, {
  RevisionsOverviewListItemProps,
} from '../RevisionsOverviewListItem';
import RoutesUrlLink from '../RoutesUrlLink';

jest.mock('../../../utils/usePodsForRevisions', () => ({
  usePodsForRevisions: jest.fn(),
}));

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

describe('RevisionsOverviewListItem', () => {
  let wrapper: ShallowWrapper<RevisionsOverviewListItemProps>;
  beforeEach(() => {
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([
      [MockKnativeResources.ksservices.data[0]],
      true,
    ]);
    (usePodsForRevisions as jest.Mock).mockReturnValue({
      loaded: true,
      loadError: null,
      pods: {},
    });
    wrapper = shallow(
      <RevisionsOverviewListItem
        revision={MockKnativeResources.revisions.data[0]}
        service={MockKnativeResources.ksservices.data[0]}
      />,
    );
  });

  it('should list the Revision', () => {
    expect(wrapper.find('li')).toHaveLength(1);
    expect(
      wrapper
        .find('li')
        .at(0)
        .props().className,
    ).toEqual('list-group-item');
  });

  it('should have ResourceLink with proper kind', () => {
    expect(wrapper.find(ResourceLink)).toHaveLength(1);
    expect(
      wrapper
        .find(ResourceLink)
        .at(0)
        .props().kind,
    ).toEqual(referenceForModel(RevisionModel));
  });

  it('should show traffic percent', () => {
    expect(wrapper.find('span')).toHaveLength(1);
    expect(
      wrapper
        .find('span')
        .at(0)
        .props().children,
    ).toEqual('100%');
  });

  it('should not show deployments if not present', () => {
    expect(wrapper.find('.odc-revision-deployment-list').exists()).toBeFalsy();
  });

  it('should sum the traffic percentage for the same revision', () => {
    const { revisionName } = MockKnativeResources.ksservices.data[0].status.traffic[0];
    const mockServiceData = {
      ...MockKnativeResources.ksservices.data[0],
      status: {
        ...MockKnativeResources.ksservices.data[0].status,
        traffic: [
          { percent: 50, tag: 'tag-1', revisionName },
          { percent: 50, tag: 'tag-2', revisionName },
        ],
      },
    };
    wrapper.setProps({ service: mockServiceData });
    expect(wrapper.find(ResourceLink)).toHaveLength(1);
    expect(wrapper.find('span.pf-u-text-align-right').text()).toBe('100%');
  });

  describe('RevisionsOverviewListItem: deployments', () => {
    beforeEach(() => {
      (usePodsForRevisions as jest.Mock).mockReturnValue({
        loaded: true,
        loadError: null,
        pods: [
          {
            obj: {
              metadata: {
                ownerReferences: [
                  {
                    apiVersion: 'apps/v1',
                    blockOwnerDeletion: true,
                    controller: true,
                    kind: 'Deployment',
                    name: 'event-greeter-v1-deployment',
                    uid: 'd0387ddc-51e8-437d-a100-a001be806d45',
                  },
                ],
              },
              status: { availableReplicas: 1 },
            },
          },
        ],
      });
      const resources = {
        current: {
          obj: {
            metadata: {
              ownerReferences: [
                {
                  apiVersion: 'apps/v1',
                  blockOwnerDeletion: true,
                  controller: true,
                  kind: 'Deployment',
                  name: 'event-greeter-v1-deployment',
                  uid: 'd0387ddc-51e8-437d-a100-a001be806d45',
                },
              ],
            },
            status: { availableReplicas: 1 },
          },
        },
      };
      const mockRevisionsDepData = { ...MockKnativeResources.revisions.data[0], resources };
      wrapper = shallow(
        <RevisionsOverviewListItem
          revision={mockRevisionsDepData}
          service={MockKnativeResources.ksservices.data[0]}
        />,
      );
    });

    it('should show ResourceLink for deployment', () => {
      expect(wrapper.find('.odc-revision-deployment-list')).toHaveLength(1);
      expect(wrapper.find(ResourceLink)).toHaveLength(2);
      expect(
        wrapper
          .find(ResourceLink)
          .at(1)
          .props().kind,
      ).toEqual('Deployment');
    });

    it('should show pods for deployment', () => {
      expect(wrapper.find(PodStatus)).toHaveLength(1);
      expect(
        wrapper
          .find(PodStatus)
          .at(0)
          .props().title,
      ).toEqual(1);
    });
  });

  it('should not render RoutesUrlLink if status is not present', () => {
    const mockKsvc = {
      ...MockKnativeResources.ksservices.data[0],
    };
    delete mockKsvc.status;
    wrapper = shallow(
      <RevisionsOverviewListItem
        revision={MockKnativeResources.revisions.data[0]}
        service={mockKsvc}
      />,
    );
    expect(wrapper.find(RoutesUrlLink).exists()).toBe(false);
  });
});
