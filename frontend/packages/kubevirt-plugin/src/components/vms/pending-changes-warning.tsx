import * as React from 'react';
import * as _ from 'lodash';
import { PendingChanges } from './types';
import { FirehoseResult, Firehose } from '@console/internal/components/utils';
import { VMIKind, VMKind } from '../../types';
import { VMLikeEntityKind } from '../../types/vmLike';
import { getLoadedData } from '../../utils';
import { VMWrapper } from '../../k8s/wrapper/vm/vm-wrapper';
import { VMIWrapper } from '../../k8s/wrapper/vm/vmi-wrapper';
import { PendingChangesAlert } from '../Alerts/PendingChangesAlert';
import {
  List,
  ListItem,
  Button,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbHeading,
  ButtonVariant,
} from '@patternfly/react-core';
import { asVM } from '../../selectors/vm';
import { VirtualMachineModel, VirtualMachineInstanceModel } from '../../models';
import { PENDING_CHANGES_WARNING_MESSAGE } from '../../strings/vm/status';
import { isVMRunningOrExpectedRunning } from '../../selectors/vm/selectors';
import { getPendingChanges, hasPendingChanges } from '../../utils/pending-changes';

import './pending-changes-warning.scss';

type PendingChangesWarningProps = {
  vmi?: FirehoseResult<VMIKind>;
  vmLikeEntity?: FirehoseResult<VMLikeEntityKind>;
};

const getPendingChangesByTab = (pendingChanges: PendingChanges) =>
  Object.keys(pendingChanges)
    .filter((key) => pendingChanges[key].isPendingChange)
    .reduce((acc, key) => {
      const pc = pendingChanges[key];
      const changedResourceNames = pc?.resourceNames;

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
        [pc.vmTab]: acc[pc.vmTab] ? { resources: [...acc[pc.vmTab], key] } : { resources: [key] },
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
  if (!isVMRunningOrExpectedRunning(vm)) {
    return <></>;
  }

  const vmi = getLoadedData(vmiProp);

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
