import * as React from 'react';
import { shallow } from 'enzyme';
import { PodsOverviewContent } from '@console/internal/components/overview/pods-overview';
import {
  sampleKnativeConfigurations,
  sampleKnativeRoutes,
  revisionObj,
} from '../../../topology/__tests__/topology-knative-test-data';
import { usePodsForRevisions } from '../../../utils/usePodsForRevisions';
import ConfigurationsOverviewList from '../ConfigurationsOverviewList';
import DeploymentOverviewList from '../DeploymentOverviewList';
import KnativeRevisionResources from '../KnativeRevisionResources';
import KSRoutesOverviewList from '../RoutesOverviewList';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

jest.mock('../../../utils/usePodsForRevisions', () => ({
  usePodsForRevisions: jest.fn(),
}));

describe('KnativeRevisionResources', () => {
  it('should render KnativeRevisionResources', () => {
    (usePodsForRevisions as jest.Mock).mockReturnValueOnce({
      loaded: true,
      loadError: null,
      pods: [],
    });
    const wrapper = shallow(
      <KnativeRevisionResources
        ksroutes={sampleKnativeRoutes.data}
        obj={revisionObj}
        configurations={sampleKnativeConfigurations.data}
      />,
    );
    expect(wrapper.find(PodsOverviewContent)).toHaveLength(1);
    expect(wrapper.find(ConfigurationsOverviewList)).toHaveLength(1);
    expect(wrapper.find(KSRoutesOverviewList)).toHaveLength(1);
    expect(wrapper.find(DeploymentOverviewList)).toHaveLength(1);
  });
});
