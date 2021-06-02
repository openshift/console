import * as React from 'react';
import {
  Breadcrumb,
  BreadcrumbHeading,
  BreadcrumbItem,
  Button,
  ButtonVariant,
  List,
  ListItem,
} from '@patternfly/react-core';
import * as _ from 'lodash';
import { Firehose, FirehoseResult } from '@console/internal/components/utils';
import { VMWrapper } from '../../k8s/wrapper/vm/vm-wrapper';
import { VMIWrapper } from '../../k8s/wrapper/vm/vmi-wrapper';
import { VirtualMachineInstanceModel, VirtualMachineModel } from '../../models';
import { asVM } from '../../selectors/vm';
import { isVMRunningOrExpectedRunning } from '../../selectors/vm/selectors';
import { PENDING_CHANGES_WARNING_MESSAGE } from '../../strings/vm/status';
import { VMIKind, VMKind } from '../../types';
import { VMLikeEntityKind } from '../../types/vmLike';
import { getLoadedData } from '../../utils';
import { getPendingChanges, hasPendingChanges } from '../../utils/pending-changes';
import { PendingChangesAlert } from '../Alerts/PendingChangesAlert';
import { PendingChanges, PendingChangesByTab } from './types';

import './pending-changes-warning.scss';

type PendingChangesWarningProps = {
  vmi?: FirehoseResult<VMIKind>;
  vmLikeEntity?: FirehoseResult<VMLikeEntityKind>;
};

const getPendingChangesByTab = (pendingChanges: PendingChanges): PendingChangesByTab =>
  Object.keys(pendingChanges)
    .filter((key) => pendingChanges[key].isPendingChange)
    .reduce((acc, key) => {
      const pc = pendingChanges[key];
      const changedResourceNames: string[] = pc?.resourceNames;

      if (changedResourceNames) {
        return {
          ...acc,
          [pc.vmTab]: {
            resources: changedResourceNames,
            pendingChangesKey: key,
          },
        };
      }

      return {
        ...acc,
        [pc.vmTab]: acc[pc.vmTab]
          ? { resources: [...acc[pc.vmTab].resources, key] }
          : { resources: [key] },
      };
    }, {});

type WarningTabRowProps = {
  tabName: string;
  tabProps: string[];
  pendingChanges: PendingChanges;
  pendingChangesKey?: string;
};

const WarningTabRow: React.FC<WarningTabRowProps> = ({
  tabName,
  tabProps,
  pendingChanges,
  pendingChangesKey,
}) => (
  <Breadcrumb className="kv-warning--pf-c-breadcrumb">
    <BreadcrumbHeading key={`${tabName}-header-${tabProps.join('-')}`}>{tabName}</BreadcrumbHeading>
    <BreadcrumbItem key={`${tabName}-${tabProps.join('-')}`}>
      {tabProps.map((key, idx) => {
        const onClickAction = pendingChanges[key]
          ? pendingChanges[key].execAction
          : pendingChanges[pendingChangesKey].execAction;
        return (
          <div key={`${tabName}-${key}`} className="kv-warning-changed-attrs">
            <Button isInline onClick={onClickAction} variant={ButtonVariant.link}>
              {key}
            </Button>
            <div className="kv-warning--comma-margin">{idx === tabProps.length - 1 ? '' : ','}</div>
          </div>
        );
      })}
    </BreadcrumbItem>
  </Breadcrumb>
);

export const PendingChangesWarning: React.FC<PendingChangesWarningProps> = ({
  vmLikeEntity,
  vmi: vmiProp,
}) => {
  const vm: VMKind = asVM(getLoadedData(vmLikeEntity));
  const vmi = getLoadedData(vmiProp);
  if (!isVMRunningOrExpectedRunning(vm, vmi)) {
    return <></>;
  }

  const vmWrapper = new VMWrapper(vm);
  const vmiWrapper = new VMIWrapper(vmi);

  const pendingChanges = getPendingChanges(vmWrapper, vmiWrapper);
  const arePendingChanges = hasPendingChanges(vm, vmi, pendingChanges);

  if (_.isEmpty(pendingChanges) || !arePendingChanges) {
    return <></>;
  }

  const pendingChangesByTab = getPendingChangesByTab(pendingChanges);

  return (
    <PendingChangesAlert isWarning>
      {PENDING_CHANGES_WARNING_MESSAGE}
      <List className="kv-warning--pf-c-list">
        {Object.keys(pendingChangesByTab).map(
          (tabName) =>
            pendingChangesByTab[tabName].resources.length > 0 && (
              <ListItem key={tabName}>
                <WarningTabRow
                  tabName={tabName}
                  tabProps={pendingChangesByTab[tabName].resources}
                  pendingChanges={pendingChanges}
                  pendingChangesKey={pendingChangesByTab[tabName]?.pendingChangesKey}
                />
              </ListItem>
            ),
        )}
      </List>
    </PendingChangesAlert>
  );
};

type PendingChangeWarningFirehoseProps = {
  name: string;
  namespace: string;
};

export const PendingChangesWarningFirehose: React.FC<PendingChangeWarningFirehoseProps> = ({
  name,
  namespace,
}) => {
  const resources = [
    {
      kind: VirtualMachineInstanceModel.kind,
      name,
      namespace,
      prop: 'vmi',
    },
    {
      kind: VirtualMachineModel.kind,
      name,
      namespace,
      prop: 'vmLikeEntity',
    },
  ];
  return (
    <Firehose resources={resources}>
      <PendingChangesWarning />
    </Firehose>
  );
};
