import { DeploymentModel } from '@console/internal/models';
import { sampleDeployments } from '@console/shared/src/utils/__tests__/test-resource-data';
import { AddHealthChecks, EditHealthChecks } from '../modify-health-checks';

describe('modify health checks action', () => {
  it('"Edit Health Checks" option should be visible for Deployments with probes', () => {
    const editHealthChecksoption = EditHealthChecks(DeploymentModel, sampleDeployments.data[2]);
    const addHealthChecksoption = AddHealthChecks(DeploymentModel, sampleDeployments.data[2]);
    expect(editHealthChecksoption.hidden).toBe(false);
    expect(addHealthChecksoption.hidden).toBe(true);
  });

  it('"Add Health Checks" option should be visible for Deployments with no probes', () => {
    const editHealthCheckoption = EditHealthChecks(DeploymentModel, sampleDeployments.data[1]);
    const addHealthChecksoption = AddHealthChecks(DeploymentModel, sampleDeployments.data[1]);
    expect(editHealthCheckoption.hidden).toBe(true);
    expect(addHealthChecksoption.hidden).toBe(false);
  });
});
