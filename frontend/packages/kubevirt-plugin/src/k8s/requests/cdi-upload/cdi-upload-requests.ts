/* eslint-disable camelcase, @typescript-eslint/camelcase,no-await-in-loop */
import { getName, getNamespace } from '@console/shared';
import { DataVolumeModel, UploadTokenRequestModel } from '@console/kubevirt-plugin/src/models';
import { V1alpha1DataVolume } from '@console/kubevirt-plugin/src/types/vm/disk/V1alpha1DataVolume';
import {
  apiVersionForModel,
  K8sResourceKind,
  k8sCreate,
  k8sKill,
  k8sGet,
} from '@console/internal/module/k8s';
import { delay } from '../../../utils/utils';

const PVC_STATUS_DELAY = 2 * 1000;

const UPLOAD_STATES = {
  SCHEDULED: 'UploadScheduled',
  READY: 'UploadReady',
};

const waitForUploadReady = async (dataVolume: K8sResourceKind, counter: number = 30) => {
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

  throw new Error('Data Volume failed to initiate upload');
};

const createUploadToken = async (pvcName: string, namespace: string) => {
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
    throw new Error(error.message);
  }
};

export const createUploadPVC = async (dataVolume: V1alpha1DataVolume) => {
  const dataVolumeName = getName(dataVolume);
  const namespace = getNamespace(dataVolume);

  try {
    const dv = await k8sCreate(DataVolumeModel, dataVolume);
    await waitForUploadReady(dv);
    const token = await createUploadToken(dataVolumeName, namespace);

    return { token };
  } catch (error) {
    throw new Error(error.message);
  }
};

export const killUploadPVC = async (name: string, namespace: string) => {
  await k8sKill(DataVolumeModel, { metadata: { name, namespace } });
};
