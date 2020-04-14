/* eslint-disable camelcase, @typescript-eslint/camelcase,no-await-in-loop */
import { CreateVMParams } from '../../vm/create/types';
import { ImporterResult } from '../../vm/types';
import { buildOwnerReference } from '../../../../utils';
import { PatchBuilder } from '@console/shared/src/k8s';
import { SecretModel, ServiceAccountModel } from '@console/internal/models';
import { createBasicLookup, getName, getNamespace } from '@console/shared/src';
import { compareOwnerReference } from '@console/shared/src/utils/owner-references';
import { SecretWrappper } from '../../../wrapper/k8s/secret-wrapper';
import {
  CONVERSION_GENERATE_NAME,
  CONVERSION_SERVICEACCOUNT_DELAY,
} from '../../../../constants/v2v';
import {
  VMSettingsField,
  VMWareProviderField,
  VMWizardStorage,
  VMWizardStorageType,
} from '../../../../components/create-vm-wizard/types';
import { getVmwareField } from '../../../../components/create-vm-wizard/selectors/provider/vmware/selectors';
import { K8sResourceCommon } from '@console/internal/module/k8s';
import { ServiceAccountWrappper } from '../../../wrapper/k8s/service-account-wrapper';
import { RoleWrappper } from '../../../wrapper/k8s/role-wrapper';
import { RoleBindingWrappper } from '../../../wrapper/k8s/role-binding-wrapper';
import { PersistentVolumeClaimWrapper } from '../../../wrapper/vm/persistent-volume-claim-wrapper';
import { VolumeWrapper } from '../../../wrapper/vm/volume-wrapper';
import { VolumeMode, VolumeType } from '../../../../constants/vm/storage';
import { buildConversionPod } from './objects/conversion-pod';
import { getVmwareConfigMap } from '../v2vvmware-configmap';
import {
  getKubevirtV2vConversionContainerImage,
  getV2vImagePullPolicy,
  getVddkInitContainerImage,
} from '../../../../selectors/v2v';
import { PodWrappper } from '../../../wrapper/k8s/pod-wrapper';
import { delay } from '../../../../utils/utils';
import { getFieldValue } from '../../../../components/create-vm-wizard/selectors/vm-settings';
import { getGeneratedName } from '../../../../selectors/selectors';

const isImportStorage = (storage: VMWizardStorage) =>
  [VMWizardStorageType.V2V_VMWARE_IMPORT, VMWizardStorageType.V2V_VMWARE_IMPORT_TEMP].includes(
    storage.type,
  );

const createConversionPodSecret = async ({
  enhancedK8sMethods: { k8sWrapperCreate, k8sGet },
  importProviders,
  storages,
  namespace,
}: CreateVMParams) => {
  const { vm, thumbprint } = getVmwareField(importProviders, VMWareProviderField.VM);

  const sourceSecretName = getVmwareField(
    importProviders,
    VMWareProviderField.CURRENT_RESOLVED_VCENTER_SECRET_NAME,
  );

  const sourceSecretWrapper = new SecretWrappper(
    await k8sGet(SecretModel, sourceSecretName, namespace, null, {
      disableHistory: true,
    }),
  );

  const username = encodeURIComponent(sourceSecretWrapper.getValue('username'));
  const password = sourceSecretWrapper.getValue('password');
  const hostname = sourceSecretWrapper.getValue('url');

  const sourceDisks = (storages || [])
    .filter((storage) => storage.type === VMWizardStorageType.V2V_VMWARE_IMPORT)
    .map(({ importData }) => importData.fileName);

  const secretWrapper = new SecretWrappper()
    .init({ namespace, generateName: CONVERSION_GENERATE_NAME })
    .setJSONValue('conversion.json', {
      daemonize: false,

      vm_name: vm.name,
      transport_method: 'vddk',

      vmware_fingerprint: thumbprint,
      vmware_uri: `vpx://${username}@${hostname}${vm?.detail?.hostPath}?no_verify=1`,
      vmware_password: password,

      source_disks: sourceDisks,
    });

  const conversionPodSecret = await k8sWrapperCreate(secretWrapper);

  return {
    conversionPodSecret: conversionPodSecret as K8sResourceCommon,
  };
};

const resolveRolesAndServiceAccount = async ({
  enhancedK8sMethods: { k8sWrapperCreate },
  namespace,
}: CreateVMParams) => {
  const serviceAccount = await k8sWrapperCreate(
    new ServiceAccountWrappper().init({ namespace, generateName: CONVERSION_GENERATE_NAME }),
  );
  const role = await k8sWrapperCreate(
    new RoleWrappper().init({ namespace, generateName: CONVERSION_GENERATE_NAME }).addRules(
      {
        apiGroups: [''],
        resources: ['pods'],
        verbs: ['patch', 'get'],
      },
      {
        apiGroups: ['security.openshift.io'],
        resources: ['securitycontextconstraints'],
        verbs: ['*'],
      },
    ),
  );

  const roleBinding = await k8sWrapperCreate(
    new RoleBindingWrappper()
      .init({ namespace, generateName: CONVERSION_GENERATE_NAME })
      .setRole(getName(role))
      .bindServiceAccount(getName(serviceAccount)),
  );

  return {
    serviceAccount,
    role,
    roleBinding,
  };
};

const resolveStorages = async ({
  enhancedK8sMethods: { k8sWrapperCreate },
  storages,
  namespace,
}: CreateVMParams) => {
  const extImportPvcsPromises = storages
    .filter(isImportStorage)
    .map(({ persistentVolumeClaim }) => {
      const pvcWrapper = new PersistentVolumeClaimWrapper(persistentVolumeClaim, true);

      pvcWrapper.setGenerateName(`${pvcWrapper.getName()}-`).setNamespace(namespace);

      return k8sWrapperCreate(pvcWrapper);
    });

  const resultImportPvcs = createBasicLookup(
    await Promise.all(extImportPvcsPromises),
    getGeneratedName,
  );

  const resolvedStorages = storages.map((storage) => {
    if (isImportStorage(storage)) {
      const persistentVolumeClaim = resultImportPvcs[`${getName(storage.persistentVolumeClaim)}-`];
      return {
        ...storage,
        volume: new VolumeWrapper(storage.volume, true)
          .setType(VolumeType.PERSISTENT_VOLUME_CLAIM, {
            claimName: getName(persistentVolumeClaim),
          })
          .asResource(),
        persistentVolumeClaim,
      };
    }
    return storage;
  });

  return {
    resolvedStorages,
  };
};

/**
 * Workaround for a race condition.
 *
 * A ServiceAccount is provided automatically (but asynchronously) for API tokens (as Secrets).
 * A ServiceAccount can be attached to a pod only if the tokens are ready, otherwise API-level
 * validation throws a permanent error.
 *
 * As a workaround, let's wait till the tokens are ready before proceeding.
 *
 * Note regarding implementation:
 * polling is the simplest method how to wait for changes.
 * There is similar k8sWatchObject function which should be used instead for consistency, but
 * it is implemented using polling as well but with much more complex general contract than this
 * simple flow here.
 */
const waitForServiceAccountSecrets = async (serviceAccount, { k8sGet }, counter = 15) => {
  let sa = serviceAccount;
  for (let i = 0; i < counter; i++) {
    if ((sa?.secrets?.length || 0) > 0) {
      return true;
    }
    await delay(CONVERSION_SERVICEACCOUNT_DELAY);
    sa = await k8sGet(ServiceAccountModel, getName(serviceAccount), getNamespace(serviceAccount));
  }

  return false;
};

// Start of the Conversion pod is blocked until the PVCs are bound
const startConversionPod = async (
  {
    enhancedK8sMethods: { k8sGet, k8sWrapperCreate, k8sWrapperPatch },
    vmSettings,
    namespace,
    storages,
  }: CreateVMParams,
  {
    serviceAccount,
    role,
    roleBinding,
    conversionPodSecret,
  }: {
    serviceAccount: K8sResourceCommon;
    role: K8sResourceCommon;
    roleBinding: K8sResourceCommon;
    conversionPodSecret: K8sResourceCommon;
  },
) => {
  const kubevirtVmwareConfigMap = await getVmwareConfigMap({ k8sGet });

  const conversionPodWrapper = new PodWrappper(
    buildConversionPod({
      namespace,
      vmName: getFieldValue(vmSettings, VMSettingsField.NAME),
      serviceAccountName: getName(serviceAccount),
      secretName: getName(conversionPodSecret),
      imagePullPolicy: getV2vImagePullPolicy(kubevirtVmwareConfigMap),
      image: getKubevirtV2vConversionContainerImage(kubevirtVmwareConfigMap),
      vddkInitImage: getVddkInitContainerImage(kubevirtVmwareConfigMap),
    }),
  );

  storages.filter(isImportStorage).forEach(({ volume, persistentVolumeClaim, importData }) => {
    const volumeWrapper = new VolumeWrapper(volume);
    const pvcWrapper = new PersistentVolumeClaimWrapper(persistentVolumeClaim);
    const container = conversionPodWrapper.getContainers()[0];
    if (pvcWrapper.getVolumeModeEnum() === VolumeMode.BLOCK) {
      container.volumeDevices.push({
        name: volumeWrapper.getName(),
        devicePath: importData.devicePath,
      });
    } else {
      container.volumeMounts.push({
        name: volumeWrapper.getName(),
        mountPath: importData.mountPath,
      });
    }
    conversionPodWrapper.getVolumes().push(volumeWrapper.asResource(true));
  });
  //
  //
  await waitForServiceAccountSecrets(serviceAccount, { k8sGet });

  const conversionPod = await k8sWrapperCreate(conversionPodWrapper);

  if (conversionPod) {
    const newOwnerReference = buildOwnerReference(conversionPod);
    const pvcwrappers = storages
      .filter(({ type }) => type === VMWizardStorageType.V2V_VMWARE_IMPORT_TEMP)
      .map(({ persistentVolumeClaim }) => new PersistentVolumeClaimWrapper(persistentVolumeClaim));

    const patchPromises = [
      new ServiceAccountWrappper(serviceAccount),
      new RoleWrappper(role),
      new RoleBindingWrappper(roleBinding),
      new SecretWrappper(conversionPodSecret),
      ...pvcwrappers,
    ].map((wrapper) =>
      k8sWrapperPatch(wrapper, [
        new PatchBuilder('/metadata/ownerReferences')
          .setListUpdate(newOwnerReference, wrapper.getOwnerReferences(), compareOwnerReference)
          .build(),
      ]),
    );
    await Promise.all(patchPromises);
  }

  return {
    conversionPod,
  };
};

const finalizeStorages = (storages: VMWizardStorage[]) =>
  storages
    .filter((storage) => storage.type !== VMWizardStorageType.V2V_VMWARE_IMPORT_TEMP)
    .map((storage) => {
      if (storage.type === VMWizardStorageType.V2V_VMWARE_IMPORT) {
        const result = { ...storage };
        delete result.persistentVolumeClaim;
        return result;
      }
      return storage;
    });

export const importV2VVMwareVm = async (params: CreateVMParams): Promise<ImporterResult> => {
  const { networks, enhancedK8sMethods } = params;

  const { conversionPodSecret } = await createConversionPodSecret(params);
  const { role, roleBinding, serviceAccount } = await resolveRolesAndServiceAccount(params);
  const { resolvedStorages } = await resolveStorages(params);

  const { conversionPod } = await startConversionPod(
    { ...params, storages: resolvedStorages },
    { conversionPodSecret, role, roleBinding, serviceAccount },
  );

  return {
    storages: finalizeStorages(resolvedStorages),
    networks,
    onCreate: async (vm) => {
      const vmOwnerReference = buildOwnerReference(vm);
      const importPVCWrappers = resolvedStorages
        .filter(({ type }) => type === VMWizardStorageType.V2V_VMWARE_IMPORT)
        .map(
          ({ persistentVolumeClaim }) => new PersistentVolumeClaimWrapper(persistentVolumeClaim),
        );

      const patchPromises = [new PodWrappper(conversionPod), ...importPVCWrappers].map((wrapper) =>
        enhancedK8sMethods.k8sWrapperPatch(wrapper, [
          new PatchBuilder('/metadata/ownerReferences')
            .setListUpdate(vmOwnerReference, wrapper.getOwnerReferences(), compareOwnerReference)
            .build(),
        ]),
      );
      await Promise.all(patchPromises);
    },
  };
};
