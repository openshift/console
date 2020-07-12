import * as React from 'react';
import { Table, RowFunction } from '@console/internal/components/factory';
import { sortable } from '@patternfly/react-table';
import { getName, getNamespace, dimensifyHeader } from '@console/shared';
import { useSafetyFirst } from '@console/internal/components/safety-first';
import { Button } from '@patternfly/react-core';
import { EmptyBox } from '@console/internal/components/utils';
import {
  WatchK8sResource,
  useK8sWatchResource,
} from '@console/internal/components/utils/k8s-watch-hook';
import { getVmSnapshotVmName } from '../../selectors/snapshot/snapshot';
import { VMSnapshot } from '../../types';
import { isVMI } from '../../selectors/check-type';
import { wrapWithProgress } from '../../utils/utils';
import { VMLikeEntityTabProps } from '../vms/types';
import { snapshotsTableColumnClasses } from './utils';
import { ADD_SNAPSHOT } from '../../utils/strings';
import { VirtualMachineSnapshotModel } from '../../models';
import { SnapshotRow } from './snapshot-row';
import SnapshotModal from '../modals/snapshot-modal/snapshot-modal';
import { asVM, isVMRunningOrExpectedRunning } from '../../selectors/vm';

export type VMSnapshotsTableProps = {
  data?: any[];
  customData?: object;
  row: RowFunction;
  columnClasses: string[];
  loadError: any;
  loaded: boolean;
};

const NoDataEmptyMsg = () => <EmptyBox label="Snapshots" />;

export const VMSnapshotsTable: React.FC<VMSnapshotsTableProps> = ({
  data,
  customData,
  row: Row,
  columnClasses,
  loaded,
  loadError,
}) => (
  <Table
    aria-label="VM Snapshots List"
    loaded={loaded}
    loadError={loadError}
    data={data}
    NoDataEmptyMsg={NoDataEmptyMsg}
    Header={() =>
      dimensifyHeader(
        [
          {
            title: 'Name',
            sortField: 'metadata.name',
            transforms: [sortable],
          },
          {
            title: 'Created',
            sortField: 'metadata.creationTimestamp',
            transforms: [sortable],
          },
          {
            title: 'Status',
            sortField: 'status.readyToUse',
            transforms: [sortable],
          },
          {
            title: '',
          },
        ],
        columnClasses,
      )
    }
    Row={Row}
    customData={{ ...customData, columnClasses }}
    virtualize
  />
);

export const VMSnapshotsPage: React.FC<VMLikeEntityTabProps> = ({ obj: vmLikeEntity }) => {
  const vmName = getName(vmLikeEntity);
  const namespace = getNamespace(vmLikeEntity);

  const resource: WatchK8sResource = React.useMemo(
    () => ({
      isList: true,
      kind: VirtualMachineSnapshotModel.kind,
      namespaced: true,
      namespace,
    }),
    [namespace],
  );

  const [snapshots, snapshotsLoaded, snapshotsError] = useK8sWatchResource<VMSnapshot[]>(resource);
  const [isLocked, setIsLocked] = useSafetyFirst(false);
  const withProgress = wrapWithProgress(setIsLocked);
  const filteredSnapshots = snapshots.filter((snap) => getVmSnapshotVmName(snap) === vmName);
  const isDisabled = isLocked || isVMRunningOrExpectedRunning(asVM(vmLikeEntity));

  return (
    <div className="co-m-list">
      {!isVMI(vmLikeEntity) && (
        <div className="co-m-pane__filter-bar">
          <div className="co-m-pane__filter-bar-group">
            <Button
              variant="primary"
              id="add-snapshot"
              onClick={() =>
                withProgress(
                  SnapshotModal({
                    blocking: true,
                    vmLikeEntity,
                  }).result,
                )
              }
              isDisabled={isDisabled}
            >
              {ADD_SNAPSHOT}
            </Button>
          </div>
        </div>
      )}
      <div className="co-m-pane__body">
        <VMSnapshotsTable
          loaded={snapshotsLoaded}
          loadError={snapshotsError}
          data={filteredSnapshots}
          customData={{
            vmLikeEntity,
            withProgress,
            isDisabled,
          }}
          row={SnapshotRow}
          columnClasses={snapshotsTableColumnClasses}
        />
      </div>
    </div>
  );
};
