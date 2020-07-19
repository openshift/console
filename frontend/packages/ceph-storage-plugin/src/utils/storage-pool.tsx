import * as React from 'react';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  DisconnectedIcon,
  LockIcon,
} from '@patternfly/react-icons';
import { NOT_READY_DESC, POOL_PROGRESS } from '../constants/storage-pool-const';

export const LoadingComponent: React.FC = () => (
  <span className="pf-c-spinner" role="progressbar" aria-valuetext="Loading...">
    <span className="pf-c-spinner__clipper" />
    <span className="pf-c-spinner__lead-ball" />
    <span className="pf-c-spinner__tail-ball" />
  </span>
);

export const PROGRESS_STATUS = [
  {
    name: POOL_PROGRESS.PROGRESS,
    icon: LoadingComponent,
    desc: 'Pool {name} creation in progress',
    className: '',
  },
  {
    name: POOL_PROGRESS.CREATED,
    icon: CheckCircleIcon,
    desc: 'Pool {name} was successfully created',
    className: 'ceph-storage-pool__check-icon',
  },
  {
    name: POOL_PROGRESS.FAILED,
    icon: ExclamationCircleIcon,
    desc: 'An error occurred, Pool {name} was not created',
    className: 'ceph-storage-pool__error-icon',
  },
  {
    name: POOL_PROGRESS.TIMEOUT,
    icon: DisconnectedIcon,
    desc:
      'Pool {name} creation timed out. Please check if ocs-operator and rook operator are running',
    className: '',
  },
  {
    name: POOL_PROGRESS.NOTREADY,
    icon: LockIcon,
    desc: NOT_READY_DESC,
    className: '',
  },
];
