import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Button } from '@patternfly/react-core';
import { ChartDonut, ChartLabel } from '@patternfly/react-charts';

import { calculateRadius, Modal } from '@console/shared';
import { convertToBaseValue, humanizeBinaryBytes } from '@console/internal/components/utils/';
import { NodeModel } from '@console/internal/models';
import { ListPage } from '@console/internal/components/factory';
import {
  DISK_TYPES,
  deviceTypeDropdownItems,
} from '@console/local-storage-operator-plugin/src/constants';
import { NodesTable } from '@console/local-storage-operator-plugin/src/components/tables/nodes-table';
import {
  DiskMetadata,
  LocalVolumeDiscoveryResultKind,
} from '@console/local-storage-operator-plugin/src/components/disks-list/types';
import { DiskType } from '@console/local-storage-operator-plugin/src/components/local-volume-set/types';
import { AVAILABLE } from '@console/ceph-storage-plugin/src/constants';
import { DiscoveredDisk } from '@console/ceph-storage-plugin/src/types';
import { DiskListModal } from './disk-list-modal';
import { WizardState, WizardDispatch } from '../../reducer';
import './selected-capacity.scss';

const getTotalCapacity = (disks: DiscoveredDisk[]): number =>
  disks.reduce((total: number, disk: DiskMetadata) => total + disk.size, 0);

const isAvailableDisk = (disk: DiscoveredDisk): boolean =>
  disk?.status?.state === AVAILABLE &&
  (disk.type === DiskType.RawDisk || disk.type === DiskType.Partition);

const isValidSize = (disk: DiscoveredDisk, minSize: number, maxSize: number) =>
  Number(disk.size) >= minSize && (maxSize ? Number(disk.size) <= maxSize : true);

const isValidDiskProperty = (disk: DiscoveredDisk, property: DiskMetadata['property']) =>
  property ? property === disk.property : true;

const isValidDeviceType = (disk: DiscoveredDisk, types: string[]) =>
  types.includes(deviceTypeDropdownItems[disk.type.toUpperCase()]);

const addNodesOnAvailableDisks = (disks: DiskMetadata[], node: string) =>
  disks?.reduce((availableDisks: DiscoveredDisk[], disk: DiscoveredDisk) => {
    if (isAvailableDisk(disk)) {
      disk.node = node;
      return [disk, ...availableDisks];
    }
    return availableDisks;
  }, []);

const createDiscoveredDiskData = (results: LocalVolumeDiscoveryResultKind[]): DiscoveredDisk[] =>
  results?.reduce((discoveredDisk: DiscoveredDisk[], lvdr) => {
    const lvdrDisks = lvdr?.status?.discoveredDevices;
    const lvdrNode = lvdr?.spec?.nodeName;
    const availableDisks = addNodesOnAvailableDisks(lvdrDisks, lvdrNode);
    return [...availableDisks, ...discoveredDisk];
  }, []);

export const SelectedCapacity: React.FC<SelectedCapacityProps> = ({
  state,
  nodes,
  lvdResults,
  dispatch,
}) => {
  const { t } = useTranslation();
  const [showNodeList, setShowNodeList] = React.useState(false);
  const [showDiskList, setShowDiskList] = React.useState(false);

  const minSize: number = state.minDiskSize
    ? Number(convertToBaseValue(`${state.minDiskSize} ${state.diskSizeUnit}`))
    : 0;
  const maxSize: number = state.maxDiskSize
    ? Number(convertToBaseValue(`${state.maxDiskSize} ${state.diskSizeUnit}`))
    : undefined;

  const allDiscoveredDisks: DiscoveredDisk[] = React.useMemo(
    () => createDiscoveredDiskData(lvdResults),
    [lvdResults],
  );

  const filteredDisks: DiscoveredDisk[] = React.useMemo(
    () =>
      allDiscoveredDisks.length
        ? allDiscoveredDisks.filter(
            (disk: DiscoveredDisk) =>
              state.isValidDiskSize &&
              isValidSize(disk, minSize, maxSize) &&
              isValidDiskProperty(disk, DISK_TYPES[state.diskType]?.property) &&
              isValidDeviceType(disk, state.deviceType),
          )
        : [],
    [allDiscoveredDisks, maxSize, minSize, state.deviceType, state.diskType, state.isValidDiskSize],
  );

  const chartDisks = React.useMemo(() => {
    const selectedNodes = nodes.reduce((data, node) => data.add(node.name), new Set());
    return filteredDisks.filter((disk: DiscoveredDisk) => selectedNodes.has(disk.node));
  }, [filteredDisks, nodes]);

  React.useEffect(() => {
    const chartNodes: Set<string> = chartDisks.reduce(
      (data: Set<string>, disk: DiscoveredDisk) => data.add(disk.node),
      new Set(),
    );
    if (!_.isEqual(chartNodes, state.chartNodes)) {
      dispatch({
        type: 'wizard/setCreateLocalVolumeSet',
        payload: { field: 'chartNodes', value: chartNodes },
      });
    }
  }, [chartDisks, dispatch, state.chartNodes]);

  const totalCapacity = getTotalCapacity(allDiscoveredDisks);
  const selectedCapacity = getTotalCapacity(chartDisks);

  const donutData = [
    { x: 'Selected', y: selectedCapacity },
    {
      x: 'Available',
      y: Number(totalCapacity) - Number(selectedCapacity),
    },
  ];
  const { podStatusOuterRadius: radius } = calculateRadius(220);

  return (
    <div className="odf-install__chart-wrapper">
      <div className="odf-install_capacity-header">
        {t('ceph-storage-plugin~Selected capacity')}
      </div>
      <div className="odf-install__stats">
        <Button
          variant="link"
          isDisabled={!state.chartNodes.size}
          onClick={() => setShowNodeList(true)}
          className="odf-install__node-list-btn"
        >
          {t('ceph-storage-plugin~{{nodes, number}} Node', {
            nodes: state.chartNodes.size,
            count: state.chartNodes.size,
          })}
        </Button>
        <div className="odf-install_stats--divider" />
        <Button
          variant="link"
          isDisabled={!chartDisks.length}
          onClick={() => setShowDiskList(true)}
          className="odf-install__disk-list-btn"
        >
          {t('ceph-storage-plugin~{{disks, number}} Disk', {
            disks: chartDisks.length,
            count: chartDisks.length,
          })}
        </Button>
      </div>
      <ChartDonut
        ariaDesc={t('ceph-storage-plugin~Selected versus Available Capacity')}
        ariaTitle={t('ceph-storage-plugin~Selected versus Available Capacity')}
        height={220}
        width={220}
        radius={radius}
        data={donutData}
        labels={({ datum }) => `${humanizeBinaryBytes(datum.y).string} ${datum.x}`}
        subTitle={t('ceph-storage-plugin~Out of {{capacity}}', {
          capacity: humanizeBinaryBytes(totalCapacity).string,
        })}
        title={humanizeBinaryBytes(selectedCapacity).string}
        constrainToVisibleArea
        subTitleComponent={
          <ChartLabel dy={5} style={{ fill: `var(--pf-global--palette--black-500)` }} />
        }
      />
      <DiskListModal
        showDiskList={showDiskList}
        disks={chartDisks}
        onCancel={() => setShowDiskList(false)}
      />
      <NodeListModal
        showNodeList={showNodeList}
        filteredNodes={[...state.chartNodes]}
        onCancel={() => setShowNodeList(false)}
      />
    </div>
  );
};

type SelectedCapacityProps = {
  state: WizardState['createLocalVolumeSet'];
  dispatch: WizardDispatch;
  ns: string;
  nodes: WizardState['nodes'];
  lvdResults: LocalVolumeDiscoveryResultKind[];
};

const NodeListModal: React.FC<NodeListModalProps> = ({ filteredNodes, onCancel, showNodeList }) => {
  const { t } = useTranslation();

  return (
    <Modal
      title={t('ceph-storage-plugin~Selected nodes')}
      isOpen={showNodeList}
      onClose={onCancel}
      className="odf-install__filtered-modal"
      actions={[
        <Button key="confirm" variant="primary" onClick={onCancel}>
          {t('ceph-storage-plugin~Close')}
        </Button>,
      ]}
    >
      <ListPage
        kind={NodeModel.kind}
        showTitle={false}
        ListComponent={NodesTable}
        hideLabelFilter
        hideNameLabelFilters
        customData={{ filteredNodes, hasOnSelect: false }}
      />
    </Modal>
  );
};

type NodeListModalProps = {
  showNodeList: boolean;
  filteredNodes: string[];
  onCancel: () => void;
};
