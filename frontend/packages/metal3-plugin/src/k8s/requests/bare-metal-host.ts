import {
  k8sPatch,
  k8sCreate,
  MachineKind,
  MachineSetKind,
  k8sKill,
} from '@console/internal/module/k8s';
import { MachineModel, MachineSetModel, SecretModel } from '@console/internal/models';
import { PatchBuilder, PatchOperation } from '@console/shared/src/k8s';
import { getAnnotations } from '@console/shared/src';
import { BareMetalHostModel } from '../../models';
import { BareMetalHostKind } from '../../types';
import { DELETE_MACHINE_ANNOTATION } from '../../constants/machine';
import { getReplicas } from '../../selectors/machine-set';

export const powerOffHost = (host: BareMetalHostKind) =>
  k8sPatch(BareMetalHostModel, host, [{ op: 'replace', path: '/spec/online', value: false }]);

export const powerOnHost = (host: BareMetalHostKind) =>
  k8sPatch(BareMetalHostModel, host, [{ op: 'replace', path: '/spec/online', value: true }]);

export const createBareMetalHost = async (bareMetalHost, secret) => [
  await k8sCreate(SecretModel, secret),
  await k8sCreate(BareMetalHostModel, bareMetalHost),
];

export const deprovision = async (machine: MachineKind, machineSet?: MachineSetKind) => {
  await k8sPatch(MachineModel, machine, [
    new PatchBuilder('/metadata/annotations')
      .setObjectUpdate(DELETE_MACHINE_ANNOTATION, 'true', getAnnotations(machine))
      .build(),
  ]);

  if (machineSet) {
    const replicas = getReplicas(machineSet);

    if (replicas > 0) {
      try {
        await k8sPatch(MachineSetModel, machineSet, [
          new PatchBuilder('/spec/replicas')
            .setOperation(PatchOperation.REPLACE)
            .setValue(replicas - 1)
            .build(),
        ]);
      } catch (ignored) {
        await k8sPatch(MachineModel, machine, [
          new PatchBuilder('/metadata/annotations')
            .setObjectUpdate(DELETE_MACHINE_ANNOTATION, 'false', getAnnotations(machine))
            .build(),
        ]);
      }
    }
  } else {
    await k8sKill(MachineModel, machine);
  }
};
