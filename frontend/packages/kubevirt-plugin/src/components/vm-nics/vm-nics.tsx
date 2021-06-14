import * as React from 'react';
import { Button, ButtonVariant } from '@patternfly/react-core';
import { sortable } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { RowFunction, Table } from '@console/internal/components/factory';
import { useSafetyFirst } from '@console/internal/components/safety-first';
import { createBasicLookup, dimensifyHeader } from '@console/shared';
import { asVMILikeWrapper } from '../../k8s/wrapper/utils/convert';
import { NetworkInterfaceWrapper } from '../../k8s/wrapper/vm/network-interface-wrapper';
import { NetworkWrapper } from '../../k8s/wrapper/vm/network-wrapper';
import { VMWrapper } from '../../k8s/wrapper/vm/vm-wrapper';
import { VMIWrapper } from '../../k8s/wrapper/vm/vmi-wrapper';
import { isVM, isVMI } from '../../selectors/check-type';
import { getSimpleName } from '../../selectors/utils';
import { asVM } from '../../selectors/vm';
import { changedNics } from '../../selectors/vm-like/next-run-changes';
import { isVMRunningOrExpectedRunning } from '../../selectors/vm/selectors';
import { VMGenericLikeEntityKind } from '../../types/vmLike';
import { wrapWithProgress } from '../../utils/utils';
import { nicModalEnhanced } from '../modals/nic-modal/nic-modal-enhanced';
import { VMTabProps } from '../vms/types';
import { NicRow } from './nic-row';
import { NetworkBundle } from './types';
import { nicTableColumnClasses } from './utils';

const getNicsData = (vmLikeEntity: VMGenericLikeEntityKind): NetworkBundle[] => {
  const vmiLikeWrapper = asVMILikeWrapper(vmLikeEntity);

  const networks = vmiLikeWrapper?.getNetworks() || [];
  const interfaces = vmiLikeWrapper?.getNetworkInterfaces() || [];

  const networkLookup = createBasicLookup(networks, getSimpleName);

  return interfaces.map((nic) => {
    const network = networkLookup[nic.name];
    const interfaceWrapper = new NetworkInterfaceWrapper(nic);
    const networkWrapper = new NetworkWrapper(network);
    return {
      nic,
      network,
      // for sorting
      name: interfaceWrapper.getName(),
      model: interfaceWrapper.getReadableModel(),
      networkName: networkWrapper.getReadableName(),
      interfaceType: interfaceWrapper.getTypeValue(),
      macAddress: interfaceWrapper.getMACAddress(),
    };
  });
};

export type VMNicsTableProps = {
  data?: any[];
  customData?: object;
  row: RowFunction;
  columnClasses: string[];
};

export const VMNicsTable: React.FC<VMNicsTableProps> = ({
  data,
  customData,
  row: Row,
  columnClasses,
}) => {
  const { t } = useTranslation();
  return (
    <Table
      aria-label={t('kubevirt-plugin~VM Nics List')}
      data={data}
      label={t('kubevirt-plugin~Network Interfaces')}
      Header={() =>
        dimensifyHeader(
          [
            {
              title: t('kubevirt-plugin~Name'),
              sortField: 'name',
              transforms: [sortable],
            },
            {
              title: t('kubevirt-plugin~Model'),
              sortField: 'model',
              transforms: [sortable],
            },
            {
              title: t('kubevirt-plugin~Network'),
              sortField: 'networkName',
              transforms: [sortable],
            },
            {
              title: t('kubevirt-plugin~Type'),
              sortField: 'interfaceType',
              transforms: [sortable],
            },
            {
              title: t('kubevirt-plugin~MAC Address'),
              sortField: 'macAddress',
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
      loaded
    />
  );
};

export const VMNics: React.FC<VMTabProps> = ({
  obj: vmLikeEntity,
  vmis: vmisProp,
  customData: { isCommonTemplate },
}) => {
  const { t } = useTranslation();
  const [isLocked, setIsLocked] = useSafetyFirst(false);
  const withProgress = wrapWithProgress(setIsLocked);
  const vmi = vmisProp?.[0];
  const isVMRunning = isVM(vmLikeEntity) && isVMRunningOrExpectedRunning(asVM(vmLikeEntity), vmi);
  const pendingChangesNICs: Set<string> =
    isVMRunning && vmisProp?.length > 0 && isVMI(vmi)
      ? new Set(changedNics(new VMWrapper(asVM(vmLikeEntity)), new VMIWrapper(vmi)))
      : null;

  return (
    <div className="co-m-list">
      {!isVMI(vmLikeEntity) && (
        <div className="co-m-pane__filter-bar">
          <div className="co-m-pane__filter-bar-group">
            <Button
              variant={ButtonVariant.primary}
              id="add-nic"
              onClick={() =>
                withProgress(
                  nicModalEnhanced({
                    blocking: true,
                    vmLikeEntity,
                    isVMRunning,
                  }).result,
                )
              }
              isDisabled={isLocked || isCommonTemplate}
            >
              {t('kubevirt-plugin~Add Network Interface')}
            </Button>
          </div>
        </div>
      )}
      <div className="co-m-pane__body">
        <VMNicsTable
          data={getNicsData(vmLikeEntity)}
          customData={{
            vmLikeEntity,
            vmi,
            withProgress,
            isDisabled: isLocked || isCommonTemplate,
            pendingChangesNICs,
          }}
          row={NicRow}
          columnClasses={nicTableColumnClasses}
        />
      </div>
    </div>
  );
};
