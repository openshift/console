import * as _ from 'lodash';
import { MachineSetKind } from '@console/internal/module/k8s';
import { getUID } from '@console/shared/src';

export const findMachineSet = (machineSets: MachineSetKind[], uid: string) =>
  uid && machineSets ? machineSets.find((machineSet) => getUID(machineSet) === uid) : null;

export const getReplicas = (machineSet: MachineSetKind, defaultValue: number = 0) =>
  _.has(machineSet, 'spec') ? machineSet.spec.replicas : defaultValue;
