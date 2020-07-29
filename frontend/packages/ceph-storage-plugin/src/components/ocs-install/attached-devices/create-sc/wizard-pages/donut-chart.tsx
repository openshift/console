import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { ChartDonut, ChartLabel } from '@patternfly/react-charts';

import { calculateRadius } from '@console/shared';
import { pluralize, convertToBaseValue } from '@console/internal/components/utils/';
import { getNodes } from '@console/local-storage-operator-plugin/src/utils';
import { DiskListModal } from './disk-list';
import { State, Action, Discoveries } from '../state';
import { dropdownUnits } from '../../../../../constants';
import { getTotalDeviceCapacity } from '../../../../../utils/install';
import '../../attached-devices.scss';

export const DiscoveryDonutChart: React.FC<DiscoveryDonutChartProps> = ({ state, dispatch }) => {
  const [availableCapacityStr, setAvailableCapacityStr] = React.useState('');
  const donutData = [
    { x: 'Selected', y: state.chartSelectedData },
    {
      x: 'Available',
      y: Number(state.chartTotalData) - Number(state.chartSelectedData),
    },
  ];
  const nodes = getNodes(state.showNodesListOnLVS, state.nodeNamesForLVS, state.nodeNames);
  const { podStatusInnerRadius: innerRadius, podStatusOuterRadius: radius } = calculateRadius(220);

  React.useEffect(() => {
    const filterDisks = () => {
      const minSize = state.minDiskSize
        ? Number(convertToBaseValue(`${state.minDiskSize} ${dropdownUnits[state.diskSizeUnit]}`))
        : 0;
      const maxSize = state.maxDiskSize
        ? Number(convertToBaseValue(`${state.maxDiskSize} ${dropdownUnits[state.diskSizeUnit]}`))
        : '';
      const filteredDiscoveries: Discoveries[] = state.nodesDiscoveries.filter((disk) => {
        if (nodes.includes(disk.node)) {
          const isValidSize =
            Number(disk.size) >= minSize && (maxSize ? Number(disk.size) <= maxSize : true);
          if (isValidSize) {
            return true;
          }
        }
        return false;
      });
      const capacity = getTotalDeviceCapacity(filteredDiscoveries);
      dispatch({ type: 'setChartSelectedData', value: capacity?.value });
      dispatch({ type: 'setFilteredDiscoveries', value: filteredDiscoveries });
    };

    filterDisks();
  }, [
    state.minDiskSize,
    state.maxDiskSize,
    state.diskSizeUnit,
    nodes,
    state.nodesDiscoveries,
    dispatch,
  ]);

  React.useEffect(() => {
    const str = `${Number(state.chartSelectedData).toFixed(1)} ${state.chartDataUnit}`;
    setAvailableCapacityStr(str);
  }, [state.chartSelectedData, state.chartDataUnit]);

  return (
    <div className="ceph-ocs-install__chart-wrapper">
      <div className="ceph-ocs-install_capacity-header">Selected Capacity</div>
      <div className="ceph-ocs-install__stats">
        <div>{pluralize(nodes.length, 'Node')}</div>
        <div className="ceph-ocs-install_stats--divider" />
        <div>
          <Button
            component="a"
            variant="link"
            onClick={() => dispatch({ type: 'setShowDiskList', value: true })}
            className="ceph-ocs-install__disk-list-btn"
          >
            {pluralize(state.filteredDiscoveries.length, 'Disk')}
          </Button>
        </div>
      </div>
      <ChartDonut
        ariaDesc="Selected versus Available Capacity"
        ariaTitle="Selected versus Available Capacity"
        height={220}
        width={220}
        innerRadius={innerRadius}
        radius={radius}
        data={donutData}
        labels={({ datum }) => `${datum.y} ${state.chartDataUnit} ${datum.x}`}
        subTitle={`Out of ${Number(state.chartTotalData).toFixed(1)} ${state.chartDataUnit}`}
        title={availableCapacityStr}
        constrainToVisibleArea
        subTitleComponent={
          <ChartLabel dy={5} style={{ fill: `var(--pf-global--palette--black-500)` }} />
        }
      />
      <DiskListModal state={state} dispatch={dispatch} />
    </div>
  );
};

type DiscoveryDonutChartProps = {
  state: State;
  dispatch: React.Dispatch<Action>;
};
