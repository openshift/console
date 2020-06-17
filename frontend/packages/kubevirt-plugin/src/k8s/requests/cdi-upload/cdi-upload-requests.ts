/* eslint-disable camelcase, @typescript-eslint/camelcase,no-await-in-loop */
import { getName, getNamespace } from '@console/shared';
import { EnhancedK8sMethods } from '../../enhancedK8sMethods/enhancedK8sMethods';
import { DataVolumeModel, UploadTokenRequestModel } from '@console/kubevirt-plugin/src/models';
import { V1alpha1DataVolume } from '@console/kubevirt-plugin/src/types/vm/disk/V1alpha1DataVolume';
import { apiVersionForModel, K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { delay } from '../../../utils/utils';
import { K8sCreateError } from '../../enhancedK8sMethods/errors';

const PVC_STATUS_DELAY = 2 * 1000;

const UPLOAD_STATES = {
  SCHEDULED: 'UploadScheduled',
  READY: 'UploadReady',
};

const waitForUploadReady = async (
  dataVolume: K8sResourceKind,
  k8sGet: (kind: K8sKind, name: string, namespace: string) => Promise<K8sResourceKind>,
  counter: number = 30,
) => {
  const dvName = getName(dataVolume);
  const namespace = getNamespace(dataVolume);
  let dv = dataVolume;
  for (let i = 0; i < counter; i++) {
    if (dv?.status?.phase === UPLOAD_STATES.READY) {
      return true;
    }
    await delay(PVC_STATUS_DELAY);
    dv = await k8sGet(DataVolumeModel, dvName, namespace);
  }

  throw new K8sCreateError('Data Volume failed to initiate upload', dataVolume);
};

export const createUploadToken = async (pvcName: string, namespace: string) => {
  const { k8sCreate } = new EnhancedK8sMethods();
  const tokenRequest = {
    apiVersion: apiVersionForModel(UploadTokenRequestModel),
    kind: UploadTokenRequestModel.kind,
    metadata: {
      name: pvcName,
      namespace,
    },
    spec: {
      pvcName,
    },
  };

  try {
    const resource = await k8sCreate(UploadTokenRequestModel, tokenRequest);
    return resource?.status?.token;
  } catch (error) {
    throw new K8sCreateError(error.message, tokenRequest);
  }
};

export const createUploadPVC = async (dataVolume: V1alpha1DataVolume) => {
  const { k8sCreate, k8sGet } = new EnhancedK8sMethods();
  const dataVolumeName = getName(dataVolume);
  const namespace = getNamespace(dataVolume);

  try {
    const dv = await k8sCreate(DataVolumeModel, dataVolume);
    await waitForUploadReady(dv, k8sGet);
    const token = await createUploadToken(dataVolumeName, namespace);

    return { token };
  } catch (error) {
    throw new K8sCreateError(error.message, dataVolume);
  }
};

export const killUploadPVC = async (name: string, namespace: string) => {
  const { k8sKill } = new EnhancedK8sMethods();
  await k8sKill(DataVolumeModel, { metadata: { name, namespace } });
};
