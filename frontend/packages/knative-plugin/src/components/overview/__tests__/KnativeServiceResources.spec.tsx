import * as React from 'react';
import { shallow } from 'enzyme';
import { PodsOverview } from '@console/internal/components/overview/pods-overview';
import {
  sampleKnativePods,
  sampleKnativeRoutes,
  sampleKnativeRevisions,
  knativeServiceObj,
} from '@console/dev-console/src/components/topology/__tests__/topology-knative-test-data';
import { OverviewItem } from '@console/shared';
import KnativeServiceResources from '../KnativeServiceResources';
import KSRoutesOverviewList from '../RoutesOverviewList';
import RevisionsOverviewList from '../RevisionsOverviewList';

describe('KnativeServiceResources', () => {
  it('should render KnativeServiceResources', () => {
    const item = {
      revisions: sampleKnativeRevisions.data,
      ksroutes: sampleKnativeRoutes.data,
      obj: knativeServiceObj,
      pods: sampleKnativePods.data,
    } as OverviewItem;
    const wrapper = shallow(<KnativeServiceResources item={item} />);
    expect(wrapper.find(PodsOverview)).toHaveLength(1);
    expect(wrapper.find(KSRoutesOverviewList)).toHaveLength(1);
    expect(wrapper.find(RevisionsOverviewList)).toHaveLength(1);
  });
});
