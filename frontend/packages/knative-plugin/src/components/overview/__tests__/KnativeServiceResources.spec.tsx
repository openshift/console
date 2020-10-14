import * as React from 'react';
import { shallow } from 'enzyme';
import { useExtensions } from '@console/plugin-sdk';
import { PodsOverviewContent } from '@console/internal/components/overview/pods-overview';
import {
  sampleKnativeRoutes,
  sampleKnativeRevisions,
  knativeServiceObj,
} from '../../../topology/__tests__/topology-knative-test-data';
import { BuildOverview } from '@console/internal/components/overview/build-overview';
import KnativeServiceResources from '../KnativeServiceResources';
import KSRoutesOverviewList from '../RoutesOverviewList';
import RevisionsOverviewList from '../RevisionsOverviewList';
import { KnativeServiceOverviewItem } from '../../../topology/topology-types';
import { usePodsForRevisions } from '../../../utils/usePodsForRevisions';

jest.mock('@console/plugin-sdk/src/api/useExtensions', () => ({
  useExtensions: jest.fn(),
}));

jest.mock('../../../utils/usePodsForRevisions', () => ({
  usePodsForRevisions: jest.fn(),
}));

describe('KnativeServiceResources', () => {
  beforeEach(() => {
    (useExtensions as jest.Mock).mockReturnValueOnce([]);
    (usePodsForRevisions as jest.Mock).mockReturnValueOnce({
      loaded: true,
      loadError: null,
      pods: {},
    });
  });

  it('should render KnativeServiceResources', () => {
    const item = {
      revisions: sampleKnativeRevisions.data,
      ksroutes: sampleKnativeRoutes.data,
      obj: knativeServiceObj,
      buildConfigs: [],
    } as KnativeServiceOverviewItem;
    const wrapper = shallow(<KnativeServiceResources item={item} />);
    expect(wrapper.find(PodsOverviewContent)).toHaveLength(1);
    expect(wrapper.find(KSRoutesOverviewList)).toHaveLength(1);
    expect(wrapper.find(RevisionsOverviewList)).toHaveLength(1);
    expect(wrapper.find(BuildOverview)).toHaveLength(0);
  });

  it('should render buildOverview if buildconfigs is present', () => {
    const item = {
      revisions: sampleKnativeRevisions.data,
      ksroutes: sampleKnativeRoutes.data,
      obj: knativeServiceObj,
      buildConfigs: [{}],
    } as KnativeServiceOverviewItem;
    const wrapper = shallow(<KnativeServiceResources item={item} />);
    expect(wrapper.find(BuildOverview)).toHaveLength(1);
  });
});
