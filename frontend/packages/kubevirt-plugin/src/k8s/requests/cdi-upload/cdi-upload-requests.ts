import { k8sCreate, k8sGet, k8sKill, K8sResourceKind } from '@console/internal/module/k8s';
import { DataVolumeModel, UploadTokenRequestModel } from '@console/kubevirt-plugin/src/models';
import { V1alpha1DataVolume } from '@console/kubevirt-plugin/src/types/api';
/* eslint-disable camelcase, @typescript-eslint/camelcase,no-await-in-loop */
import { CDI_BIND_REQUESTED_ANNOTATION } from '../../../components/cdi-upload-provider/consts';
import {
  getKubevirtModelAvailableAPIVersion,
  kubevirtReferenceForModel,
} from '../../../models/kubevirtReferenceForModel';
import { getName, getNamespace } from '../../../selectors';
import { delay } from '../../../utils/utils';

const PVC_STATUS_DELAY = 2 * 1000;
const UPLOAD_STATES = {
  SCHEDULED: 'UploadScheduled',
  READY: 'UploadReady',
};

export class PVCInitError extends Error {
  constructor() {
    // t('kubevirt-plugin~Data Volume failed to initiate upload.')
    super('kubevirt-plugin~Data Volume failed to initiate upload.');
  }
}

export const killUploadPVC = async (name: string, namespace: string) => {
  await k8sKill(DataVolumeModel, { metadata: { name, namespace } });
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

  throw new PVCInitError();
};

const createUploadToken = async (pvcName: string, namespace: string): Promise<string> => {
  const tokenRequest = {
    apiVersion: getKubevirtModelAvailableAPIVersion(UploadTokenRequestModel),
    kind: kubevirtReferenceForModel(UploadTokenRequestModel),
    metadata: {
      name: pvcName,
      namespace,
    },
    spec: {
      pvcName,
    },
  };

  try {
    const resource = await k8sCreate<K8sResourceKind>(UploadTokenRequestModel, tokenRequest);
    return resource?.status?.token;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const createUploadPVC = async (dataVolume: V1alpha1DataVolume) => {
  const dataVolumeName = getName(dataVolume);
  const namespace = getNamespace(dataVolume);

  dataVolume.metadata = dataVolume?.metadata || {};
  dataVolume.metadata.annotations = {
    ...(dataVolume?.metadata?.annotations || {}),
    [CDI_BIND_REQUESTED_ANNOTATION]: 'true',
  };

  try {
    const dv = await k8sCreate(DataVolumeModel, dataVolume);
    await waitForUploadReady(dv);
    const token = await createUploadToken(dataVolumeName, namespace);

    return { token };
  } catch (error) {
    if (error instanceof PVCInitError) {
      throw new PVCInitError();
    }
    throw new Error(error.message);
  }
};
