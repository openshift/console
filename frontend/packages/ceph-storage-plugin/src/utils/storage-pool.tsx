import * as React from 'react';
import { useTranslation } from 'react-i18next';

import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  DisconnectedIcon,
  LockIcon,
} from '@patternfly/react-icons';
import { TFunction } from 'i18next';
import { POOL_PROGRESS } from '../constants/storage-pool-const';
import { KMSConfig } from '../components/ocs-install/types';

export const LoadingComponent: React.FC = () => {
  const { t } = useTranslation();

  return (
    <span
      className="pf-c-spinner"
      role="progressbar"
      aria-valuetext={t('ceph-storage-plugin~Loading...')}
    >
      <span className="pf-c-spinner__clipper" />
      <span className="pf-c-spinner__lead-ball" />
      <span className="pf-c-spinner__tail-ball" />
    </span>
  );
};

export const PROGRESS_STATUS = (t: TFunction) => [
  {
    name: POOL_PROGRESS.PROGRESS,
    icon: LoadingComponent,
    desc: t('ceph-storage-plugin~Pool {name} creation in progress'),
    className: '',
  },
  {
    name: POOL_PROGRESS.CREATED,
    icon: CheckCircleIcon,
    desc: t('ceph-storage-plugin~Pool {name} was successfully created'),
    className: 'ceph-storage-pool__check-icon',
  },
  {
    name: POOL_PROGRESS.FAILED,
    icon: ExclamationCircleIcon,
    desc: t('ceph-storage-plugin~An error occurred Pool {name} was not created'),
    className: 'ceph-storage-pool__error-icon',
  },
  {
    name: POOL_PROGRESS.TIMEOUT,
    icon: DisconnectedIcon,
    desc: t(
      'ceph-storage-plugin~Pool {name} creation timed out. Please check if ocs-operator and rook operator are running',
    ),
    className: '',
  },
  {
    name: POOL_PROGRESS.CLUSTERNOTREADY,
    icon: LockIcon,
    desc: t(
      'ceph-storage-plugin~The creation of an OCS storage cluster is still in progress or has failed. Please try again after the storage cluster is ready to use.',
    ),
    className: '',
  },
  {
    name: POOL_PROGRESS.NOTREADY,
    icon: ExclamationCircleIcon,
    desc: t('ceph-storage-plugin~Pool {name} got created with errors.'),
    className: 'ceph-storage-pool__error-icon',
  },
];

export type StorageClassState = {
  encryption: boolean;
  kms: KMSConfig;
};

export enum SCActionType {
  SET_ENCRYPTION = 'SET_ENCRYPTION',
  SET_KMS_ENCRYPTION = 'SET_KMS_ENCRYPTION',
}

export type StorageClassClusterAction =
  | { type: SCActionType.SET_ENCRYPTION; payload: boolean }
  | { type: SCActionType.SET_KMS_ENCRYPTION; payload: KMSConfig };

export const scInitialState: StorageClassState = {
  encryption: false,
  kms: {
    name: {
      value: '',
      valid: true,
    },
    token: {
      value: '',
      valid: true,
    },
    address: {
      value: '',
      valid: true,
    },
    port: {
      value: '',
      valid: true,
    },
    backend: '',
    caCert: null,
    tls: '',
    clientCert: null,
    clientKey: null,
    providerNamespace: '',
    hasHandled: true,
    caCertFile: '',
    clientCertFile: '',
    clientKeyFile: '',
  },
};

export const scReducer = (state: StorageClassState, action: StorageClassClusterAction) => {
  switch (action.type) {
    case SCActionType.SET_ENCRYPTION: {
      return {
        ...state,
        encryption: action.payload,
      };
    }
    case SCActionType.SET_KMS_ENCRYPTION: {
      return {
        ...state,
        kms: action.payload,
      };
    }

    default:
      return state;
  }
};
