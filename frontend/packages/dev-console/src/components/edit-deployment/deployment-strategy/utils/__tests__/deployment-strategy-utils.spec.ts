import { Resources } from '../../../../import/import-types';
import {
  getDeploymentStrategyItems,
  getDeploymentStrategyHelpText,
} from '../deployment-strategy-utils';
import { DeploymentStrategyType } from '../types';

const t = (key: string) => key.split('~')[1];

describe('getDeploymentStrategyItems', () => {
  it('returns items for kubernetes resources', () => {
    expect(getDeploymentStrategyItems(Resources.Kubernetes, t)).toEqual({
      Recreate: 'Recreate',
      RollingUpdate: 'Rolling Update',
    });
  });

  it('returns items for kubernetes resources', () => {
    expect(getDeploymentStrategyItems(Resources.OpenShift, t)).toEqual({
      Custom: 'Custom',
      Recreate: 'Recreate',
      Rolling: 'Rolling',
    });
  });

  it('returns no items for kubernetes resources', () => {
    expect(getDeploymentStrategyItems(Resources.KnativeService, t)).toEqual({});
  });
});

describe('getDeploymentStrategyHelpText', () => {
  it('return helptext for all known resource and deployment strategy combinations', () => {
    [Resources.Kubernetes, Resources.OpenShift].forEach((resource) => {
      const deployStrategyItems = Object.keys(getDeploymentStrategyItems(resource, t));

      deployStrategyItems.forEach((item: DeploymentStrategyType) => {
        const helpText = getDeploymentStrategyHelpText(resource, item, t);
        expect(helpText).toBeTruthy();
        expect(helpText).toMatch(/[^~]/);
      });
    });
  });
});
