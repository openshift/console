import * as React from 'react';
import { Button, Modal } from '@patternfly/react-core';
import { ChartDonut, ChartLabel } from '@patternfly/react-charts';

import { calculateRadius } from '@console/shared';
import { pluralize, convertToBaseValue } from '@console/internal/components/utils/';
import { NodeModel } from '@console/internal/models';
import { ListPage } from '@console/internal/components/factory';
import { getNodes } from '@console/local-storage-operator-plugin/src/utils';
import { DiskListModal } from './disk-list';
import { State, Action, Discoveries } from '../state';
import { dropdownUnits } from '../../../../../constants';
import { getTotalDeviceCapacity } from '../../../../../utils/install';
import AttachedDevicesNodeTable from '../../sc-node-list';
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
    const filteredNodes = new Set<string>();
    state.filteredDiscoveries.forEach((discovery) => filteredNodes.add(discovery.node));
    dispatch({ type: 'setFilteredNodes', value: Array.from(filteredNodes) });
  }, [state.filteredDiscoveries, dispatch]);

  React.useEffect(() => {
    const str = `${Number(state.chartSelectedData).toFixed(1)} ${state.chartDataUnit}`;
    setAvailableCapacityStr(str);
  }, [state.chartSelectedData, state.chartDataUnit]);

  return (
    <div className="ceph-ocs-install__chart-wrapper">
      <div className="ceph-ocs-install_capacity-header">Selected Capacity</div>
      <div className="ceph-ocs-install__stats">
        <div>
          {state.filteredNodes.length ? (
            <Button
              variant="link"
              onClick={() => dispatch({ type: 'setShowNodeList', value: true })}
              className="ceph-ocs-install__node-list-btn"
            >
              {pluralize(state.filteredNodes.length, 'Node')}
            </Button>
          ) : (
            <div>{`${state.filteredNodes.length} Node`}</div>
          )}
        </div>
        <div className="ceph-ocs-install_stats--divider" />
        <div>
          {state.filteredDiscoveries.length ? (
            <Button
              variant="link"
              onClick={() => dispatch({ type: 'setShowDiskList', value: true })}
              className="ceph-ocs-install__disk-list-btn"
            >
              {pluralize(state.filteredDiscoveries.length, 'Disk')}
            </Button>
          ) : (
            <div>{`${state.filteredDiscoveries.length} Disk`}</div>
          )}
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
      <NodeListModal state={state} dispatch={dispatch} />
    </div>
  );
};

const NodeListModal: React.FC<DiscoveryDonutChartProps> = ({ state, dispatch }) => {
  const cancel = () => dispatch({ type: 'setShowNodeList', value: false });

  return (
    <Modal
      title="Selected Nodes"
      isOpen={state.showNodeList}
      onClose={cancel}
      className="ceph-ocs-install__filtered-modal"
      actions={[
        <Button key="confirm" variant="primary" onClick={cancel}>
          Close
        </Button>,
      ]}
    >
      <ListPage
        kind={NodeModel.kind}
        showTitle={false}
        ListComponent={AttachedDevicesNodeTable}
        hideLabelFilter
        hideNameLabelFilters
        customData={{ filteredNodes: state.filteredNodes }}
      />
    </Modal>
  );
};

type DiscoveryDonutChartProps = {
  state: State;
  dispatch: React.Dispatch<Action>;
};
