import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { sortable } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { WatchK8sResource } from '@console/dynamic-plugin-sdk';
import { RowFunctionArgs, Table } from '@console/internal/components/factory';
import { useSafetyFirst } from '@console/internal/components/safety-first';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { VirtualMachineSnapshotModel } from '../../models';
import { kubevirtReferenceForModel } from '../../models/kubevirtReferenceForModel';
import { getName, getNamespace } from '../../selectors';
import { isVMI } from '../../selectors/check-type';
import { getVmSnapshotVmName } from '../../selectors/snapshot/snapshot';
import { isVMRunningOrExpectedRunning } from '../../selectors/vm/selectors';
import { asVM } from '../../selectors/vm/vm';
import { VMSnapshot } from '../../types';
import { dimensifyHeader } from '../../utils';
import { wrapWithProgress } from '../../utils/utils';
import SnapshotModal from '../modals/snapshot-modal/SnapshotsModal';
import { VMTabProps } from '../vms/types';
import { useMappedVMRestores } from './use-mapped-vm-restores';
import { snapshotsTableColumnClasses } from './utils';
import { VMSnapshotRow } from './vm-snapshot-row';

export type VMSnapshotsTableProps = {
  data?: any[];
  customData?: object;
  Row: React.FC<RowFunctionArgs>;
  columnClasses: string[];
  loadError: any;
  loaded: boolean;
};

export const VMSnapshotsTable: React.FC<VMSnapshotsTableProps> = ({
  data,
  customData,
  Row,
  columnClasses,
  loaded,
  loadError,
}) => {
  const { t } = useTranslation();
  return (
    <Table
      aria-label={t('kubevirt-plugin~VM Snapshots List')}
      loaded={loaded}
      loadError={loadError}
      data={data}
      label={t('kubevirt-plugin~Snapshots')}
      Header={() =>
        dimensifyHeader(
          [
            {
              title: t('kubevirt-plugin~Name'),
              sortField: 'metadata.name',
              transforms: [sortable],
            },
            {
              title: t('kubevirt-plugin~Created'),
              sortField: 'metadata.creationTimestamp',
              transforms: [sortable],
            },
            {
              title: t('kubevirt-plugin~Status'),
              sortField: 'status.readyToUse',
              transforms: [sortable],
            },
            {
              title: t('kubevirt-plugin~Last restored'),
              sortFunc: 'snapshotLastRestore',
              transforms: [sortable],
            },
            {
              title: t('kubevirt-plugin~Indications'),
            },
            {
              title: '',
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
};

export const VMSnapshotsPage: React.FC<VMTabProps> = ({ obj: vmLikeEntity, vmis: vmisProp }) => {
  const { t } = useTranslation();
  const vmName = getName(vmLikeEntity);
  const namespace = getNamespace(vmLikeEntity);
  const vmi = vmisProp[0];

  const snapshotResource: WatchK8sResource = {
    isList: true,
    kind: kubevirtReferenceForModel(VirtualMachineSnapshotModel),
    namespaced: true,
    namespace,
  };

  const [snapshots, snapshotsLoaded, snapshotsError] = useK8sWatchResource<VMSnapshot[]>(
    snapshotResource,
  );
  const [mappedRelevantRestores, restoresLoaded, restoresError] = useMappedVMRestores(namespace);

  const [isLocked, setIsLocked] = useSafetyFirst(false);
  const withProgress = wrapWithProgress(setIsLocked);
  const filteredSnapshots = snapshots.filter((snap) => getVmSnapshotVmName(snap) === vmName);
  const isDisabled = isLocked;

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
                    isVMRunningOrExpectedRunning: isVMRunningOrExpectedRunning(
                      asVM(vmLikeEntity),
                      vmi,
                    ),
                    snapshots,
                  }).result,
                )
              }
            >
              {t('kubevirt-plugin~Take Snapshot')}
            </Button>
          </div>
        </div>
      )}
      <div className="co-m-pane__body">
        <VMSnapshotsTable
          loaded={snapshotsLoaded && restoresLoaded}
          loadError={snapshotsError || restoresError}
          data={filteredSnapshots}
          customData={{
            vmLikeEntity,
            withProgress,
            restores: mappedRelevantRestores,
            isDisabled,
            isVMRunning: isVMRunningOrExpectedRunning(asVM(vmLikeEntity), vmi),
          }}
          Row={VMSnapshotRow}
          columnClasses={snapshotsTableColumnClasses}
        />
      </div>
    </div>
  );
};
