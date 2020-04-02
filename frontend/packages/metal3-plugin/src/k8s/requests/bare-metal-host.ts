import {
  k8sPatch,
  k8sCreate,
  K8sResourceKind,
  MachineKind,
  MachineSetKind,
  k8sKill,
} from '@console/internal/module/k8s';
import { MachineModel, MachineSetModel, SecretModel } from '@console/internal/models';
import { PatchBuilder } from '@console/shared/src/k8s';
import { getAnnotations } from '@console/shared/src';
import { BareMetalHostModel } from '../../models';
import { BareMetalHostKind } from '../../types';
import { DELETE_MACHINE_ANNOTATION } from '../../constants/machine';
import { getReplicas } from '../../selectors/machine-set';
import {
  buildBareMetalHostObject,
  buildBareMetalHostSecret,
  getSecretName,
} from '../objects/bare-metal-host';

export const powerOffHost = (host: BareMetalHostKind) =>
  k8sPatch(BareMetalHostModel, host, [{ op: 'replace', path: '/spec/online', value: false }]);

export const powerOnHost = (host: BareMetalHostKind) =>
  k8sPatch(BareMetalHostModel, host, [{ op: 'replace', path: '/spec/online', value: true }]);

export const restartHost = (host: BareMetalHostKind) =>
  k8sPatch(BareMetalHostModel, host, [
    {
      op: 'replace',
      path: '/metadata/annotations',
      value: {
        ...host.metadata.annotations,
        'reboot.metal3.io': 'UI', // value is irrelevant
      },
    },
  ]);

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
          new PatchBuilder('/spec/replicas').replace(replicas - 1).build(),
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

export type BareMetalHostOpts = {
  name: string;
  BMCAddress: string;
  username: string;
  password: string;
  bootMACAddress: string;
  description: string;
  namespace: string;
};

export const createBareMetalHost = async ({
  name,
  BMCAddress,
  bootMACAddress,
  description,
  namespace,
  password,
  username,
  online,
}: BareMetalHostOpts & { online: boolean }) => {
  const secret = buildBareMetalHostSecret(name, namespace, username, password);
  const bareMetalHost = buildBareMetalHostObject(
    name,
    namespace,
    BMCAddress,
    bootMACAddress,
    online,
    description,
  );
  await k8sCreate(SecretModel, secret);
  await k8sCreate(BareMetalHostModel, bareMetalHost);
};

export const updateBareMetalHost = async (
  host: BareMetalHostKind,
  secret: K8sResourceKind,
  {
    name,
    BMCAddress,
    bootMACAddress,
    description,
    namespace,
    password,
    username,
  }: BareMetalHostOpts,
) => {
  if (secret) {
    const patches = new PatchBuilder('/data').buildAddObjectKeysPatches(
      { username: btoa(username), password: btoa(password) },
      secret.data,
    );

    if (patches.length > 0) {
      await k8sPatch(SecretModel, secret, patches);
    }
  } else {
    await k8sCreate(SecretModel, buildBareMetalHostSecret(name, namespace, username, password));
  }
  const patches = [
    ...new PatchBuilder('/spec').buildAddObjectKeysPatches(
      { description, bootMACAddress },
      host.spec,
    ),
    ...new PatchBuilder('/spec/bmc').buildAddObjectKeysPatches(
      { address: BMCAddress, credentialsName: getSecretName(name) },
      host.spec.bmc,
    ),
  ];

  if (patches.length > 0) {
    await k8sPatch(BareMetalHostModel, host, patches);
  }
};
