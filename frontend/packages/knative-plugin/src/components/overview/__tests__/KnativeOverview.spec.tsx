import * as React from 'react';
import { shallow } from 'enzyme';
import * as _ from 'lodash';
import { PodRing, OverviewItem, usePodScalingAccessStatus } from '@console/shared';
import { ResourceSummary } from '@console/internal/components/utils';
import { revisionObj } from '../../../topology/__tests__/topology-knative-test-data';
import { RevisionModel } from '../../../models';
import KnativeOverview, { KnativeOverviewRevisionPodsRing } from '../KnativeOverview';
import { usePodsForRevisions } from '../../../utils/usePodsForRevisions';

jest.mock('@console/shared', () => {
  const ActualShared = require.requireActual('@console/shared');
  return {
    ...ActualShared,
    usePodScalingAccessStatus: jest.fn(),
  };
});

jest.mock('../../../utils/usePodsForRevisions', () => ({
  usePodsForRevisions: jest.fn(),
}));

describe('KnativeOverview', () => {
  let item: OverviewItem;
  beforeEach(() => {
    item = {
      obj: revisionObj,
    };
    (usePodScalingAccessStatus as jest.Mock).mockReturnValueOnce(false);
    (usePodsForRevisions as jest.Mock).mockReturnValueOnce({
      loaded: true,
      loadError: null,
      pods: {},
    });
  });

  it('should render PodRing with proper resourceKind if obj.kind is RevisionModel.kind', () => {
    let wrapper = shallow(<KnativeOverview item={item} />);
    expect(wrapper.find(KnativeOverviewRevisionPodsRing)).toHaveLength(1);

    wrapper = shallow(<KnativeOverviewRevisionPodsRing item={item} />);
    expect(wrapper.find(PodRing)).toHaveLength(1);
    expect(
      wrapper
        .find(PodRing)
        .at(0)
        .props().resourceKind,
    ).toEqual(RevisionModel);
  });

  it('should render ResourceSummary', () => {
    const wrapper = shallow(<KnativeOverview item={item} />);
    expect(wrapper.find(ResourceSummary)).toHaveLength(1);
  });
  it('should not render PodRing if obj.kind is not RevisionModel.kind', () => {
    const mockItemKindRoute = _.set(_.cloneDeep(item), 'obj.kind', 'Route');
    const wrapper = shallow(<KnativeOverview item={mockItemKindRoute} />);
    expect(wrapper.find(PodRing)).toHaveLength(0);
  });
});
