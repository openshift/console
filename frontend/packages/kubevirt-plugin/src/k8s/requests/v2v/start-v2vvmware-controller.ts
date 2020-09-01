import { DeploymentModel, RoleModel } from '@console/internal/models';
import { getName } from '@console/shared/src';
import { V2VVMWARE_DEPLOYMENT_NAME } from '../../../constants/v2v';
import { getVmwareConfigMap, validateV2VConfigMap } from './v2vvmware-configmap';
import { getContainerImage } from '../../../selectors/pod/container';
import { getKubevirtV2vVmwareContainerImage, getV2vImagePullPolicy } from '../../../selectors/v2v';
import { ConfigMapKind, DeploymentKind, K8sResourceCommon } from '@console/internal/module/k8s';
import { EnhancedK8sMethods } from '../../enhancedK8sMethods/enhancedK8sMethods';
import { ServiceAccountWrappper } from '../../wrapper/k8s/service-account-wrapper';
import { buildV2VVMwareRole } from './objects/v2vvmware-role';
import { RoleBindingWrappper } from '../../wrapper/k8s/role-binding-wrapper';
import { buildV2VVMwareDeployment } from './objects/v2vvmware-deployment';
import { PatchBuilder } from '@console/shared/src/k8s';
import { buildOwnerReference } from '../../../utils';
import { compareOwnerReference } from '@console/shared/src/utils/owner-references';
import { RoleWrappper } from '../../wrapper/k8s/role-wrapper';
import { VMImportProvider } from 'packages/kubevirt-plugin/src/components/create-vm-wizard/types';

const { info } = console;

const OLD_VERSION = 'OLD_VERSION';

// prevent parallel execution of startV2VVMWareController()
const semaphors = {};

const cleanupOldDeployment = async (
  { activeDeployment }: { activeDeployment: DeploymentKind },
  { k8sKill }: EnhancedK8sMethods,
) => {
  if (activeDeployment) {
    await k8sKill(DeploymentModel, activeDeployment);
  }
  return null;
};

const resolveRolesAndServiceAccount = async (
  { name, namespace }: { name: string; namespace: string },
  { k8sCreate, k8sWrapperCreate }: EnhancedK8sMethods,
) => {
  const serviceAccount = await k8sWrapperCreate(
    new ServiceAccountWrappper().init({ name, namespace }),
  );
  const role = await k8sCreate(RoleModel, buildV2VVMwareRole({ name, namespace }));

  const roleBinding = await k8sWrapperCreate(
    new RoleBindingWrappper()
      .init({ name, namespace })
      .setRole(getName(role))
      .bindServiceAccount(getName(serviceAccount)),
  );

  return {
    serviceAccount,
    role,
    roleBinding,
  };
};

const startVmWare = async (
  {
    name,
    namespace,
    serviceAccount,
    role,
    roleBinding,
    kubevirtVmwareConfigMap,
  }: {
    name: string;
    namespace: string;
    serviceAccount: K8sResourceCommon;
    role: K8sResourceCommon;
    roleBinding: K8sResourceCommon;
    kubevirtVmwareConfigMap: ConfigMapKind;
  },
  { k8sCreate, k8sWrapperPatch }: EnhancedK8sMethods,
) => {
  const deployment = await k8sCreate(
    DeploymentModel,
    buildV2VVMwareDeployment({
      name,
      namespace,
      image: getKubevirtV2vVmwareContainerImage(kubevirtVmwareConfigMap),
      imagePullPolicy: getV2vImagePullPolicy(kubevirtVmwareConfigMap),
    }),
  );

  if (deployment) {
    const newOwnerReference = buildOwnerReference(deployment);

    const patchPromises = [
      new ServiceAccountWrappper(serviceAccount),
      new RoleWrappper(role),
      new RoleBindingWrappper(roleBinding),
    ].map((object) => {
      return k8sWrapperPatch(object, [
        new PatchBuilder('/metadata/ownerReferences')
          .setListUpdate(newOwnerReference, object.getOwnerReferences(), compareOwnerReference)
          .build(),
      ]);
    });
    await Promise.all(patchPromises);
  }

  return {
    deployment,
  };
};

// The controller is namespace-scoped, especially due to security reasons
// Let's make sure its started within the desired namespace (which is not by default).
// The V2VVmware CRD is expected to be already created within the cluster (by Web UI installation)
// TODO: The controller should be deployed by a provider and not via following UI code.
export const startV2VVMWareController = async (
  { namespace }: { namespace: string },
  enhancedK8sMethods: EnhancedK8sMethods,
  type: VMImportProvider,
) => {
  if (!namespace) {
    throw new Error('V2V VMWare: namespace must be selected');
  }
  const { k8sGet } = enhancedK8sMethods;

  const name = V2VVMWARE_DEPLOYMENT_NAME;
  let activeDeployment: DeploymentKind;

  if (semaphors[namespace]) {
    info(`startV2VVMWareController for "${namespace}" namespace already in progress. Skipping...`);
    return;
  }
  semaphors[namespace] = true;
  let kubevirtVmwareConfigMap = null;

  try {
    try {
      kubevirtVmwareConfigMap = await getVmwareConfigMap();
    } catch (error) {
      if (error?.json?.code === 403) {
        throw error;
      }
      // other cases are validated in validateV2VConfigMap
    }

    const err = validateV2VConfigMap(kubevirtVmwareConfigMap, type);
    if (err) {
      throw err;
    }

    try {
      activeDeployment = await k8sGet(DeploymentModel, name, namespace);

      const container = (activeDeployment?.spec?.template?.spec?.containers || []).find(
        (c) => c.name === name,
      );

      if (
        getContainerImage(container) !== getKubevirtV2vVmwareContainerImage(kubevirtVmwareConfigMap)
      ) {
        throw new Error(OLD_VERSION);
      }
    } catch (e) {
      // Deployment does not exist or does not have permissions to see Deployments in this namespace
      info(
        e && e.message === OLD_VERSION
          ? 'updating V2V VMWare controller'
          : 'V2V VMWare controller deployment not found, so creating one ...',
      );

      await cleanupOldDeployment({ activeDeployment }, enhancedK8sMethods);
      const { serviceAccount, role, roleBinding } = await resolveRolesAndServiceAccount(
        { name, namespace },
        enhancedK8sMethods,
      );

      await startVmWare(
        { name, namespace, serviceAccount, role, roleBinding, kubevirtVmwareConfigMap },
        enhancedK8sMethods,
      );

      info(`startV2VVMWareController for "${namespace}" namespace finished.`);
    }
  } finally {
    delete semaphors[namespace];
  }
};
