import { HealthState } from '@console/internal/components/dashboard/health-card/states';
import { SubsystemHealth } from '@console/internal/components/dashboards-page/overview-dashboard/health-card';

export const getFooHealthState = (): SubsystemHealth => ({
  message: 'Foo is healthy',
  state: HealthState.OK,
});

export const getBarHealthState = (): SubsystemHealth => ({
  message: 'Bar is in an error state',
  state: HealthState.ERROR,
});
