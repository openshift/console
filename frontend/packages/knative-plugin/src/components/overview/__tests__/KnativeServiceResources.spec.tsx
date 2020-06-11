import * as React from 'react';
import { shallow } from 'enzyme';
import { useExtensions } from '@console/plugin-sdk';
import { PodsOverview } from '@console/internal/components/overview/pods-overview';
import {
  sampleKnativePods,
  sampleKnativeRoutes,
  sampleKnativeRevisions,
  knativeServiceObj,
} from '../../../topology/__tests__/topology-knative-test-data';
import { BuildOverview } from '@console/internal/components/overview/build-overview';
import { OverviewItem } from '@console/shared';
import KnativeServiceResources from '../KnativeServiceResources';
import KSRoutesOverviewList from '../RoutesOverviewList';
import RevisionsOverviewList from '../RevisionsOverviewList';

jest.mock('@console/plugin-sdk/src/useExtensions', () => ({
  useExtensions: jest.fn(),
}));

describe('KnativeServiceResources', () => {
  beforeEach(() => {
    (useExtensions as jest.Mock).mockReturnValueOnce([]);
  });

  it('should render KnativeServiceResources', () => {
    const item = {
      revisions: sampleKnativeRevisions.data,
      ksroutes: sampleKnativeRoutes.data,
      obj: knativeServiceObj,
      pods: sampleKnativePods.data,
      buildConfigs: [],
    } as OverviewItem;
    const wrapper = shallow(<KnativeServiceResources item={item} />);
    expect(wrapper.find(PodsOverview)).toHaveLength(1);
    expect(wrapper.find(KSRoutesOverviewList)).toHaveLength(1);
    expect(wrapper.find(RevisionsOverviewList)).toHaveLength(1);
    expect(wrapper.find(BuildOverview)).toHaveLength(0);
  });

  it('should render buildOverview if buildconfigs is present', () => {
    const item = {
      revisions: sampleKnativeRevisions.data,
      ksroutes: sampleKnativeRoutes.data,
      obj: knativeServiceObj,
      pods: sampleKnativePods.data,
      buildConfigs: [{}],
    } as OverviewItem;
    const wrapper = shallow(<KnativeServiceResources item={item} />);
    expect(wrapper.find(BuildOverview)).toHaveLength(1);
  });
});
