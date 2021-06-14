import * as React from 'react';
import { shallow } from 'enzyme';
import { BuildOverview } from '@console/internal/components/overview/build-overview';
import { PodsOverviewContent } from '@console/internal/components/overview/pods-overview';
import { useExtensions } from '@console/plugin-sdk';
import {
  sampleKnativeRoutes,
  sampleKnativeRevisions,
  knativeServiceObj,
  MockKnativeBuildConfig,
} from '../../../topology/__tests__/topology-knative-test-data';
import { KnativeServiceOverviewItem } from '../../../topology/topology-types';
import { usePodsForRevisions } from '../../../utils/usePodsForRevisions';
import KnativeServiceResources from '../KnativeServiceResources';
import RevisionsOverviewList from '../RevisionsOverviewList';
import KSRoutesOverviewList from '../RoutesOverviewList';

jest.mock('@console/plugin-sdk/src/api/useExtensions', () => ({
  useExtensions: jest.fn(),
}));

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

let mockBuildConfigs = [];

jest.mock('@console/shared', () => {
  const ActualShared = require.requireActual('@console/shared');
  return {
    ...ActualShared,
    useBuildConfigsWatcher: () => {
      return {
        loaded: true,
        loadError: '',
        buildConfigs: mockBuildConfigs,
      };
    },
  };
});

describe('KnativeServiceResources', () => {
  beforeEach(() => {
    (useExtensions as jest.Mock).mockReturnValueOnce([]);
    (usePodsForRevisions as jest.Mock).mockReturnValueOnce({
      loaded: true,
      loadError: null,
      pods: [],
    });
  });

  it('should render KnativeServiceResources', () => {
    mockBuildConfigs = [];
    const item = {
      revisions: sampleKnativeRevisions.data,
      ksroutes: sampleKnativeRoutes.data,
      obj: knativeServiceObj,
    } as KnativeServiceOverviewItem;
    const wrapper = shallow(<KnativeServiceResources item={item} />);
    expect(wrapper.find(PodsOverviewContent)).toHaveLength(1);
    expect(wrapper.find(KSRoutesOverviewList)).toHaveLength(1);
    expect(wrapper.find(RevisionsOverviewList)).toHaveLength(1);
    expect(wrapper.find(BuildOverview)).toHaveLength(0);
  });

  it('should render buildOverview if buildconfigs is present', () => {
    mockBuildConfigs = [MockKnativeBuildConfig];
    const item = {
      revisions: sampleKnativeRevisions.data,
      ksroutes: sampleKnativeRoutes.data,
      obj: knativeServiceObj,
    } as KnativeServiceOverviewItem;
    const wrapper = shallow(<KnativeServiceResources item={item} />);
    expect(wrapper.find(BuildOverview)).toHaveLength(1);
  });
});
