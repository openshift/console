import * as React from 'react';
import { shallow } from 'enzyme';
import { PodsOverview } from '@console/internal/components/overview/pods-overview';
import {
  sampleKnativeConfigurations,
  sampleKnativePods,
  sampleKnativeRoutes,
  revisionObj,
} from '../../../topology/__tests__/topology-knative-test-data';
import KnativeRevisionResources from '../KnativeRevisionResources';
import ConfigurationsOverviewList from '../ConfigurationsOverviewList';
import KSRoutesOverviewList from '../RoutesOverviewList';
import DeploymentOverviewList from '../DeploymentOverviewList';

describe('KnativeRevisionResources', () => {
  it('should render KnativeRevisionResources', () => {
    const wrapper = shallow(
      <KnativeRevisionResources
        ksroutes={sampleKnativeRoutes.data}
        obj={revisionObj}
        configurations={sampleKnativeConfigurations.data}
        pods={sampleKnativePods.data}
      />,
    );
    expect(wrapper.find(PodsOverview)).toHaveLength(1);
    expect(wrapper.find(ConfigurationsOverviewList)).toHaveLength(1);
    expect(wrapper.find(KSRoutesOverviewList)).toHaveLength(1);
    expect(wrapper.find(DeploymentOverviewList)).toHaveLength(1);
  });
});
