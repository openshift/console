import { getOwnerReferences } from '@console/dynamic-plugin-sdk/src/shared';
import { compareOwnerReference } from '@console/dynamic-plugin-sdk/src/shared/utils/owner-references';
import { MachineSetModel } from '@console/internal/models';
import { apiVersionForModel, MachineKind } from '@console/internal/module/k8s';

export const getMachineMachineSetOwner = (machine: MachineKind) => {
  const desiredReference = {
    apiVersion: apiVersionForModel(MachineSetModel),
    kind: MachineSetModel.kind,
  } as any;
  return (getOwnerReferences(machine) || []).find((reference) =>
    compareOwnerReference(desiredReference, reference, true),
  );
};
