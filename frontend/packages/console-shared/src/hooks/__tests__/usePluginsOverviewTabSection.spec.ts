import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { useExtensions, OverviewTabSection, LazyLoader } from '@console/plugin-sdk';
import { testHook } from '@console/shared/src/test-utils/hooks-utils';
import { OverviewItem } from '../../types/resource';
import { sampleDeploymentConfigs } from '../../utils/__tests__/test-resource-data';
import { usePluginsOverviewTabSection } from '../plugins-overview-tab-section';

jest.mock('@console/plugin-sdk/src/api/useExtensions', () => ({
  useExtensions: jest.fn(),
}));
describe('usePluginsOverviewTabSection', () => {
  let item: OverviewItem;
  beforeEach(() => {
    item = {
      obj: sampleDeploymentConfigs.data[0],
      deploymentConfigs: sampleDeploymentConfigs,
      isMonitorable: true,
    } as OverviewItem;
  });

  it('should be empty, if there is no overview tab section registered', () => {
    testHook(() => {
      (useExtensions as jest.Mock).mockReturnValue([]);
      expect(usePluginsOverviewTabSection(item)).toHaveLength(0);
    });
  });
  it('should not be empty, when there is overview tab section registered', () => {
    const loader: LazyLoader = jasmine
      .createSpy('loader')
      .and.returnValue(Promise.resolve(React.createElement(Button)));

    const tabSection: OverviewTabSection = {
      type: 'Overview/Section',
      properties: {
        key: 'deploymentConfigs',
        loader,
      },
    };
    testHook(() => {
      (useExtensions as jest.Mock).mockReturnValue([tabSection]);
      expect(usePluginsOverviewTabSection(item)).toHaveLength(1);
    });
  });
});
