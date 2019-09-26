import * as _ from 'lodash';
import { HealthState } from '@console/internal/components/dashboard/health-card/states';
import { SubsystemHealth } from '@console/internal/components/dashboards-page/overview-dashboard/health-card';
import { FirehoseResult } from '@console/internal/components/utils';

export const getFooHealthState = (): SubsystemHealth => ({
  message: 'Foo is healthy',
  state: HealthState.OK,
});

export const getBarHealthState = (response, error, nodes: FirehoseResult): SubsystemHealth => {
  if (!response || !_.get(nodes, 'loaded')) {
    return {
      state: HealthState.LOADING,
    };
  }
  return {
    message: 'Bar is in an error state',
    state: HealthState.ERROR,
  };
};
