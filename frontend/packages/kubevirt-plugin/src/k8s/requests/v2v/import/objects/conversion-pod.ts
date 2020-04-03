import { ImagePullPolicy } from '@console/internal/module/k8s';
import { PodWrappper } from '../../../../wrapper/k8s/pod-wrapper';
import {
  CONVERSION_BASE_NAME,
  CONVERSION_GENERATE_NAME,
  CONVERSION_VDDK_INIT_POD_NAME,
  CONVERSION_VDDK_MOUNT_PATH,
  CONVERSION_VOLUME_VDDK_NAME,
} from '../../../../../constants/v2v';

export const buildConversionPod = ({
  vmName,
  namespace,
  serviceAccountName,
  secretName,
  imagePullPolicy,
  image,
  vddkInitImage,
}: {
  vmName: string;
  namespace: string;
  serviceAccountName: string;
  secretName: string;
  imagePullPolicy: ImagePullPolicy;
  image: string;
  vddkInitImage: string;
}) =>
  new PodWrappper()
    .init({
      generateName: `${CONVERSION_GENERATE_NAME}${vmName}-`,
      namespace,
      restartPolicy: 'Never',
    })
    .setServiceAccountName(serviceAccountName)
    .addInitContainers({
      name: CONVERSION_VDDK_INIT_POD_NAME,
      image: vddkInitImage,
      volumeMounts: [
        {
          name: CONVERSION_VOLUME_VDDK_NAME,
          mountPath: CONVERSION_VDDK_MOUNT_PATH,
        },
      ],
    })
    .addContainers({
      name: CONVERSION_BASE_NAME,
      imagePullPolicy,
      image,
      securityContext: {
        privileged: true,
      },
      volumeMounts: [
        {
          name: 'configuration',
          mountPath: '/data/input',
        },
        {
          name: 'kvm',
          mountPath: '/dev/kvm',
        },
        {
          name: CONVERSION_VOLUME_VDDK_NAME,
          mountPath: CONVERSION_VDDK_MOUNT_PATH,
        },
      ],
      volumeDevices: [],
    })
    .addVolumes(
      {
        name: 'configuration',
        secret: {
          secretName,
        },
      },
      {
        name: 'kvm',
        hostPath: {
          path: '/dev/kvm',
        },
      },
      {
        name: CONVERSION_VOLUME_VDDK_NAME,
        emptyDir: {},
      },
    )
    .asResource();
