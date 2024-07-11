import { MachineModel, MachineSetModel, SecretModel } from '@console/internal/models';
import {
  k8sPatch,
  k8sCreate,
  MachineKind,
  MachineSetKind,
  k8sKill,
  SecretKind,
} from '@console/internal/module/k8s';
import { getAnnotations } from '@console/shared/src';
import { PatchBuilder } from '@console/shared/src/k8s';
import { AddBareMetalHostFormValues } from '../../components/baremetal-hosts/add-baremetal-host/types';
import { DELETE_MACHINE_ANNOTATION } from '../../constants/machine';
import { BareMetalHostModel } from '../../models';
import { getReplicas } from '../../selectors/machine-set';
import { BareMetalHostKind } from '../../types';
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
        'reboot.metal3.io': '',
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

export type BareMetalHostOpts = AddBareMetalHostFormValues & {
  namespace: string;
};

export const createBareMetalHost = async ({
  name,
  BMCAddress,
  bootMACAddress,
  disableCertificateVerification,
  description,
  namespace,
  password,
  username,
  online,
  enablePowerManagement,
  bootMode,
}: BareMetalHostOpts) => {
  const secret =
    enablePowerManagement && buildBareMetalHostSecret(name, namespace, username, password);
  const bareMetalHost = buildBareMetalHostObject(
    name,
    namespace,
    BMCAddress,
    bootMACAddress,
    disableCertificateVerification,
    online,
    description,
    enablePowerManagement,
    bootMode,
  );
  enablePowerManagement && (await k8sCreate(SecretModel, secret));
  await k8sCreate(BareMetalHostModel, bareMetalHost);
};

export const updateBareMetalHost = async (
  host: BareMetalHostKind,
  secret: SecretKind,
  {
    name,
    BMCAddress,
    bootMACAddress,
    disableCertificateVerification,
    description,
    namespace,
    password,
    username,
    enablePowerManagement,
    bootMode,
  }: BareMetalHostOpts,
) => {
  const patches = [
    ...new PatchBuilder('/spec').buildAddObjectKeysPatches(
      { description, bootMACAddress, bootMode },
      host.spec,
    ),
  ];

  if (enablePowerManagement) {
    if (secret) {
      const secretPatch = new PatchBuilder('/data').buildAddObjectKeysPatches(
        { username: btoa(username), password: btoa(password) },
        secret.data,
      );

      if (secretPatch.length > 0) {
        await k8sPatch(SecretModel, secret, secretPatch);
      }
    } else {
      await k8sCreate(SecretModel, buildBareMetalHostSecret(name, namespace, username, password));
    }
    patches.push(
      ...new PatchBuilder('/spec/bmc').buildAddObjectKeysPatches(
        {
          address: BMCAddress,
          credentialsName: getSecretName(name),
          disableCertificateVerification,
        },
        host.spec.bmc,
      ),
    );
  } else if (secret) {
    await k8sKill(SecretModel, secret);
    patches.push(new PatchBuilder('/spec/bmc').remove().build());
  }

  if (patches.length > 0) {
    await k8sPatch(BareMetalHostModel, host, patches);
  }
};
