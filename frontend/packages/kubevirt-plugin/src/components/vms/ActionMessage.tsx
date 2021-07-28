import * as React from 'react';
import { Stack, StackItem } from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';
import { K8sResourceCommon } from '@console/internal/module/k8s/types';
import { getName, getNamespace } from '@console/shared';

export const ActionMessage: React.FC<{
  obj: K8sResourceCommon;
  action?: string;
  actionKey?: string;
  hotplugAutoRemoveDiskNames?: string[];
  hotplugPersitentingDiskNames?: string[];
}> = ({ obj, action, actionKey, children }) => {
  const { t } = useTranslation();
  const name = getName(obj);
  const namespace = getNamespace(obj);
  const actionLabel = actionKey ? t(actionKey) : action;

  return (
    <Stack hasGutter>
      <StackItem>
        <Trans ns="kubevirt-plugin">
          Are you sure you want to {actionLabel} <strong>{name}</strong> in namespace{' '}
          <strong>{namespace}</strong>?
        </Trans>
      </StackItem>
      {children}
    </Stack>
  );
};
