import * as _ from 'lodash';
import {
  VM_STATUS_IMPORTING,
  VM_STATUS_V2V_CONVERSION_IN_PROGRESS,
} from 'kubevirt-web-ui-components';

import { VMIKind, VMKind } from '../../types/vm';
import { isVMRunning } from './selectors';
import { VMMultiStatus } from '../../types';

const IMPORTING_STATUSES = new Set([VM_STATUS_IMPORTING, VM_STATUS_V2V_CONVERSION_IN_PROGRESS]);

export const isVMImporting = (status: VMMultiStatus): boolean =>
  status && IMPORTING_STATUSES.has(status.status);

export const isVMRunningWithVMI = ({ vm, vmi }: { vm: VMKind; vmi: VMIKind }): boolean =>
  isVMRunning(vm) && !_.isEmpty(vmi);
