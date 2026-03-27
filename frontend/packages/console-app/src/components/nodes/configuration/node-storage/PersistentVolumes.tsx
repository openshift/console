import type { FC } from 'react';
import { useMemo } from 'react';
import { Title } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import type { K8sResourceCommon } from '@console/dynamic-plugin-sdk/src';
import { DASH } from '@console/dynamic-plugin-sdk/src/app/constants';
import { ResourceLink } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import {
  PersistentVolumeClaimModel,
  PersistentVolumeModel,
  PodModel,
  StorageClassModel,
} from '@console/internal/models';
import type {
  NodeKind,
  PersistentVolumeClaimKind,
  PersistentVolumeKind,
  PodKind,
} from '@console/internal/module/k8s';
import { getUID } from '@console/shared/src/selectors/common';
import {
  DataVolumeModel,
  getCurrentPod,
  getVMIPod,
  useWatchVirtualMachineInstances,
} from '../../utils/NodeVmUtils';
import { useAccessibleResources } from '../../utils/useAccessibleResources';

type NodePersistentVolumeData = {
  persistentVolume: PersistentVolumeKind;
  persistentVolumeClaim: PersistentVolumeClaimKind;
  vmi?: K8sResourceCommon;
};

type PersistentVolumeRowProps = {
  persistentVolumeData: NodePersistentVolumeData;
  pods: PodKind[];
};

const PersistentVolumeRow: FC<PersistentVolumeRowProps> = ({ persistentVolumeData, pods }) => {
  const { t } = useTranslation();

  const pod = useMemo(() => {
    if (persistentVolumeData.vmi) {
      return getVMIPod(persistentVolumeData.vmi, pods);
    }

    const podsForPVC = pods?.filter((pvcPod) =>
      pvcPod.spec?.volumes?.find(
        (volume) =>
          volume.persistentVolumeClaim?.claimName &&
          volume.persistentVolumeClaim.claimName ===
            persistentVolumeData.persistentVolumeClaim?.metadata.name,
      ),
    );
    return podsForPVC ? getCurrentPod(podsForPVC) : undefined;
  }, [persistentVolumeData.vmi, persistentVolumeData.persistentVolumeClaim?.metadata.name, pods]);

  return (
    <tr className="pf-v6-c-table__tr">
      <td className="pf-v6-c-table__td">
        <ResourceLink
          groupVersionKind={{
            group: PersistentVolumeModel.apiGroup,
            kind: PersistentVolumeModel.kind,
            version: PersistentVolumeModel.apiVersion,
          }}
          name={persistentVolumeData.persistentVolume.metadata.name}
          namespace={persistentVolumeData.persistentVolume.metadata.namespace}
          title={getUID(persistentVolumeData.persistentVolume)}
        />
      </td>
      <td className="pf-v6-c-table__td">
        {persistentVolumeData.persistentVolumeClaim ? (
          <ResourceLink
            groupVersionKind={{
              group: PersistentVolumeClaimModel.apiGroup,
              kind: PersistentVolumeClaimModel.kind,
              version: PersistentVolumeClaimModel.apiVersion,
            }}
            name={persistentVolumeData.persistentVolumeClaim.metadata.name}
            namespace={persistentVolumeData.persistentVolumeClaim.metadata.namespace}
            title={getUID(persistentVolumeData.persistentVolumeClaim)}
          />
        ) : (
          <div className="pf-v6-u-text-color-subtle">{t('console-app~No claim')}</div>
        )}
      </td>
      <td className="pf-v6-c-table__td">
        {persistentVolumeData.persistentVolume.spec?.storageClassName ? (
          <ResourceLink
            groupVersionKind={{
              group: StorageClassModel.apiGroup,
              kind: StorageClassModel.kind,
              version: StorageClassModel.apiVersion,
            }}
            name={persistentVolumeData.persistentVolume.spec?.storageClassName}
          />
        ) : (
          t('console-app~None')
        )}
      </td>
      <td className="pf-v6-c-table__td">
        {persistentVolumeData.persistentVolume.spec?.capacity?.storage ?? DASH}
      </td>
      <td className="pf-v6-c-table__td">
        {persistentVolumeData.persistentVolumeClaim?.metadata.namespace ?? DASH}
      </td>
      <td className="pf-v6-c-table__td">
        {pod ? (
          <ResourceLink
            groupVersionKind={{
              group: PodModel.apiGroup,
              kind: PodModel.kind,
              version: PodModel.apiVersion,
            }}
            name={pod.metadata.name}
            namespace={pod.metadata.namespace}
            title={getUID(pod)}
          />
        ) : (
          DASH
        )}
      </td>
    </tr>
  );
};

type PersistentVolumesProps = {
  node: NodeKind;
};

const PersistentVolumes: FC<PersistentVolumesProps> = ({ node }) => {
  const { t } = useTranslation();
  const [vms, vmsLoaded, vmsLoadError] = useWatchVirtualMachineInstances(node.metadata.name);
  const [
    persistentVolumes,
    persistentVolumesLoaded,
    persistentVolumesLoadError,
  ] = useK8sWatchResource<PersistentVolumeKind[]>({
    groupVersionKind: {
      group: PersistentVolumeModel.apiGroup,
      version: PersistentVolumeModel.apiVersion,
      kind: PersistentVolumeModel.kind,
    },
    isList: true,
  });
  const [pvcs, pvcsLoaded, pvcsLoadError] = useK8sWatchResource<PersistentVolumeClaimKind[]>({
    groupVersionKind: {
      group: PersistentVolumeClaimModel.apiGroup,
      version: PersistentVolumeClaimModel.apiVersion,
      kind: PersistentVolumeClaimModel.kind,
    },
    isList: true,
  });
  const [dataVolumes, dataVolumesLoaded, dataVolumesLoadError] = useAccessibleResources<
    K8sResourceCommon
  >({
    groupVersionKind: {
      group: DataVolumeModel.apiGroup,
      version: DataVolumeModel.apiVersion,
      kind: DataVolumeModel.kind,
    },
    isList: true,
    namespaced: true,
  });
  const [pods, podsLoaded, podsLoadError] = useAccessibleResources<PodKind>({
    groupVersionKind: {
      group: PodModel.apiGroup,
      version: PodModel.apiVersion,
      kind: PodModel.kind,
    },
    isList: true,
    namespaced: true,
    fieldSelector: `spec.nodeName=${node.metadata.name}`,
  });

  const loadError =
    persistentVolumesLoadError ||
    pvcsLoadError ||
    dataVolumesLoadError ||
    vmsLoadError ||
    podsLoadError;
  const isLoading =
    !persistentVolumesLoaded || !pvcsLoaded || !dataVolumesLoaded || !vmsLoaded || !podsLoaded;

  const vmPVCs = useMemo(() => {
    if (
      persistentVolumesLoadError ||
      !persistentVolumesLoaded ||
      pvcsLoadError ||
      !pvcsLoaded ||
      dataVolumesLoadError ||
      !dataVolumesLoaded ||
      !vmsLoaded ||
      vmsLoadError
    ) {
      return [];
    }
    return (
      pvcs?.reduce<NodePersistentVolumeData[]>((acc, persistentVolumeClaim) => {
        const persistentVolume = persistentVolumes.find(
          (pv) =>
            pv.spec?.claimRef?.name === persistentVolumeClaim.metadata.name &&
            pv.spec?.claimRef?.namespace === persistentVolumeClaim.metadata.namespace,
        );
        if (!persistentVolume) {
          return acc;
        }

        const dataVolumeOwnerRef = persistentVolumeClaim.metadata.ownerReferences?.find(
          (owner) => owner.kind === 'DataVolume',
        );
        const dataVolumeOwner =
          dataVolumeOwnerRef &&
          dataVolumes?.find(
            (dv) =>
              dv.metadata.name === dataVolumeOwnerRef.name &&
              dv.metadata.namespace === persistentVolumeClaim.metadata.namespace,
          );
        if (dataVolumeOwner) {
          const vmOwner = dataVolumeOwner.metadata.ownerReferences?.find(
            (ref) => ref.kind === 'VirtualMachine',
          );
          const vmi =
            vmOwner &&
            vms.find(
              (vm) =>
                vm.metadata.name === vmOwner.name &&
                vm.metadata.namespace === dataVolumeOwner.metadata.namespace,
            );
          if (vmi) {
            acc.push({
              persistentVolume,
              persistentVolumeClaim,
              vmi,
            });
          }
        }
        return acc;
      }, []) ?? []
    );
  }, [
    dataVolumes,
    dataVolumesLoadError,
    dataVolumesLoaded,
    persistentVolumes,
    persistentVolumesLoadError,
    persistentVolumesLoaded,
    pvcs,
    pvcsLoadError,
    pvcsLoaded,
    vms,
    vmsLoaded,
    vmsLoadError,
  ]);

  const nodePVCs = useMemo(() => {
    if (persistentVolumesLoadError || !persistentVolumesLoaded || pvcsLoadError || !pvcsLoaded) {
      return [];
    }
    const nodePVs =
      persistentVolumes?.filter(
        (pv) => pv.metadata.labels?.['kubernetes.io/hostname'] === node.metadata.name,
      ) ?? [];
    return (
      nodePVs?.reduce<NodePersistentVolumeData[]>((acc, persistentVolume) => {
        const persistentVolumeClaim = pvcs.find(
          (pvc) =>
            pvc.metadata.name === persistentVolume.spec?.claimRef?.name &&
            pvc.metadata.namespace === persistentVolume.spec?.claimRef?.namespace,
        );
        if (persistentVolumeClaim) {
          acc.push({
            persistentVolume,
            persistentVolumeClaim,
          });
        }
        return acc;
      }, []) ?? []
    );
  }, [
    node.metadata.name,
    persistentVolumes,
    persistentVolumesLoadError,
    persistentVolumesLoaded,
    pvcs,
    pvcsLoadError,
    pvcsLoaded,
  ]);

  const nodePersistentVolumeData: NodePersistentVolumeData[] = useMemo(() => {
    const seen = new Set<string>();
    return [...vmPVCs, ...nodePVCs].filter((data) => {
      const uid = getUID(data.persistentVolume);
      if (seen.has(uid)) {
        return false;
      }
      seen.add(uid);
      return true;
    });
  }, [nodePVCs, vmPVCs]);

  return (
    <>
      <Title headingLevel="h3" className="co-section-heading">
        <span>{t('console-app~Mounted persistent volumes')}</span>
      </Title>
      {isLoading ? (
        <div className="loading-skeleton--table pf-v6-u-w-100" />
      ) : loadError ? (
        t('console-app~Unable to load persistent volumes')
      ) : (
        <div className="co-table-container">
          <table className="pf-v6-c-table pf-m-compact pf-m-border-rows">
            <thead className="pf-v6-c-table__thead">
              <tr className="pf-v6-c-table__tr">
                <th className="pf-v6-c-table__th">{t('console-app~Name')}</th>
                <th className="pf-v6-c-table__th">{t('console-app~PVC')}</th>
                <th className="pf-v6-c-table__th">{t('console-app~StorageClass')}</th>
                <th className="pf-v6-c-table__th">{t('console-app~Capacity')}</th>
                <th className="pf-v6-c-table__th">{t('console-app~Namespace')}</th>
                <th className="pf-v6-c-table__th">{t('console-app~Pod')}</th>
              </tr>
            </thead>
            <tbody className="pf-v6-c-table__tbody">
              {nodePersistentVolumeData.length === 0 ? (
                <tr className="pf-v6-c-table__tr">
                  <td className="pf-v6-c-table__td" colSpan={6}>
                    {t('console-app~No persistent volumes found')}
                  </td>
                </tr>
              ) : (
                nodePersistentVolumeData.map((persistentVolumeData) => (
                  <PersistentVolumeRow
                    persistentVolumeData={persistentVolumeData}
                    pods={pods}
                    key={getUID(persistentVolumeData.persistentVolume)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

export default PersistentVolumes;
