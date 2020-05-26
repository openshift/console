import * as React from 'react';
import { K8sResourceCommon } from '@console/internal/module/k8s/types';
import { VMActionType } from '../../k8s/requests/vm/actions';
import { VMIActionType } from '../../k8s/requests/vmi/actions';
import { getName, getNamespace } from '@console/shared';

export const getActionMessage = (obj: K8sResourceCommon, action: VMActionType | VMIActionType) => (
  <>
    Are you sure you want to {action} <strong>{getName(obj)}</strong> in namespace{' '}
    <strong>{getNamespace(obj)}</strong>?
  </>
);
