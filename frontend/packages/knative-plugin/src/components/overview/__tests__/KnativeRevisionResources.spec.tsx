import * as React from 'react';
import { shallow } from 'enzyme';
import { PodsOverview } from '@console/internal/components/overview/pods-overview';
import {
  sampleKnativeConfigurations,
  sampleKnativeRoutes,
  revisionObj,
} from '../../../topology/__tests__/topology-knative-test-data';
import KnativeRevisionResources from '../KnativeRevisionResources';
import ConfigurationsOverviewList from '../ConfigurationsOverviewList';
import KSRoutesOverviewList from '../RoutesOverviewList';
import DeploymentOverviewList from '../DeploymentOverviewList';

jest.mock('@console/shared', () => {
  const ActualShared = require.requireActual('@console/shared');
  return {
    ...ActualShared,
    usePodsWatcher: () => {
      return {
        loaded: true,
        loadError: '',
        podData: {
          obj: null,
          current: null,
          previous: null,
          pods: [],
          isRollingOut: false,
        },
      };
    },
  };
});

describe('KnativeRevisionResources', () => {
  it('should render KnativeRevisionResources', () => {
    const wrapper = shallow(
      <KnativeRevisionResources
        ksroutes={sampleKnativeRoutes.data}
        obj={revisionObj}
        configurations={sampleKnativeConfigurations.data}
      />,
    );
    expect(wrapper.find(PodsOverview)).toHaveLength(1);
    expect(wrapper.find(ConfigurationsOverviewList)).toHaveLength(1);
    expect(wrapper.find(KSRoutesOverviewList)).toHaveLength(1);
    expect(wrapper.find(DeploymentOverviewList)).toHaveLength(1);
  });
});
