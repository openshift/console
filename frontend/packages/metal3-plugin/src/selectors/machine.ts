import { MachineSetModel } from '@console/internal/models';
import type { MachineKind } from '@console/internal/module/k8s';
import { apiVersionForModel } from '@console/internal/module/k8s';
import { getOwnerReferences } from '@console/shared/src';
import { compareOwnerReference } from '@console/shared/src/utils/owner-references';

export const getMachineMachineSetOwner = (machine: MachineKind) => {
  const desiredReference = {
    apiVersion: apiVersionForModel(MachineSetModel),
    kind: MachineSetModel.kind,
  } as any;
  return (getOwnerReferences(machine) || []).find((reference) =>
    compareOwnerReference(desiredReference, reference, true),
  );
};
