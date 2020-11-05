import * as React from 'react';
import { shallow } from 'enzyme';
import { PodsOverviewContent } from '@console/internal/components/overview/pods-overview';
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

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

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
    expect(wrapper.find(PodsOverviewContent)).toHaveLength(1);
    expect(wrapper.find(ConfigurationsOverviewList)).toHaveLength(1);
    expect(wrapper.find(KSRoutesOverviewList)).toHaveLength(1);
    expect(wrapper.find(DeploymentOverviewList)).toHaveLength(1);
  });
});
