import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@patternfly/react-core';
import { ChartDonut, ChartLabel } from '@patternfly/react-charts';

import { calculateRadius, Modal } from '@console/shared';
import { convertToBaseValue, humanizeBinaryBytes } from '@console/internal/components/utils/';
import { NodeModel } from '@console/internal/models';
import { ListPage } from '@console/internal/components/factory';
import { getNodes } from '@console/local-storage-operator-plugin/src/utils';
import { DiskListModal } from './disk-list';
import { State, Action, Discoveries } from '../state';
import { getTotalDeviceCapacity } from '../../../../../utils/install';
import AttachedDevicesNodeTable from '../../sc-node-list';
import { DISK_TYPES } from '@console/local-storage-operator-plugin/src/constants';
import '../../attached-devices.scss';

export const DiscoveryDonutChart: React.FC<DiscoveryDonutChartProps> = ({ state, dispatch }) => {
  const { t } = useTranslation();

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
        ? Number(convertToBaseValue(`${state.minDiskSize} ${state.diskSizeUnit}`))
        : 0;
      const maxSize = state.maxDiskSize
        ? Number(convertToBaseValue(`${state.maxDiskSize} ${state.diskSizeUnit}`))
        : '';
      const filteredDiscoveries: Discoveries[] = state.nodesDiscoveries.filter((disk) => {
        if (nodes.includes(disk.node)) {
          const isValidSize =
            Number(disk.size) >= minSize && (maxSize ? Number(disk.size) <= maxSize : true);

          // For disk type All it always true
          let hasDiskType: boolean = true;
          if (DISK_TYPES[state.diskType]?.property) {
            hasDiskType = DISK_TYPES[state.diskType].property === disk.property;
          }

          if (isValidSize && hasDiskType) {
            return true;
          }
        }
        return false;
      });
      const capacity = getTotalDeviceCapacity(filteredDiscoveries);
      dispatch({ type: 'setChartSelectedData', value: capacity });
      dispatch({ type: 'setFilteredDiscoveries', value: filteredDiscoveries });
    };

    filterDisks();
  }, [
    state.minDiskSize,
    state.maxDiskSize,
    state.diskSizeUnit,
    nodes,
    state.nodesDiscoveries,
    state.diskType,
    dispatch,
  ]);

  React.useEffect(() => {
    const filteredNodes = new Set<string>();
    state.filteredDiscoveries.forEach((discovery) => filteredNodes.add(discovery.node));
    dispatch({ type: 'setFilteredNodes', value: Array.from(filteredNodes) });
  }, [state.filteredDiscoveries, dispatch]);

  React.useEffect(() => {
    const str = humanizeBinaryBytes(state.chartSelectedData).string;
    setAvailableCapacityStr(str);
  }, [state.chartSelectedData]);

  return (
    <div className="ceph-ocs-install__chart-wrapper">
      <div className="ceph-ocs-install_capacity-header">
        {t('ceph-storage-plugin~Selected Capacity')}
      </div>
      <div className="ceph-ocs-install__stats">
        <div>
          {state.filteredNodes.length ? (
            <Button
              variant="link"
              onClick={() => dispatch({ type: 'setShowNodeList', value: true })}
              className="ceph-ocs-install__node-list-btn"
            >
              {t('ceph-storage-plugin~{{nodes, number}} Node', {
                nodes: state.filteredNodes.length,
                count: state.filteredNodes.length,
              })}
            </Button>
          ) : (
            <div>
              {t('ceph-storage-plugin~{{nodes, number}} Node', {
                nodes: state.filteredNodes.length,
                count: state.filteredNodes.length,
              })}
            </div>
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
              {t('ceph-storage-plugin~{{disks, number}} Disk', {
                disks: state.filteredDiscoveries.length,
                count: state.filteredDiscoveries.length,
              })}
            </Button>
          ) : (
            <div>
              {' '}
              {t('ceph-storage-plugin~{{disks, number}} Disk', {
                disks: state.filteredDiscoveries.length,
                count: state.filteredDiscoveries.length,
              })}
            </div>
          )}
        </div>
      </div>
      <ChartDonut
        ariaDesc={t('ceph-storage-plugin~Selected versus Available Capacity')}
        ariaTitle={t('ceph-storage-plugin~Selected versus Available Capacity')}
        height={220}
        width={220}
        innerRadius={innerRadius}
        radius={radius}
        data={donutData}
        labels={({ datum }) => `${humanizeBinaryBytes(datum.y).string} ${datum.x}`}
        subTitle={t('ceph-storage-plugin~Out of {{capacity}}', {
          capacity: humanizeBinaryBytes(state.chartTotalData).string,
        })}
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
  const { t } = useTranslation();

  const cancel = () => dispatch({ type: 'setShowNodeList', value: false });

  return (
    <Modal
      title={t('ceph-storage-plugin~Selected Nodes')}
      isOpen={state.showNodeList}
      onClose={cancel}
      className="ceph-ocs-install__filtered-modal"
      actions={[
        <Button key="confirm" variant="primary" onClick={cancel}>
          {t('ceph-storage-plugin~Close')}
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
