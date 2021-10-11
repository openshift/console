import * as React from 'react';
import { shallow } from 'enzyme';
import * as _ from 'lodash';
import { ResourceSummary } from '@console/internal/components/utils';
import { PodRing, OverviewItem, usePodScalingAccessStatus } from '@console/shared';
import ServerlessFunctionType from '../../../components/overview/ServerlessFunctionType';
import { RevisionModel } from '../../../models';
import { usePodsForRevisions } from '../../../utils/usePodsForRevisions';
import {
  revisionObj,
  knativeServiceObj,
  serverlessFunctionObj,
} from '../../__tests__/topology-knative-test-data';
import {
  KnativeOverviewDetails,
  KnativeOverviewRevisionPodsRing,
} from '../KnativeOverviewSections';

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
    let wrapper = shallow(<KnativeOverviewDetails item={item} />);
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
    const wrapper = shallow(<KnativeOverviewDetails item={item} />);
    expect(wrapper.find(ResourceSummary)).toHaveLength(1);
  });
  it('should not render PodRing if obj.kind is not RevisionModel.kind', () => {
    const mockItemKindRoute = _.set(_.cloneDeep(item), 'obj.kind', 'Route');
    const wrapper = shallow(<KnativeOverviewDetails item={mockItemKindRoute} />);
    expect(wrapper.find(PodRing)).toHaveLength(0);
  });

  it('should not render ServerlessFunctionType if obj is not a serverless function', () => {
    const wrapper = shallow(<KnativeOverviewDetails item={{ obj: knativeServiceObj }} />);
    expect(wrapper.find(ServerlessFunctionType).exists()).toBeFalsy();
  });

  it('should render ServerlessFunctionType if obj is a serverless function', () => {
    const wrapper = shallow(<KnativeOverviewDetails item={{ obj: serverlessFunctionObj }} />);
    expect(wrapper.find(ServerlessFunctionType).exists()).toBeTruthy();
  });
});
