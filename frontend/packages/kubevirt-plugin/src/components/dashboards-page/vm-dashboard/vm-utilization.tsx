import * as React from 'react';
import * as _ from 'lodash';
import {
  Dropdown,
  humanizeDecimalBytes,
  humanizeCpuCores as humanizeCpuCoresUtil,
} from '@console/internal/components/utils';
import { getName, getNamespace } from '@console/shared';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import UtilizationBody from '@console/shared/src/components/dashboard/utilization-card/UtilizationBody';
import {
  ONE_HR,
  SIX_HR,
  TWENTY_FOUR_HR,
} from '@console/shared/src/components/dashboard/utilization-card/dropdown-value';
import { PrometheusUtilizationItem } from '@console/internal/components/dashboard/dashboards-page/overview-dashboard/utilization-card';
import { VMDashboardContext } from '../../vms/vm-dashboard-context';
import { findVMPod } from '../../../selectors/pod/selectors';
import { getUtilizationQueries, VMQueries } from './queries';

const metricDurations = [ONE_HR, SIX_HR, TWENTY_FOUR_HR];
const metricDurationsOptions = _.zipObject(metricDurations, metricDurations);

// TODO: extend humanizeCpuCores() from @console/internal for the flexibility of space
const humanizeCpuCores = (v) => {
  const humanized = humanizeCpuCoresUtil(v);
  // add space betwee value and unit
  const val = humanized.string.match(/[\d.]+/) || [humanized.string];
  humanized.string = `${val[0]} ${humanized.unit}`;
  return humanized;
};

export const VMUtilizationCard: React.FC = () => {
  const [timestamps, setTimestamps] = React.useState<Date[]>();
  const [duration, setDuration] = React.useState(metricDurations[0]);
  const { vm, pods } = React.useContext(VMDashboardContext);
  const vmName = getName(vm);
  const namespace = getNamespace(vm);
  const launcherPodName = getName(findVMPod(vm, pods));
  const queries = React.useMemo(
    () =>
      getUtilizationQueries({
        vmName,
        namespace,
        launcherPodName,
      }),
    [vmName, namespace, launcherPodName],
  );

  /* TODO: use when multi-line charts are ready
    const netStats = [
      getRangeVectorStats(netUtilizationIn),
      getRangeVectorStats(netUtilizationOut),
    ];
    const netDataUnits = ['In', 'Out'];
    */

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Utilization</DashboardCardTitle>
        <Dropdown
          items={metricDurationsOptions}
          onChange={setDuration}
          selectedKey={duration}
          title={duration}
        />
      </DashboardCardHeader>
      <UtilizationBody timestamps={timestamps}>
        <PrometheusUtilizationItem
          title="CPU"
          utilizationQuery={queries[VMQueries.CPU_USAGE]}
          humanizeValue={humanizeCpuCores}
          duration={duration}
          setTimestamps={setTimestamps}
        />
        <PrometheusUtilizationItem
          title="Memory"
          utilizationQuery={queries[VMQueries.MEMORY_USAGE]}
          humanizeValue={humanizeDecimalBytes}
          duration={duration}
        />
        <PrometheusUtilizationItem
          title="Filesystem"
          utilizationQuery={queries[VMQueries.FILESYSTEM_USAGE]}
          humanizeValue={humanizeDecimalBytes}
          duration={duration}
        />
        <PrometheusUtilizationItem
          title="Network Transfer"
          utilizationQuery={queries[VMQueries.NETWORK_INOUT_USAGE]}
          humanizeValue={humanizeDecimalBytes}
          duration={duration}
        />
      </UtilizationBody>
    </DashboardCard>
  );
};

VMUtilizationCard.displayName = 'VMUtilizationCard';
